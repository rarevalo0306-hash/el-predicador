import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanNote, generateVerseNotes, systemPrompt } from "./deepseek.server.ts";

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
  assert.equal(body.messages[0].content, systemPrompt("es", 3));
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

test("the brief names the ministry, the one-God stance, and shows sample lines", () => {
  for (const locale of ["es", "en"] as const) {
    const prompt = systemPrompt(locale, 3);
    assert.match(prompt, /Watchman Nee/);
    assert.match(prompt, /Witness Lee/);
    assert.match(prompt, /sana doctrina|sound doctrine/);
    assert.match(prompt, /Calvario|Calvary/);
    assert.match(prompt, /no te encierres en doctrinas|do not box yourself into doctrines/);
    assert.match(prompt, /por su nombre|by name/);
    assert.match(prompt, /prosperidad|prosperity/);
    assert.match(prompt, /ap[oó]stoles|apostles/);
    assert.match(prompt, /manifest/i);
    assert.match(prompt, /\n- .{20,}/);
    assert.doesNotMatch(prompt, /\{n\}|\{examples\}/);
    assert.match(prompt, / 3 /);
  }
});

test("lines that use the labels the owner rejects are dropped whatever the model does", () => {
  for (const line of [
    "Descansa hoy en la Trinidad divina que te sostiene en todo momento.",
    "El Dios Triuno se imparte en ti como vida y suministro cada mañana.",
    "Rest today in the Triune God who dispenses Himself into you as life.",
    "God is three persons who dwell in you today and hold you in peace.",
    "En toda la plenitud de la Deidad hay descanso para ti hoy, ve a Él.",
    "Declaro que este mes llega tu bendición financiera; siembra con fe.",
    "I decree a breakthrough over your finances this week; sow your seed.",
    "El profeta tiene una palabra profética para ti; recibe la unción hoy.",
    "The apostle said the Lord told me to tell you your miracle is here.",
    "Hoy es tu día: Dios te va a prosperar en todo lo que emprendas.",
  ]) {
    assert.equal(cleanNote(line), null, line);
  }
  assert.equal(
    cleanNote("Vuélvete a tu espíritu un momento e invoca al Señor; ahí está tu paz hoy."),
    "Vuélvete a tu espíritu un momento e invoca al Señor; ahí está tu paz hoy.",
  );
});

test("a blocked word the verse itself uses does not cost the line", () => {
  const prophecy =
    "Seguid el amor; y procurad los dones espirituales, pero sobre todo que profeticéis.";
  assert.equal(
    cleanNote(
      "Hermano, profetizar aquí es hablar para edificar; pide al Señor palabras que consuelen.",
      prophecy,
    ),
    "Hermano, profetizar aquí es hablar para edificar; pide al Señor palabras que consuelen.",
  );
  assert.equal(
    cleanNote(
      "Hermano, profetizar aquí es hablar para edificar; pide al Señor palabras que consuelen.",
      "Jesús lloró.",
    ),
    null,
  );
  const apostles =
    "Y el muro de la ciudad tenía doce cimientos, y sobre ellos los doce nombres de los doce apóstoles del Cordero.";
  assert.ok(
    cleanNote(
      "Los apóstoles del Cordero son cimiento; tú descansas sobre lo que Cristo ya edificó.",
      apostles,
    ),
  );
  assert.equal(
    cleanNote("El apóstol de hoy tiene una palabra para ti; recíbela con fe.", "Jesús lloró."),
    null,
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
