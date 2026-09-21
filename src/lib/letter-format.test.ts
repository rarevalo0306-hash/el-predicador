import { test } from "node:test";
import assert from "node:assert/strict";
import { letterBlocks } from "./letter-format.ts";

test("headings, scripture quotations and paragraphs come apart", () => {
  const blocks = letterBlocks(
    [
      "La doctrina unicista",
      "",
      "Hay un solo Dios.\nEse Dios es Espíritu.",
      "",
      "1. Hay un solo Dios",
      "",
      "Isaías 45:5\n«Yo soy Jehová, y ninguno más hay.»",
      "",
      "1 Timoteo 3:16\n«Dios fue manifestado en carne.»",
      "",
      "Jesús lloró.\nJuan 11:35\n«Jesús lloró.»",
      "",
      "Esto puede resumirse así:",
    ].join("\n"),
  );
  assert.deepEqual(blocks, [
    { kind: "heading", text: "La doctrina unicista" },
    { kind: "paragraph", lines: ["Hay un solo Dios.", "Ese Dios es Espíritu."] },
    { kind: "heading", text: "1. Hay un solo Dios" },
    { kind: "quote", ref: "Isaías 45:5", lines: ["«Yo soy Jehová, y ninguno más hay.»"] },
    { kind: "quote", ref: "1 Timoteo 3:16", lines: ["«Dios fue manifestado en carne.»"] },
    { kind: "paragraph", lines: ["Jesús lloró.", "Juan 11:35", "«Jesús lloró.»"] },
    { kind: "paragraph", lines: ["Esto puede resumirse así:"] },
  ]);
});

test("blank input and stray whitespace produce nothing", () => {
  assert.deepEqual(letterBlocks(""), []);
  assert.deepEqual(letterBlocks("\n\n  \n"), []);
});
