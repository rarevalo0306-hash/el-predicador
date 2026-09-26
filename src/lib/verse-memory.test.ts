import { test } from "node:test";
import assert from "node:assert/strict";
import { canReadAgain, keptVerse, keptVerses, rangeOf } from "./verse-memory.ts";

const verse = (id: string, ref: string, text = "Texto del verso") => ({
  id,
  ref,
  book: "",
  text,
  themes: [],
});

test("a saved Bible verse keeps its reference, never its text", () => {
  assert.equal(keptVerse(verse("rcv-jhn-3-16", "Juan 3:16")).text, "");
  assert.equal(keptVerse(verse("lbla-jhn-3-16", "Juan 3:16")).ref, "Juan 3:16");
  assert.equal(keptVerse(verse("rcv-jhn-3-range-16-18", "Jn 3:16-18")).text, "");
  assert.equal(keptVerse(verse("jn-3-16", "Juan 3:16")).text, "");
  // Messages the app rebuilds from their id.
  assert.equal(keptVerse(verse("doctrina-trinidad", "La Trinidad")).text, "");
  assert.equal(keptVerse(verse("caso-testigos", "Testigos")).text, "");
  assert.equal(keptVerse(verse("nvi-digest", "Recobro y NVI")).text, "");
  assert.equal(keptVerse(verse("evangelio-camino", "El evangelio")).text, "");
});

test("text the app cannot read again is kept", () => {
  assert.equal(canReadAgain(verse("caso-ia-testigos", "Carta")), false);
  assert.equal(keptVerse(verse("caso-ia-testigos", "Carta")).text, "Texto del verso");
  assert.equal(keptVerse(verse("evangelio-oracion", "Oración")).text, "Texto del verso");
  assert.equal(keptVerse(verse("nwt-jn-1-1", "Juan 1:1")).text, "Texto del verso");
});

test("a saved list loses its Bible text and anything malformed", () => {
  const kept = keptVerses({
    "rcv-jhn-3-16": verse("rcv-jhn-3-16", "Juan 3:16"),
    broken: { id: 3 },
    "caso-ia-x": verse("caso-ia-x", "Carta"),
  });
  assert.deepEqual(Object.keys(kept), ["rcv-jhn-3-16", "caso-ia-x"]);
  assert.equal(kept["rcv-jhn-3-16"].text, "");
  assert.equal(kept["caso-ia-x"].text, "Texto del verso");
  assert.deepEqual(keptVerses(null), {});
});

test("a range picked in the reader is read back from its id", () => {
  assert.deepEqual(rangeOf("rcv-jhn-3-range-16-18"), { bookId: "jhn", chapter: 3, numbers: [16, 17, 18] });
  assert.deepEqual(rangeOf("rcv-en-1co-15-range-45,47"), { bookId: "1co", chapter: 15, numbers: [45, 47] });
  assert.equal(rangeOf("rcv-jhn-3-16"), null);
  assert.equal(rangeOf("rcv-nope-3-range-1-2"), null);
});

test("state saved to an account drops the Bible text it carried", async () => {
  const { parsePayload } = await import("./user-state-parse.ts");
  const parsed = parsePayload(
    JSON.stringify({
      favorites: ["rcv-jhn-3-16"],
      verseMemory: { "rcv-jhn-3-16": verse("rcv-jhn-3-16", "Juan 3:16", "Porque de tal manera…") },
    }),
  );
  assert.equal(parsed?.verseMemory["rcv-jhn-3-16"]?.text, "");
  assert.equal(parsed?.verseMemory["rcv-jhn-3-16"]?.ref, "Juan 3:16");
  assert.deepEqual(parsed?.favorites, ["rcv-jhn-3-16"]);
});
