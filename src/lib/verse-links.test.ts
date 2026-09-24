import { test } from "node:test";
import assert from "node:assert/strict";
import { linkVerses, versesIn } from "./verse-links.ts";

const links = (text: string) =>
  linkVerses(text)
    .filter((part) => part.link)
    .map((part) => [part.text, part.link!.bookId, part.link!.chapter, part.link!.from, part.link!.to]);

test("references in a sentence become links, the rest stays text", () => {
  const parts = linkVerses("Como dice Juan 3:16, Dios amó al mundo.");
  assert.deepEqual(
    parts.map((p) => p.text),
    ["Como dice ", "Juan 3:16", ", Dios amó al mundo."],
  );
  assert.deepEqual(parts[1].link, { bookId: "jhn", chapter: 3, from: 16, to: 16 });
});

test("numbered books, accents, abbreviations, ranges and English names", () => {
  assert.deepEqual(links("Lee 1 Juan 1:9 y Romanos 8:28-30."), [
    ["1 Juan 1:9", "1jn", 1, 9, 9],
    ["Romanos 8:28-30", "rom", 8, 28, 30],
  ]);
  assert.deepEqual(links("(Hechos 2:38) — Isaías 53:5 · Col. 2:9 · John 14:6"), [
    ["Hechos 2:38", "act", 2, 38, 38],
    ["Isaías 53:5", "isa", 53, 5, 5],
    ["Col. 2:9", "col", 2, 9, 9],
    ["John 14:6", "jhn", 14, 6, 6],
  ]);
  assert.deepEqual(links("Salmo 23:1 y Cantares 2:4"), [
    ["Salmo 23:1", "psa", 23, 1, 1],
    ["Cantares 2:4", "sng", 2, 4, 4],
  ]);
});

test("times, stray numbers and impossible chapters stay plain", () => {
  assert.deepEqual(links("Nos vemos a las 3:30 de la tarde."), []);
  assert.deepEqual(links("Judas 5:1 no existe, Am 8:00 tampoco."), []);
  assert.deepEqual(links("Leí Apocalipsis"), []);
});

test("versesIn lists each passage once", () => {
  assert.deepEqual(
    versesIn("Juan 3:16 y otra vez Juan 3:16, luego Efesios 2:8-9").map((v) => v.label),
    ["Juan 3:16", "Efesios 2:8-9"],
  );
});
