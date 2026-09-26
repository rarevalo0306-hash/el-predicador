import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "./db.ts";
import { clearCooldown, reflectionFor, type ReflectionDeps } from "./daily-reflection.server.ts";

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

const DAY = "2026-09-26";
const VERSE = "test-verse";
const WHOLE =
  "Amigo mío, no cargues solo el peso de este día. El Señor vive en ti; invoca Su nombre y deja que Su paz gobierne tu corazón.";
const CUT = "Amigo mío, no cargues solo el peso de este día. Vuélvete a tu espíritu";

/** Stand-ins for DeepSeek: each call takes the next answer; `calls` counts them. */
function deps(answers: (string | null | Error)[], overrides: Partial<ReflectionDeps> = {}) {
  const state = { calls: 0 };
  const value: ReflectionDeps = {
    configured: true,
    verseText: async () => ({ ref: "Test 1:1", text: "Texto del versículo." }),
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

async function keptText() {
  const rows = await sql<{ text: string }>`
    select text from daily_reflections where day = ${DAY} and locale = 'es'`;
  return rows[0]?.text ?? null;
}

before(async () => {
  const dir = new URL("../../migrations/", import.meta.url);
  for (const name of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, dir), "utf8"));
  }
});
beforeEach(async () => {
  clearCooldown();
  await db.exec("truncate daily_reflections, verse_notes");
});
after(async () => {
  await db.close();
});

test("a whole reflection is written once and kept for everyone", async () => {
  const first = deps([WHOLE]);
  assert.deepEqual(await reflectionFor(sql, DAY, "es", VERSE, first.value), {
    verseId: VERSE,
    text: WHOLE,
  });
  assert.equal(await keptText(), WHOLE);

  const second = deps([]);
  assert.equal((await reflectionFor(sql, DAY, "es", VERSE, second.value))?.text, WHOLE);
  assert.equal(second.state.calls, 0, "the kept one is read, not written again");
});

test("a reflection kept cut off is replaced, never shown", async () => {
  await sql`insert into daily_reflections (day, locale, verse_id, text)
    values (${DAY}, 'es', ${VERSE}, ${CUT})`;
  const run = deps([WHOLE]);
  const shown = await reflectionFor(sql, DAY, "es", VERSE, run.value);
  assert.equal(shown?.text, WHOLE);
  assert.equal(await keptText(), WHOLE);
});

test("an answer that ends mid-sentence is retried and never kept", async () => {
  const run = deps([CUT, WHOLE]);
  assert.equal((await reflectionFor(sql, DAY, "es", VERSE, run.value))?.text, WHOLE);
  assert.equal(run.state.calls, 2);
});

test("when both tries fail: a whole prepared line, shown and not kept", async () => {
  await sql`insert into verse_notes (verse_id, locale, position, text) values
    (${VERSE}, 'es', 1, 'Una línea sin terminar'),
    (${VERSE}, 'es', 2, 'Dios te sostiene hoy; descansa en Él.')`;
  const run = deps([new Error("deepseek_500"), null]);
  const shown = await reflectionFor(sql, DAY, "es", VERSE, run.value);
  assert.deepEqual(shown, {
    verseId: VERSE,
    text: "Dios te sostiene hoy; descansa en Él.",
    fallback: true,
  });
  assert.equal(await keptText(), null, "a fallback is never stored as the day's word");
  assert.equal(run.state.calls, 2);
});

test("after a failure the day waits a few minutes before asking again", async () => {
  let clock = 1_000_000;
  const now = () => clock;
  const failing = deps([null, null], { now });
  assert.equal(await reflectionFor(sql, DAY, "es", VERSE, failing.value), null);

  const soon = deps([WHOLE], { now });
  assert.equal(await reflectionFor(sql, DAY, "es", VERSE, soon.value), null);
  assert.equal(soon.state.calls, 0, "no request while the day is on hold");

  clock += 3 * 60_000 + 1;
  const later = deps([WHOLE], { now });
  assert.equal((await reflectionFor(sql, DAY, "es", VERSE, later.value))?.text, WHOLE);
});

test("without DeepSeek, or without the verse's words, nothing is requested", async () => {
  const off = deps([WHOLE], { configured: false });
  assert.equal(await reflectionFor(sql, DAY, "es", VERSE, off.value), null);
  assert.equal(off.state.calls, 0);

  const noText = deps([WHOLE], { verseText: async () => ({ ref: "", text: " " }) });
  assert.equal(await reflectionFor(sql, DAY, "es", VERSE, noText.value), null);
  assert.equal(noText.state.calls, 0);
});

test("logs name the day and language, never the text", async () => {
  const logged: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => logged.push(JSON.stringify(args));
  try {
    await sql`insert into daily_reflections (day, locale, verse_id, text)
      values (${DAY}, 'es', ${VERSE}, ${CUT})`;
    await reflectionFor(sql, DAY, "es", VERSE, deps([CUT, new Error("deepseek_timeout")]).value);
  } finally {
    console.warn = original;
  }
  assert.ok(logged.length >= 3);
  for (const line of logged) {
    assert.ok(line.includes(DAY));
    assert.ok(!line.includes("Amigo"), "no reflection text in the logs");
  }
});
