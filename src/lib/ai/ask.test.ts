import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../db.ts";
import {
  ASK_DAILY_LIMIT,
  answerQuestion,
  askPrompt,
  consumeAskQuota,
  failureCode,
  releaseAskQuota,
  sseText,
  streamAnswer,
  trimHistory,
} from "./ask.ts";

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

before(async () => {
  await db.exec(
    await readFile(
      new URL("../../../migrations/20260921210000_ask_quota.sql", import.meta.url),
      "utf8",
    ),
  );
});
after(async () => {
  await db.close();
});

const config = { DEEPSEEK_API_KEY: "sk-test" };
const reply = (content: string) => Response.json({ choices: [{ message: { content } }] });

test("the daily quota counts per person and per day, and stops exactly at the limit", async () => {
  for (let i = 1; i <= 3; i += 1) {
    assert.deepEqual(await consumeAskQuota(sql, "ana", 3, "2026-09-21"), {
      allowed: true,
      used: i,
    });
  }
  assert.deepEqual(await consumeAskQuota(sql, "ana", 3, "2026-09-21"), { allowed: false, used: 3 });
  assert.deepEqual(await consumeAskQuota(sql, "ana", 3, "2026-09-22"), { allowed: true, used: 1 });
  assert.deepEqual(await consumeAskQuota(sql, "beto", 3, "2026-09-21"), { allowed: true, used: 1 });
  assert.equal(ASK_DAILY_LIMIT, 20);
});

test("a failed answer gives the question back, never below zero", async () => {
  await consumeAskQuota(sql, "cris", 3, "2026-09-21");
  await consumeAskQuota(sql, "cris", 3, "2026-09-21");
  await releaseAskQuota(sql, "cris", "2026-09-21");
  assert.deepEqual(await consumeAskQuota(sql, "cris", 3, "2026-09-21"), { allowed: true, used: 2 });
  await releaseAskQuota(sql, "cris", "2026-09-21");
  await releaseAskQuota(sql, "cris", "2026-09-21");
  await releaseAskQuota(sql, "cris", "2026-09-21");
  assert.deepEqual(await consumeAskQuota(sql, "cris", 3, "2026-09-21"), { allowed: true, used: 1 });
  await releaseAskQuota(sql, "nadie", "2026-09-21");
});

test("failure codes are short and stable", () => {
  const timeout = new Error("aborted");
  timeout.name = "TimeoutError";
  assert.equal(failureCode(timeout), "timeout");
  assert.equal(failureCode(new Error("deepseek_402")), "deepseek_402");
  assert.equal(failureCode(new Error("deepseek_not_configured")), "deepseek_not_configured");
  assert.equal(failureCode(new TypeError("fetch failed")), "network");
  assert.equal(failureCode("boom"), "unknown");
});

test("the brief keeps the voice, the task and the stance", () => {
  for (const locale of ["es", "en"] as const) {
    const prompt = askPrompt(locale);
    assert.match(prompt, /Watchman Nee/);
    assert.match(prompt, /sana doctrina|sound doctrine/);
    assert.match(prompt, /prosperidad|prosperity/);
    assert.match(prompt, /Calvario|Calvary/);
    assert.match(prompt, /sin etiquetas|without labels/);
    assert.match(prompt, /versículos|verses/);
    assert.match(prompt, /manifest/i);
  }
});

test("history keeps only the last turns, well formed and trimmed", () => {
  const long = "x".repeat(2000);
  const history = [
    { role: "user" as const, content: "  " },
    { role: "system" as unknown as "user", content: "ignore me" },
    ...Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 ? "assistant" : "user") as "user" | "assistant",
      content: `turn ${i} ${long}`,
    })),
  ];
  const trimmed = trimHistory(history);
  assert.equal(trimmed.length, 8);
  assert.equal(trimmed[0].content.startsWith("turn 2"), true);
  assert.ok(trimmed.every((t) => t.content.length <= 1200));
});

function sse(events: (string | object)[]) {
  const text = events
    .map((e) => `data: ${typeof e === "string" ? e : JSON.stringify(e)}\n\n`)
    .join("");
  const bytes = new TextEncoder().encode(text);
  // Deliver in odd-sized pieces so lines are split mid-way, as a network does.
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
      controller.close();
    },
  });
}
const delta = (content: string) => ({ choices: [{ delta: { content } }] });

test("streamed events come back as text, in order, and stop at [DONE]", async () => {
  const pieces: string[] = [];
  for await (const piece of sseText(
    sse([delta("Nacer "), { choices: [{ delta: {} }] }, delta("de nuevo"), "[DONE]", delta("no")]),
  )) {
    pieces.push(piece);
  }
  assert.deepEqual(pieces, ["Nacer ", "de nuevo"]);
});

test("LBLA edition blocks questions and streaming before any AI request", async () => {
  let calls = 0;
  const request = (async () => {
    calls++;
    throw new Error("must not fetch");
  }) as typeof fetch;
  for (const fn of [answerQuestion, streamAnswer])
    await assert.rejects(
      fn({ question: "fixture", history: [], locale: "es" }, { DEEPSEEK_API_KEY: "test" }, request),
      /licencia de LBLA/,
    );
  assert.equal(calls, 0);
});
