import { test } from "node:test";
import assert from "node:assert/strict";
import { swipeTurn } from "./swipe.ts";

const base = { dx: 0, dy: 0, ms: 250, startX: 200, width: 390 };

test("finger to the left reads the next chapter, to the right the previous one", () => {
  assert.equal(swipeTurn({ ...base, dx: -120, dy: 10 }), "next");
  assert.equal(swipeTurn({ ...base, dx: 120, dy: -10 }), "prev");
});

test("scrolling, short taps and slow drags never turn the page", () => {
  assert.equal(swipeTurn({ ...base, dx: -80, dy: 300 }), null);
  assert.equal(swipeTurn({ ...base, dx: -90, dy: 50 }), null);
  assert.equal(swipeTurn({ ...base, dx: -30, dy: 0 }), null);
  assert.equal(swipeTurn({ ...base, dx: -150, dy: 0, ms: 1200 }), null);
});

test("strokes from the screen edge are left to the phone's back gesture", () => {
  assert.equal(swipeTurn({ ...base, dx: 150, startX: 8 }), null);
  assert.equal(swipeTurn({ ...base, dx: -150, startX: 385 }), null);
});
