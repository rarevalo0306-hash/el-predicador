import { test } from "node:test";
import assert from "node:assert/strict";
import { tasteNote, tasteProfile } from "./taste.ts";
import type { VerseLike } from "./likes.ts";

const day = "2026-11-05";
const like = (id: string, theme: VerseLike["theme"]): VerseLike => ({
  id: `vid-${id}`,
  theme,
  day,
});
const names: Record<string, string> = { paz: "Paz", fe: "Fe", consuelo: "Consuelo", amor: "Amor" };

test("no profile until there are enough likes", () => {
  assert.equal(tasteProfile([]), null);
  assert.equal(tasteProfile([like("a", "paz")]), null);
  assert.equal(
    tasteNote(null, "es", (id) => names[id]!),
    "",
  );
});

test("the profile keeps the three most liked themes", () => {
  const profile = tasteProfile([
    like("a", "paz"),
    like("b", "paz"),
    like("c", "fe"),
    like("d", "consuelo"),
    like("e", "consuelo"),
    like("f", "paz"),
    like("g", "amor"),
  ]);
  assert.deepEqual(profile, { themes: ["paz", "consuelo", "fe"], likes: 7 });
  const note = tasteNote(profile, "es", (id) => names[id]!);
  assert.match(note, /Paz, Consuelo y Fe/);
  // Only theme names reach the AI: no verse ids or dates.
  assert.doesNotMatch(note, /2026|vid-/);
  assert.match(
    tasteNote(profile, "en", (id) => names[id]!),
    /Paz, Consuelo and Fe/,
  );
});
