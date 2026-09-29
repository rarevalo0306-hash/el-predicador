import type { Verse } from "./verses.ts";
import { bookById } from "./bible.ts";

/**
 * What the app keeps of a verse someone saved, sent or marked: never the
 * Bible text itself. Living Stream Ministry (Recobro) and The Lockman
 * Foundation (LBLA, NASB) do not allow storing their text, so a saved verse
 * keeps its reference and is read again, live, each time it is shown.
 *
 * Text the app cannot read again is kept as it is: a letter the AI wrote for
 * a case, the prayer to receive Christ, and the comparisons with the New
 * World Translation, which are the app's own writing.
 */
export function keptVerse(verse: Verse): Verse {
  return canReadAgain(verse) ? { ...verse, text: "" } : verse;
}

/** Every entry of a saved list, reduced the same way. */
export function keptVerses(memory: unknown): Record<string, Verse> {
  if (!memory || typeof memory !== "object") return {};
  const kept: Record<string, Verse> = {};
  for (const [id, verse] of Object.entries(memory as Record<string, unknown>)) {
    if (!verse || typeof verse !== "object") continue;
    const entry = verse as Verse;
    if (typeof entry.id !== "string" || typeof entry.ref !== "string") continue;
    kept[id] = keptVerse({ ...entry, text: typeof entry.text === "string" ? entry.text : "" });
  }
  return kept;
}

/** Whether a verse's text can be rebuilt from its id and reference alone. */
export function canReadAgain(verse: Pick<Verse, "id" | "ref">): boolean {
  const { id } = verse;
  if (id.startsWith("caso-ia-") || id.startsWith("nwt-") || id === "evangelio-oracion") {
    return false;
  }
  if (
    id.startsWith("doctrina-") ||
    id.startsWith("caso-") ||
    id.startsWith("nvi-") ||
    id === "evangelio-camino"
  ) {
    return true;
  }
  // "Juan 3:16", "Jn 3:16-18": a reference the reader can open again.
  return /\d+\s*:\s*\d+/.test(verse.ref) || /-range-[\d,-]+$/.test(id);
}

export type VerseRange = { bookId: string; chapter: number; numbers: number[] };

/**
 * Verses picked together in the reader are saved as one, with an id like
 * "rcv-jhn-3-range-16-18" or "lbla-jhn-3-range-16,18"; this reads it back.
 */
export function rangeOf(id: string): VerseRange | null {
  const match = id.match(/-([a-z0-9]+)-(\d+)-range-([\d,-]+)$/);
  if (!match || !bookById(match[1])) return null;
  const numbers: number[] = [];
  for (const part of match[3].split(",")) {
    const [from, to = from] = part.split("-").map(Number);
    if (!Number.isInteger(from) || !Number.isInteger(to) || to < from || to - from > 200) continue;
    for (let n = from; n <= to; n += 1) numbers.push(n);
  }
  return numbers.length ? { bookId: match[1], chapter: Number(match[2]), numbers } : null;
}
