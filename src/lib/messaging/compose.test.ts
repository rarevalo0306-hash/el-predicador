import { test } from "node:test";
import assert from "node:assert/strict";
import { composeVerseMessage, fallbackNotes, pickRotating } from "./compose.ts";

test("a composed message reads note, verse, reference, source, sign-off", () => {
  const message = composeVerseMessage({
    note: "Pensé en ti hoy.",
    text: "Todo lo puedo en Cristo que me fortalece.",
    ref: "Filipenses 4:13",
    source: "RVR1960",
    senderName: "Ricardo",
    locale: "es",
  });
  assert.equal(
    message,
    "Pensé en ti hoy.\n\n«Todo lo puedo en Cristo que me fortalece.»\n— Filipenses 4:13\nRVR1960\n\nCon cariño, Ricardo",
  );
});

test("missing pieces leave no blank lines behind", () => {
  assert.equal(composeVerseMessage({ text: " A ", ref: "R", locale: "en" }), "«A»\n— R");
  assert.equal(
    composeVerseMessage({ note: "  ", text: "A", ref: "R", senderName: " ", locale: "en" }),
    "«A»\n— R",
  );
  assert.match(
    composeVerseMessage({ text: "A", ref: "R", senderName: "Ana", locale: "en" }),
    /With love, Ana$/,
  );
});

test("rotation wraps and tolerates an empty list", () => {
  assert.equal(pickRotating(["a", "b", "c"], 0), "a");
  assert.equal(pickRotating(["a", "b", "c"], 4), "b");
  assert.equal(pickRotating(["a", "b", "c"], -1), "c");
  assert.equal(pickRotating([], 3), null);
});

test("the fallback lines exist in both languages and differ from each other", () => {
  for (const locale of ["es", "en"] as const) {
    const notes = fallbackNotes(locale);
    assert.equal(new Set(notes).size, notes.length);
    assert.ok(notes.every((n) => n.trim().length > 10));
  }
});
