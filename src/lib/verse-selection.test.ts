import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVerseSelection, selectedVerseText } from "./verse-selection.ts";
test("saved gaps stay gaps after parsing and rebuilding", () => {
  const selection = parseVerseSelection("16, 18-19");
  assert.deepEqual(selection, { from: 16, to: 19, selected: [16, 18, 19] });
  assert.equal(
    selectedVerseText(
      [
        { n: 16, text: "a" },
        { n: 17, text: "excluded" },
        { n: 18, text: "b" },
        { n: 19, text: "c" },
      ],
      selection!,
    ),
    "a b c",
  );
});
test("reject invalid or unbounded input and incomplete content", () => {
  for (const input of ["0", "19-16", "1-99999", "1,", "-1", "NaN"])
    assert.equal(parseVerseSelection(input), null);
  assert.equal(selectedVerseText([{ n: 16, text: "a" }], parseVerseSelection("16,18")!), null);
});
test("existing continuous selections retain their metadata shape", () => {
  assert.deepEqual(parseVerseSelection("16-18"), { from: 16, to: 18 });
  assert.deepEqual(parseVerseSelection("16"), { from: 16, to: 16 });
});
