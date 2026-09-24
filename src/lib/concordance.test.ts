import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanWords, lsmSearchPage, markWords, placeOf, readHits } from "./concordance.ts";

test("only what LSM's search accepts is sent", () => {
  assert.equal(cleanWords("  Señor   Espíritu!! "), "Señor Espíritu");
  assert.equal(cleanWords("gracia; 3:16 <b>"), "gracia b");
  assert.equal(cleanWords("a b c d e f g h"), "a b c d e f");
});

test("a hit's place comes from its link, even without a book name", () => {
  const place = placeOf("47_2Corinthians_3.htm#SCo3-18");
  assert.deepEqual([place?.book.id, place?.chapter, place?.verse], ["2co", 3, 18]);
  assert.equal(placeOf("20_Proverbs_1.htm#Pro1-9")?.book.id, "pro");
  assert.equal(placeOf("99_Nothing_1.htm#X1-1"), null);
  assert.equal(placeOf("40_Matthew_29.htm#Mat29-1"), null);
});

test("hits come in Bible order, each once, with the full count", () => {
  const { hits, total } = readHits({
    detected: "Nm. 6:25;  1:9; Jn. 1:14; Jn. 1:16.",
    verses: [
      { ref: "Jn. 1:14", text: "Y el Verbo se hizo  carne", urlpfx: "43_John_1.htm#Joh1-14" },
      { ref: " 1:9", text: "Guirnalda de gracia", urlpfx: "20_Proverbs_1.htm#Pro1-9" },
      { ref: "Nm. 6:25", text: "te conceda Su gracia;", urlpfx: "04_Numbers_6.htm#Num6-25" },
      { ref: "Jn. 1:14", text: "duplicado", urlpfx: "43_John_1.htm#Joh1-14" },
      { ref: "x", text: "", urlpfx: "43_John_1.htm#Joh1-16" },
    ],
  });
  assert.deepEqual(
    hits.map((h) => `${h.bookId} ${h.chapter}:${h.verse}`),
    ["num 6:25", "pro 1:9", "jhn 1:14"],
  );
  assert.equal(hits[2].text, "Y el Verbo se hizo carne");
  assert.equal(total, 4);
});

test("searched words are marked regardless of accents and case", () => {
  const parts = markWords("Gracias a Dios por Su gracia, Espíritu.", "gracia espiritu");
  assert.deepEqual(
    parts.filter((p) => p.mark).map((p) => p.text),
    ["Gracias", "gracia", "Espíritu"],
  );
  assert.equal(parts.map((p) => p.text).join(""), "Gracias a Dios por Su gracia, Espíritu.");
});

test("LSM's own search page carries the words and language", () => {
  assert.equal(
    lsmSearchPage("Señor Espíritu", "es"),
    "https://text.recoveryversion.bible/list/?String=Se%C3%B1or+Esp%C3%ADritu&Lang=spa",
  );
});
