import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  challengeFor,
  consumeNativeCode,
  hashCode,
  issueNativeCode,
  validNativeIntent,
} from "./native-handoff.ts";
import type { Sql } from "../db.ts";

async function setup() {
  const db = new PGlite();
  for (const name of [
    "0001_auth.sql",
    "0002_preacher.sql",
    "0003_contacts.sql",
    "20260917153827_scheduled_messages.sql",
    "20260921210000_ask_quota.sql",
    "20260926120000_user_roles.sql",
    "20261023190000_account_deletion_and_native_auth.sql",
  ]) {
    await db.exec(await readFile(new URL(`../../../migrations/${name}`, import.meta.url), "utf8"));
  }
  const sql = Object.assign(
    () => {
      throw new Error("Use parameterized query");
    },
    {
      query: async <T>(query: string, params?: unknown[]) =>
        (await db.query<T>(query, params)).rows,
    },
  ) as unknown as Sql;
  for (const id of ["owner", "other"]) {
    await db.query('insert into "user" (id,name,email,"emailVerified") values ($1,$1,$2,true)', [
      id,
      `${id}@example.invalid`,
    ]);
    await db.query(
      'insert into session (id,token,"expiresAt","updatedAt","userId") values ($1,$1,now()+interval \'1 day\',now(),$2)',
      [id + "-session", id],
    );
  }
  return { db, sql };
}

test("PKCE handoff rejects wrong proof, is hashed at rest, expires and cannot replay", async () => {
  const { db, sql } = await setup();
  try {
    const verifier = randomBytes(32).toString("base64url");
    assert.equal(validNativeIntent(challengeFor(verifier), verifier), true);
    assert.equal(validNativeIntent("javascript:alert(1)", verifier), false);
    const code = await issueNativeCode(sql, {
      userId: "owner",
      sessionId: "owner-session",
      challenge: challengeFor(verifier),
      ciphertext: "encrypted-only",
    });
    const stored = (
      await db.query<{ code_hash: string }>("select code_hash from native_auth_handoffs")
    ).rows[0];
    assert.equal(stored.code_hash, hashCode(code));
    assert.notEqual(stored.code_hash, code);
    assert.equal(await consumeNativeCode(sql, code, randomBytes(32).toString("base64url")), null);
    const results = await Promise.all([
      consumeNativeCode(sql, code, verifier),
      consumeNativeCode(sql, code, verifier),
    ]);
    assert.deepEqual(results.sort(), ["encrypted-only", null].sort());
    assert.equal(await consumeNativeCode(sql, code, verifier), null);
    const expired = await issueNativeCode(sql, {
      userId: "owner",
      sessionId: "owner-session",
      challenge: challengeFor(verifier),
      ciphertext: "encrypted",
    });
    await db.exec("update native_auth_handoffs set expires_at=now()-interval '1 second'");
    assert.equal(await consumeNativeCode(sql, expired, verifier), null);
  } finally {
    await db.close();
  }
});

test("revoked sessions cannot exchange a handoff", async () => {
  const { db, sql } = await setup();
  try {
    const verifier = randomBytes(32).toString("base64url");
    const code = await issueNativeCode(sql, {
      userId: "owner",
      sessionId: "owner-session",
      challenge: challengeFor(verifier),
      ciphertext: "encrypted",
    });
    await db.exec("delete from session where id='owner-session'");
    assert.equal(await consumeNativeCode(sql, code, verifier), null);
  } finally {
    await db.close();
  }
});

test("user deletion atomically removes owned data and leaves other accounts intact", async () => {
  const { db } = await setup();
  try {
    for (const id of ["owner", "other"]) {
      await db.query("insert into preacher_state(user_id,payload) values ($1,'{}')", [id]);
      await db.query("insert into ask_quota(user_id,day,count) values ($1,current_date,1)", [id]);
      await db.query(
        "insert into user_roles(user_id,role,granted_by) values ($1,'manager','owner')",
        [id],
      );
      await db.query(
        "insert into contacts(name,email,phone,address,user_id) values ($1,$2,'+12025550100','test address',$1)",
        [id, `${id}@example.invalid`],
      );
      await db.query(
        "insert into message_schedules(id,user_id,recipient_name,phone,message,channel,days,send_time,time_zone) values ($1,$1,'Test','+12025550100','Test','sms','[1]','08:00','America/New_York')",
        [id],
      );
      await db.query(
        "insert into message_deliveries(id,schedule_id,scheduled_for,status) values ($1,$1,now(),'accepted')",
        [id],
      );
    }
    await db.exec("delete from \"user\" where id='owner'");
    for (const table of [
      "preacher_state",
      "ask_quota",
      "user_roles",
      "contacts",
      "message_schedules",
      "message_deliveries",
      "session",
      "user",
    ]) {
      assert.equal(
        Number(
          (
            await db.query<{ count: number }>(
              `select count(*) as count from ${table === "user" ? '"user"' : table}`,
            )
          ).rows[0].count,
        ),
        1,
        table,
      );
    }
    await assert.rejects(
      db.query("insert into preacher_state(user_id,payload) values ('owner','{}')"),
    );
    assert.equal(
      (await db.query<{ granted_by: string }>("select granted_by from user_roles")).rows[0]
        .granted_by,
      "deleted-user",
    );
  } finally {
    await db.close();
  }
});

test("only verified email ownership removes legacy unlinked registrations", async () => {
  const { db } = await setup();
  try {
    await db.exec(`insert into contacts(name,email,phone,address) values
      ('Legacy owner','owner@example.invalid','+12025550100','test'),
      ('Unverified','unverified@example.invalid','+12025550101','test');
      insert into "user"(id,name,email,"emailVerified") values ('unverified','Test','unverified@example.invalid',false);
      delete from "user" where id in ('owner','unverified');`);
    const contacts = (await db.query<{ email: string }>("select email from contacts")).rows;
    assert.deepEqual(
      contacts.map((x) => x.email),
      ["unverified@example.invalid"],
    );
  } finally {
    await db.close();
  }
});
