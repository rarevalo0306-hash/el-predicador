import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_LIKES, parseLikes, themeCounts, toggleLike, type VerseLike } from "./likes.ts";

const like = (id: string, theme: VerseLike["theme"] = "paz"): VerseLike => ({
  id,
  theme,
  day: "2026-11-04",
});

test("a like is added first and a second tap takes it away", () => {
  const once = toggleLike([like("a")], like("b", "fe"));
  assert.deepEqual(
    once.map((l) => l.id),
    ["b", "a"],
  );
  assert.deepEqual(
    toggleLike(once, like("b", "fe")).map((l) => l.id),
    ["a"],
  );
});

test("the list keeps only the newest likes", () => {
  let list: VerseLike[] = [];
  for (let i = 0; i < MAX_LIKES + 5; i++) list = toggleLike(list, like(`v${i}`));
  assert.equal(list.length, MAX_LIKES);
  assert.equal(list[0]!.id, `v${MAX_LIKES + 4}`);
});

test("stored likes are rebuilt and malformed rows dropped", () => {
  const parsed = parseLikes([
    like("a"),
    { id: "b", theme: "not-a-theme", day: "2026-11-04" },
    { id: "c", theme: "fe", day: "yesterday" },
    like("a", "fe"),
    null,
    { ...like("d", "amor"), extra: "x" },
  ]);
  assert.deepEqual(parsed, [like("a"), like("d", "amor")]);
  assert.deepEqual(parseLikes("nope"), []);
});

test("themes are counted, most liked first", () => {
  assert.deepEqual(themeCounts([like("a", "fe"), like("b", "paz"), like("c", "paz")]), [
    { theme: "paz", count: 2 },
    { theme: "fe", count: 1 },
  ]);
});
