import assert from "node:assert/strict";
import { test } from "node:test";
import { apiBibleVerses, BIBLE_CACHE_MS } from "./api-bible-content.ts";
import { referenceMemory, referenceOnly } from "./bible-policy.ts";
test("JSON decoder preserves punctuation, accents, whitespace and verse boundaries", () => {
  const content = [
    { name: "para", attrs: { style: "s1" }, items: [{ type: "text", text: "heading" }] },
    {
      name: "para",
      items: [
        { name: "verse", attrs: { number: "1" } },
        { type: "text", text: "  Árbol—" },
        { name: "char", items: [{ type: "text", text: "sí.  " }] },
        { name: "verse", attrs: { number: "2" } },
        { type: "text", text: "[Palabra]; intacta." },
      ],
    },
  ];
  assert.deepEqual(apiBibleVerses(content), [
    { n: 1, text: "  Árbol—sí.  " },
    { n: 2, text: "[Palabra]; intacta." },
  ]);
  assert.ok(BIBLE_CACHE_MS < 30 * 86400000);
});
test("unknown content and unassigned Scripture fail closed", () => {
  assert.throws(() => apiBibleVerses("<p>not JSON</p>"));
  assert.throws(() => apiBibleVerses([{ type: "text", text: "unassigned" }]));
  assert.throws(() => apiBibleVerses([{ name: "verse", attrs: { number: "2-3" } }]));
});
test("stored favorites keep references without any licensed text or old copyright", () => {
  const verse = {
    id: "rcv-jhn-3-16",
    ref: "Juan 3:16",
    book: "Juan",
    text: "fixture",
    themes: [],
    source: "Old provider",
    copyright: "fixture",
    expiresAt: Date.now() + 1000,
  };
  assert.equal(referenceOnly(verse).text, "");
  assert.equal(referenceMemory({ [verse.id]: verse })[verse.id].source, undefined);
  assert.equal(referenceOnly(verse).ref, verse.ref);
});
