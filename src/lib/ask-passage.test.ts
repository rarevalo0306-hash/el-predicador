import { test } from "node:test";
import assert from "node:assert/strict";
import { PASSAGE_QUESTION_MAX, passageQuestion } from "./ask-passage.ts";

test("a passage question carries the reference and the question, never the text", () => {
  assert.equal(passageQuestion(" Juan 3:16 ", " Explícamelo "), "Juan 3:16\n\nExplícamelo");
});

test("a long question still fits the server's limit", () => {
  const out = passageQuestion("Salmos 119:1-40", "¿Qué enseña este salmo? ".repeat(40));
  assert.ok(out.length <= PASSAGE_QUESTION_MAX, String(out.length));
  assert.ok(out.startsWith("Salmos 119:1-40\n\n¿Qué enseña"));
});
