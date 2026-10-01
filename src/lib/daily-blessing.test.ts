import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "./db.ts";
import { blessingFor, clearBlessingCooldown, type BlessingDeps } from "./daily-blessing.server.ts";
import { BLESSINGS, fallbackBlessing } from "./blessings.ts";

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

const DAY = "2026-10-01";
const WHOLE = "Que el Señor te guarde hoy y sea tu paz en todo lo que hagas.";

function deps(answers: (string | null | Error)[], overrides: Partial<BlessingDeps> = {}) {
  const state = { calls: 0 };
  const value: BlessingDeps = {
    configured: true,
    write: async () => {
      const answer = answers[state.calls] ?? null;
      state.calls += 1;
      if (answer instanceof Error) throw answer;
      return answer;
    },
    ...overrides,
  };
  return { value, state };
}

async function kept() {
  const rows = await sql<{ text: string }>`
    select text from daily_blessings where day = ${DAY} and locale = 'es'`;
  return rows[0]?.text ?? null;
}

before(async () => {
  const dir = new URL("../../migrations/", import.meta.url);
  for (const name of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, dir), "utf8"));
  }
});
beforeEach(async () => {
  clearBlessingCooldown();
  await db.exec("truncate daily_blessings");
});
after(async () => {
  await db.close();
});

test("a blessing is written once a day and kept for everyone", async () => {
  const first = deps([WHOLE]);
  assert.deepEqual(await blessingFor(sql, DAY, "es", first.value), { text: WHOLE });
  assert.equal(await kept(), WHOLE);
  const second = deps([]);
  assert.deepEqual(await blessingFor(sql, DAY, "es", second.value), { text: WHOLE });
  assert.equal(second.state.calls, 0, "the kept one is read, not written again");
});

test("a cut-off answer is retried, and two failures show the prepared one unsaved", async () => {
  const retried = deps(["Que el Señor te guarde hoy y", WHOLE]);
  assert.equal((await blessingFor(sql, DAY, "es", retried.value)).text, WHOLE);
  assert.equal(retried.state.calls, 2);

  await db.exec("truncate daily_blessings");
  clearBlessingCooldown();
  const failing = deps([new Error("deepseek_500"), null]);
  const shown = await blessingFor(sql, DAY, "es", failing.value);
  assert.deepEqual(shown, fallbackBlessing(DAY, "es"));
  assert.equal(shown.fallback, true);
  assert.equal(await kept(), null, "a prepared blessing is never stored as the day's");
});

test("after a failure the day waits before asking again; without DeepSeek nothing is asked", async () => {
  let clock = 1_000_000;
  const now = () => clock;
  await blessingFor(sql, DAY, "es", deps([null, null], { now }).value);
  const soon = deps([WHOLE], { now });
  assert.equal((await blessingFor(sql, DAY, "es", soon.value)).fallback, true);
  assert.equal(soon.state.calls, 0);
  clock += 3 * 60_000 + 1;
  assert.equal((await blessingFor(sql, DAY, "es", deps([WHOLE], { now }).value)).text, WHOLE);

  await db.exec("truncate daily_blessings");
  const off = deps([WHOLE], { configured: false });
  assert.equal((await blessingFor(sql, DAY, "en", off.value)).fallback, true);
  assert.equal(off.state.calls, 0);
});

test("the prepared blessings are whole sentences, the same each day and varied across days", () => {
  for (const locale of ["es", "en"] as const) {
    for (const line of BLESSINGS[locale]) assert.match(line, /\.$/);
    assert.equal(BLESSINGS[locale].length, BLESSINGS.es.length, "both languages have as many");
  }
  assert.deepEqual(fallbackBlessing(DAY, "es"), fallbackBlessing(DAY, "es"));
  const week = new Set(
    ["01", "02", "03", "04", "05", "06", "07"].map(
      (d) => fallbackBlessing(`2026-10-${d}`, "es").text,
    ),
  );
  assert.ok(week.size >= 5, "a week shows mostly different blessings");
});
