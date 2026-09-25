import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../db.ts";
import { runScheduledMessages, validCronAuthorization } from "./worker.server.ts";
import { parseStatusCallback, recordProviderStatus } from "./delivery-status.ts";
import {
  saveSchedule,
  listSchedules,
  setScheduleEnabled,
  deleteSchedule,
} from "./schedules.server.ts";
import type { ScheduleInput } from "../message-schedule.ts";
const db = new PGlite();
const sql = (async (parts: TemplateStringsArray, ...values: unknown[]) => {
  let text = parts[0];
  values.forEach((_, i) => {
    text += `$${i + 1}${parts[i + 1]}`;
  });
  return (await db.query(text, values)).rows;
}) as Sql;
sql.query = async <T>(text: string, values: unknown[] = []) =>
  (await db.query<T>(text, values)).rows;
const schedule: ScheduleInput = {
  recipientName: "Test",
  phone: "+12015550123",
  message: "Test",
  channel: "whatsapp",
  days: [0, 1, 2, 3, 4, 5, 6],
  time: "09:15",
  timeZone: "America/New_York",
  consent: true,
};
const now = new Date("2026-09-17T13:15:30Z");
const ready = () => ({ whatsapp: true, sms: true });
before(async () => {
  // Apply every migration, in name order, the way the app does. Naming them one
  // by one here meant a new column existed in production and not in this test.
  const dir = new URL("../../../migrations/", import.meta.url);
  for (const name of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, dir), "utf8"));
  }
  await db.exec(
    `insert into "user" (id,name,email,"emailVerified","createdAt","updatedAt") values ('owner','Owner','owner@example.com',true,now(),now()),('other','Other','other@example.com',true,now(),now())`,
  );
});
beforeEach(async () => {
  await db.exec("truncate message_schedules cascade");
});
after(async () => {
  await db.close();
});
async function due() {
  const { id } = await saveSchedule("owner", schedule, sql);
  await sql`update message_schedules set enabled=true,next_run_at=${"2026-09-17T13:15:00Z"} where id=${id}`;
  return id;
}
test("cron rejects absent, invalid and prefix-confused authorization", () => {
  assert.equal(validCronAuthorization(null, undefined), false);
  assert.equal(validCronAuthorization("Bearer undefined", undefined), false);
  assert.equal(validCronAuthorization("Bearer x", "secret"), false);
  assert.equal(validCronAuthorization("Bearer secret", "secret"), true);
});
test("deleting frees a slot, belongs to the owner, and waits out a lease", async () => {
  const { id } = await saveSchedule("owner", schedule, sql);
  await assert.rejects(() => deleteSchedule("other", id, sql), /scheduleBusy/);
  assert.equal((await listSchedules("owner", sql)).schedules.length, 1);
  // A row being delivered right now must not vanish from under the worker.
  await sql`update message_schedules set lease_until = now() + interval '3 minutes' where id=${id}`;
  await assert.rejects(() => deleteSchedule("owner", id, sql), /scheduleBusy/);
  await sql`update message_schedules set lease_until = null where id=${id}`;
  await sql`insert into message_deliveries (id, schedule_id, scheduled_for, status)
    values ('d1', ${id}, ${"2026-09-17T13:15:00Z"}, 'accepted')`;
  await deleteSchedule("owner", id, sql);
  assert.equal((await listSchedules("owner", sql)).schedules.length, 0);
  // The receipts of a deleted schedule go with it.
  const [{ count }] = await sql<{ count: number }>`select count(*)::int as count
    from message_deliveries where schedule_id = ${id}`;
  assert.equal(count, 0);
});
test("schedules persist days, minutes and zone, and are isolated by account", async () => {
  const { id } = await saveSchedule("owner", schedule, sql);
  const own = await listSchedules("owner", sql);
  assert.equal(own.schedules[0].time, "09:15");
  assert.equal(own.schedules[0].enabled, false);
  assert.equal((await listSchedules("other", sql)).schedules.length, 0);
  await assert.rejects(
    () => saveSchedule("other", { ...schedule, id, message: "Intrusion" }, sql),
    /scheduleBusy/,
  );
  await assert.rejects(() => setScheduleEnabled("other", id, false, sql), /scheduleBusy/);
  await assert.rejects(() => setScheduleEnabled("owner", id, true, sql), /scheduleNotConnected/);
});
test("overlapping and repeated cron runs submit an occurrence only once", async () => {
  await due();
  let sent = 0;
  const send = async () => {
    sent++;
    return { status: "accepted" as const, providerId: "SMtest" };
  };
  await Promise.all([
    runScheduledMessages(sql, now, send, ready),
    runScheduledMessages(sql, now, send, ready),
  ]);
  await runScheduledMessages(sql, new Date(now.getTime() + 60_000), send, ready);
  assert.equal(sent, 1);
  const { schedules } = await listSchedules("owner", sql);
  assert.equal(schedules[0].lastStatus, "accepted");
  assert.equal(schedules[0].nextRunAt, "2026-09-18T13:15:00.000Z");
});
test("persists the language and sends the exact English message through the matching channel", async () => {
  const { id } = await saveSchedule(
    "owner",
    {
      ...schedule,
      messageLocale: "en",
      verseId: "1ti-4-12",
      message: "Let no one despise your youth.",
    },
    sql,
  );
  const saved = (await listSchedules("owner", sql)).schedules[0];
  assert.equal(saved.messageLocale, "en");
  assert.equal(saved.verseId, "1ti-4-12");
  await sql`update message_schedules set enabled=true,next_run_at=${"2026-09-17T13:15:00Z"} where id=${id}`;
  let calls = 0;
  await runScheduledMessages(
    sql,
    now,
    async (data) => {
      calls++;
      assert.equal(data.messageLocale, "en");
      assert.equal(data.message, saved.message);
      return { status: "accepted" };
    },
    (_user, _config, language) => ({ whatsapp: language === "en", sms: true }),
  );
  assert.equal(calls, 1);
});
test("activation requires consent, computes a future occurrence and can be paused", async () => {
  const { id } = await saveSchedule("owner", { ...schedule, consent: false }, sql);
  await assert.rejects(
    () => setScheduleEnabled("owner", id, true, sql, ready),
    /scheduleConsentRequired/,
  );
  await saveSchedule("owner", { ...schedule, id }, sql);
  await setScheduleEnabled("owner", id, true, sql, ready);
  const active = (await listSchedules("owner", sql)).schedules[0];
  assert.equal(active.enabled, true);
  assert.ok(new Date(active.nextRunAt!).getTime() > Date.now());
  await setScheduleEnabled("owner", id, false, sql, ready);
  assert.equal((await listSchedules("owner", sql)).schedules[0].nextRunAt, null);
});
test("activation cannot overwrite an edit completed by another request", async () => {
  const { id } = await saveSchedule("owner", schedule, sql);
  const racingSql = (async (parts: TemplateStringsArray, ...values: unknown[]) => {
    const rows = await sql(parts, ...values);
    if (parts[0].startsWith("select *, updated_at")) {
      await sql`update message_schedules set message='Edited', updated_at=updated_at+interval '1 second' where id=${id}`;
    }
    return rows;
  }) as Sql;
  await assert.rejects(
    () => setScheduleEnabled("owner", id, true, racingSql, ready),
    /scheduleBusy/,
  );
  const saved = (await listSchedules("owner", sql)).schedules[0];
  assert.equal(saved.message, "Edited");
  assert.equal(saved.enabled, false);
});
test("provider uncertainty is recorded without automatically repeating the message", async () => {
  await due();
  let sent = 0;
  const send = async () => {
    sent++;
    throw new Error("timeout after provider acceptance");
  };
  await runScheduledMessages(sql, now, send, ready);
  await runScheduledMessages(sql, now, send, ready);
  assert.equal(sent, 1);
  assert.equal((await listSchedules("owner", sql)).schedules[0].lastStatus, "unknown");
});
test("an interrupted occurrence is never sent again when its lease expires", async () => {
  const id = await due();
  await sql`insert into message_deliveries (id,schedule_id,scheduled_for,status) values ('interrupted',${id},${"2026-09-17T13:15:00Z"},'sending')`;
  let sent = 0;
  await runScheduledMessages(
    sql,
    now,
    async () => {
      sent++;
      return { status: "accepted" };
    },
    ready,
  );
  assert.equal(sent, 0);
  assert.equal((await listSchedules("owner", sql)).schedules[0].lastStatus, "unknown");
});
test("paused and stale schedules do not send, and disabling configuration stops sending", async () => {
  const id = await due();
  let sent = 0;
  const send = async () => {
    sent++;
    return { status: "accepted" as const };
  };
  await runScheduledMessages(sql, new Date("2026-09-17T14:00:00Z"), send, ready);
  assert.equal(sent, 0);
  assert.equal((await listSchedules("owner", sql)).schedules[0].lastStatus, "skipped");
  await sql`update message_schedules set next_run_at=${"2026-09-18T13:15:00Z"} where id=${id}`;
  await runScheduledMessages(sql, new Date("2026-09-18T13:15:01Z"), send, () => ({
    whatsapp: false,
    sms: false,
  }));
  assert.equal(sent, 0);
  assert.equal((await listSchedules("owner", sql)).schedules[0].enabled, false);
});
test("editing pauses a schedule and refuses changes while a send is in progress", async () => {
  const id = await due();
  await saveSchedule("owner", { ...schedule, id, time: "15:45" }, sql);
  const saved = (await listSchedules("owner", sql)).schedules[0];
  assert.equal(saved.enabled, false);
  assert.equal(saved.time, "15:45");
  await sql`update message_schedules set lease_until=now()+interval '3 minutes' where id=${id}`;
  await assert.rejects(() => saveSchedule("owner", { ...schedule, id }, sql), /scheduleBusy/);
});
test("the carrier's final word is recorded on the accepted message, and never moves backwards", async () => {
  await due();
  await runScheduledMessages(
    sql,
    now,
    async () => ({ status: "accepted" as const, providerId: "SMfinal" }),
    ready,
  );
  const cb = (fields: Record<string, string>) =>
    recordProviderStatus(sql, parseStatusCallback({ MessageSid: "SMfinal", ...fields })!);
  // Reports can arrive out of order: "delivered" first, then a late "sent".
  assert.deepEqual(await cb({ MessageStatus: "delivered" }), { recorded: true });
  assert.deepEqual(await cb({ MessageStatus: "sent" }), { recorded: false, reason: "older" });
  let [{ schedules }] = [await listSchedules("owner", sql)];
  assert.equal(schedules[0].lastProviderStatus, "delivered");
  assert.equal(schedules[0].lastProviderErrorCode, null);
  // A sid the app never sent is nobody's message.
  assert.deepEqual(
    await recordProviderStatus(
      sql,
      parseStatusCallback({ MessageSid: "SMnotours", MessageStatus: "failed" })!,
    ),
    { recorded: false, reason: "unknown_sid" },
  );
  // A failure carries the carrier's code; garbage in the fields is dropped.
  assert.equal(parseStatusCallback({ MessageSid: "bad sid", MessageStatus: "sent" }), null);
  assert.equal(parseStatusCallback({ MessageSid: "SMx", MessageStatus: "exploded" }), null);
  assert.deepEqual(
    parseStatusCallback({ MessageSid: "SMx", MessageStatus: "Undelivered", ErrorCode: "30007" }),
    {
      sid: "SMx",
      status: "undelivered",
      errorCode: "30007",
    },
  );
  assert.equal(
    parseStatusCallback({ MessageSid: "SMx", MessageStatus: "failed", ErrorCode: "x" })!.errorCode,
    null,
  );
  [{ schedules }] = [await listSchedules("owner", sql)];
  assert.equal(schedules[0].lastProviderStatus, "delivered");
});
test("a theme send uses a freshly written line, and a prepared one when writing fails", async () => {
  const { id } = await saveSchedule(
    "owner",
    { ...schedule, message: "", themeId: "fe", senderName: "Ricardo" },
    sql,
  );
  await sql`insert into verse_texts (verse_id, locale, ref, text, source) values ('w','es','Ref W','Texto W','RV')`;
  await sql`insert into verse_notes (verse_id, locale, position, text) values ('w','es',0,'Nota W')`;
  const verses = async () => [{ id: "w", ref: "Ref W", text: "" }];
  const sent: string[] = [];
  const send = async (data: { message: string }) => {
    sent.push(data.message);
    return { status: "accepted" as const, providerId: `SM${sent.length}` };
  };
  const asked: { ref: string; text: string; theme: string; name: string | null }[] = [];
  const writers = [
    async (input: { ref: string; text: string; theme: string; name: string | null }) => {
      asked.push(input);
      return "Hoy esta palabra es para ti; descansa en el Señor.";
    },
    async () => {
      throw new Error("deepseek_503");
    },
  ];
  for (let i = 0; i < writers.length; i++) {
    const at = new Date(now.getTime() + i * 86_400_000);
    await sql`update message_schedules set enabled=true,next_run_at=${at.toISOString()} where id=${id}`;
    await runScheduledMessages(sql, at, send, ready, verses, writers[i]);
  }
  assert.equal(sent.length, 2);
  assert.match(sent[0], /^«Texto W»\n— Ref W\nRV\n\nHoy esta palabra es para ti; descansa en el Señor\.\n\nCon cariño, Ricardo$/);
  assert.equal(asked[0].text, "Texto W");
  assert.equal(asked[0].ref, "Ref W");
  assert.match(sent[1], /\n\nNota W\n\nCon cariño, Ricardo$/);
});
test("a theme schedule walks its verses in order and varies the line, without repeating", async () => {
  const { id } = await saveSchedule(
    "owner",
    { ...schedule, message: "", themeId: "fe", senderName: "Ricardo" },
    sql,
  );
  await sql`insert into verse_texts (verse_id, locale, ref, text, source) values ('a','es','Ref A','Texto A','RV')`;
  await sql`insert into verse_notes (verse_id, locale, position, text) values ('a','es',0,'Nota uno'),('a','es',1,'Nota dos')`;
  const verses = async () => [
    { id: "a", ref: "Ref A", text: "" },
    { id: "b", ref: "Ref B", text: "Texto B en catálogo" },
  ];
  const sent: string[] = [];
  const send = async (data: { message: string }) => {
    sent.push(data.message);
    return { status: "accepted" as const, providerId: `SM${sent.length}` };
  };
  for (let i = 0; i < 3; i++) {
    const at = new Date(now.getTime() + i * 86_400_000);
    await sql`update message_schedules set enabled=true,next_run_at=${at.toISOString()} where id=${id}`;
    await runScheduledMessages(sql, at, send, ready, verses);
  }
  assert.equal(sent.length, 3);
  assert.match(sent[0], /^«Texto A»\n— Ref A\nRV\n\nNota uno\n\nCon cariño, Ricardo$/);
  // The catalog's own Spanish text serves a verse that was never prepared.
  assert.match(sent[1], /«Texto B en catálogo»\n— Ref B/);
  // Back to the first verse with its other line, not the same one again.
  assert.match(sent[2], /^«Texto A»\n— Ref A\nRV\n\nNota dos\n/);
  // A verse without any text anywhere fails visibly rather than sending "«»".
  const { id: bare } = await saveSchedule(
    "owner",
    { ...schedule, phone: "+12015550124", message: "", themeId: "paz" },
    sql,
  );
  await sql`update message_schedules set enabled=true,next_run_at=${now.toISOString()} where id=${bare}`;
  const before = sent.length;
  await runScheduledMessages(sql, now, send, ready, async () => [{ id: "z", ref: "Z", text: "" }]);
  assert.equal(sent.length, before);
  const [row] = await sql<{ status: string; error_code: string }>`
    select status, error_code from message_deliveries where schedule_id = ${bare}`;
  assert.deepEqual(row, { status: "failed", error_code: "verse_unavailable" });
});
test("private scheduling tables have row level security enabled", async () => {
  const rows = await sql<{
    relrowsecurity: boolean;
  }>`select relrowsecurity from pg_class where relname in ('message_schedules','message_deliveries')`;
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.relrowsecurity));
});
