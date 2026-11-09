/**
 * Reading a chapter, a sideways swipe turns the page: finger to the left
 * reads the next chapter, to the right the previous one. Only a clearly
 * horizontal, quick stroke counts, so scrolling down while reading never
 * changes the chapter.
 */
export type SwipeTurn = "next" | "prev";

export type SwipeStroke = {
  /** Where the finger went down and came up, and how long it took. */
  dx: number;
  dy: number;
  ms: number;
  /** Where it went down and how wide the screen is, to leave the edges alone. */
  startX: number;
  width: number;
};

/** How far the finger must travel sideways. */
export const MIN_DISTANCE = 70;
/** Strokes slower than this are reading or selecting, not turning. */
export const MAX_MS = 700;
/** The phone's own back/forward gestures start this close to the edge. */
export const EDGE = 24;

export function swipeTurn(stroke: SwipeStroke): SwipeTurn | null {
  const { dx, dy, ms, startX, width } = stroke;
  if (ms > MAX_MS) return null;
  if (startX < EDGE || startX > width - EDGE) return null;
  if (Math.abs(dx) < MIN_DISTANCE) return null;
  // Clearly sideways: at least twice as far across as up or down.
  if (Math.abs(dx) < Math.abs(dy) * 2) return null;
  return dx < 0 ? "next" : "prev";
}
