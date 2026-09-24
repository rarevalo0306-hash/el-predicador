import { test } from "node:test";
import assert from "node:assert/strict";
import { PASSAGE_QUESTION_MAX, passageQuestion } from "./ask-passage.ts";

test("a passage question carries the reference, the text and the question", () => {
  assert.equal(
    passageQuestion("Juan 3:16", "Porque de tal manera  amó Dios al mundo", "Explícamelo"),
    "Juan 3:16\n«Porque de tal manera amó Dios al mundo»\n\nExplícamelo",
  );
});

test("a long passage is shortened so the question still fits", () => {
  const text = "palabra ".repeat(200);
  const out = passageQuestion("Salmos 119:1-40", text, "¿Qué enseña este salmo?");
  assert.ok(out.length <= PASSAGE_QUESTION_MAX, String(out.length));
  assert.ok(out.startsWith("Salmos 119:1-40\n«palabra"));
  assert.ok(out.endsWith("…»\n\n¿Qué enseña este salmo?"));
});
