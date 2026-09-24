import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReference } from "./bible.ts";

const read = (query: string) => {
  const ref = parseReference(query);
  return ref ? [ref.book.id, ref.chapter, ref.verse] : null;
};

test("a reference reads the same however it is typed", () => {
  for (const query of [
    "mateo 23:3",
    "mateo23:3",
    "mateo;23;3",
    "Mateo 23;3",
    "mateo 23.3",
    "Mt. 23:3",
    "mateo 23,3",
    "mateo 23 3",
    "mateo 23:3-5",
    "MATEO23:3",
  ]) {
    assert.deepEqual(read(query), ["mat", 23, 3], query);
  }
});

test("chapter only, numbered books and a bare book", () => {
  assert.deepEqual(read("mateo 23"), ["mat", 23, undefined]);
  assert.deepEqual(read("mateo23"), ["mat", 23, undefined]);
  assert.deepEqual(read("1juan3:16"), ["1jn", 3, 16]);
  assert.deepEqual(read("1 Juan;3;16"), ["1jn", 3, 16]);
  assert.deepEqual(read("salmo 23"), ["psa", 23, undefined]);
  assert.deepEqual(read("John 3:16"), ["jhn", 3, 16]);
  assert.deepEqual(read("romanos"), ["rom", 1, undefined]);
});

test("impossible places are refused", () => {
  assert.equal(read("mateo 29"), null);
  assert.equal(read("mateo 23:0"), null);
  assert.equal(read("nada 3:16"), null);
  assert.equal(read(""), null);
});
