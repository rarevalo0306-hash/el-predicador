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

test("a question goes out with the brief, the history and the key, and the answer comes back", async () => {
  let seen: { init: RequestInit } | null = null;
  const answer = await answerQuestion(
    {
      question: "  ¿Qué significa nacer de nuevo?  ",
      history: [
        { role: "user", content: "Hola" },
        { role: "assistant", content: "Paz a ti." },
      ],
      locale: "es",
    },
    config,
    async (_url, init) => {
      seen = { init: init! };
      return reply("Nacer de nuevo es recibir la vida de Dios (Juan 3:3).");
    },
  );
  assert.equal(answer, "Nacer de nuevo es recibir la vida de Dios (Juan 3:3).");
  const body = JSON.parse(String(seen!.init.body));
  assert.equal(body.messages[0].role, "system");
  assert.equal(body.messages[0].content, askPrompt("es"));
  assert.deepEqual(body.messages.slice(1), [
    { role: "user", content: "Hola" },
    { role: "assistant", content: "Paz a ti." },
    { role: "user", content: "¿Qué significa nacer de nuevo?" },
  ]);
  assert.equal(body.response_format, undefined);
  assert.equal((seen!.init.headers as Record<string, string>).Authorization, "Bearer sk-test");
});

test("a missing key, a failed call or an empty answer fail loudly", async () => {
  const input = { question: "¿Quién es Jesús?", history: [], locale: "en" as const };
  await assert.rejects(answerQuestion(input, {}), /deepseek_not_configured/);
  await assert.rejects(
    answerQuestion(input, config, async () => new Response("no", { status: 503 })),
    /deepseek_503/,
  );
  await assert.rejects(
    answerQuestion(input, config, async () => reply("   ")),
    /deepseek_empty/,
  );
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

test("a streamed answer asks with stream on and fails before streaming when the call fails", async () => {
  let body: Record<string, unknown> = {};
  const gen = await streamAnswer(
    { question: "¿Qué es la fe?", history: [], locale: "es" },
    config,
    async (_url, init) => {
      body = JSON.parse(String(init!.body));
      return new Response(sse([delta("La fe "), delta("es…"), "[DONE]"]), {
        headers: { "Content-Type": "text/event-stream" },
      });
    },
  );
  assert.equal(body.stream, true);
  let text = "";
  for await (const piece of gen) text += piece;
  assert.equal(text, "La fe es…");
  await assert.rejects(
    streamAnswer(
      { question: "x", history: [], locale: "en" },
      config,
      async () => new Response("no", { status: 402 }),
    ),
    /deepseek_402/,
  );
});
