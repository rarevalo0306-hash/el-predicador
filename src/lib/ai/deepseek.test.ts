import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanNote, generateVerseNotes } from "./deepseek.server.ts";

const verses = [
  { id: "jn-3-16", ref: "Juan 3:16", text: "Porque de tal manera amó Dios al mundo…" },
  { id: "sal-23-1", ref: "Salmos 23:1", text: "Jehová es mi pastor; nada me faltará." },
];
const config = { DEEPSEEK_API_KEY: "sk-test" };
const reply = (notes: unknown) =>
  Response.json({ choices: [{ message: { content: JSON.stringify({ notes }) } }] });

test("asks for JSON, sends the key, and keeps only lines that fit the brief", async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const result = await generateVerseNotes(verses, "es", 3, config, async (url, init) => {
    seen = { url: String(url), init: init! };
    return reply({
      "jn-3-16": [
        "Pensé en ti hoy y quise recordarte cuánto te ama Dios.",
        "corto", // too short
        "Que esta palabra te acompañe en tu día 🙏", // emoji
        "Pensé en ti hoy y quise recordarte cuánto te ama Dios.", // duplicate
        "Dios te sostiene aunque no lo sientas; descansa en su amor.",
      ],
      "sal-23-1": "not a list",
    });
  });
  assert.equal(seen!.url, "https://api.deepseek.com/chat/completions");
  const headers = seen!.init.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer sk-test");
  const body = JSON.parse(String(seen!.init.body));
  assert.equal(body.model, "deepseek-flash");
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.deepEqual(result, {
    "jn-3-16": [
      "Pensé en ti hoy y quise recordarte cuánto te ama Dios.",
      "Dios te sostiene aunque no lo sientas; descansa en su amor.",
    ],
    "sal-23-1": [],
  });
});

test("a missing key, a failed call, or non-JSON each fail loudly, never silently", async () => {
  await assert.rejects(generateVerseNotes(verses, "es", 3, {}), /deepseek_not_configured/);
  await assert.rejects(
    generateVerseNotes(verses, "es", 3, config, async () => new Response("no", { status: 429 })),
    /deepseek_429/,
  );
  await assert.rejects(
    generateVerseNotes(verses, "es", 3, config, async () =>
      Response.json({ choices: [{ message: { content: "not json" } }] }),
    ),
    /deepseek_bad_json/,
  );
});

test("cleanNote normalises whitespace and refuses the wrong shape", () => {
  assert.equal(
    cleanNote("  Que  tengas   un día lleno de su paz.  "),
    "Que tengas un día lleno de su paz.",
  );
  assert.equal(cleanNote(42), null);
  assert.equal(cleanNote("x".repeat(221)), null);
});
