import { BIBLE_BOOKS, normalizeQuery, type BibleBook } from "./bible.ts";

/** One verse that holds every word searched for. */
export type ConcordanceHit = {
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
};

export type ConcordanceResult =
  | { status: "ok"; words: string; hits: ConcordanceHit[]; total: number; copyright?: string }
  | { status: "unavailable"; words: string };

/** LSM answers at most this many verses for one search. */
export const CONCORDANCE_CAP = 50;

/**
 * The words as LSM's search accepts them: letters (accents too), spaces and
 * hyphens only, at most six words. Anything else would make it refuse the
 * whole request.
 */
export function cleanWords(value: string): string {
  return value
    .replace(/[^\p{L}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 6)
    .join(" ")
    .slice(0, 80);
}

const BY_NUM = new Map<string, BibleBook>(BIBLE_BOOKS.map((book) => [book.num, book]));

/**
 * Where a hit is. LSM's own reference sometimes comes without its book
 * ("  13:3"), so the place is read from its link instead:
 * "47_2Corinthians_3.htm#SCo3-18" is book 47, chapter 3, verse 18.
 */
export function placeOf(urlpfx: string): { book: BibleBook; chapter: number; verse: number } | null {
  const match = /^(\d{2})_[^_]+_(\d+)\.htm#[^-]*-(\d+)$/.exec(urlpfx.trim());
  if (!match) return null;
  const book = BY_NUM.get(match[1]);
  const chapter = Number(match[2]);
  const verse = Number(match[3]);
  if (!book || chapter < 1 || chapter > book.chapters || verse < 1) return null;
  return { book, chapter, verse };
}

type LsmVerse = { ref?: unknown; text?: unknown; urlpfx?: unknown };

/** The hits in Bible order, each once, from what LSM answered. */
export function readHits(payload: { verses?: LsmVerse[]; detected?: unknown }): {
  hits: ConcordanceHit[];
  total: number;
} {
  const seen = new Set<string>();
  const hits: ConcordanceHit[] = [];
  for (const item of payload.verses ?? []) {
    const place = placeOf(String(item.urlpfx ?? ""));
    const text = String(item.text ?? "").replace(/\s+/g, " ").trim();
    if (!place || !text) continue;
    const key = `${place.book.id}-${place.chapter}-${place.verse}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ bookId: place.book.id, chapter: place.chapter, verse: place.verse, text });
  }
  const order = new Map(BIBLE_BOOKS.map((book, index) => [book.id, index]));
  hits.sort(
    (a, b) =>
      (order.get(a.bookId) ?? 0) - (order.get(b.bookId) ?? 0) ||
      a.chapter - b.chapter ||
      a.verse - b.verse,
  );
  const detected = String(payload.detected ?? "")
    .split(";")
    .filter((part) => /\d/.test(part)).length;
  return { hits, total: Math.max(detected, hits.length) };
}

/**
 * The stretches of a verse to mark: every word that starts like one of the
 * searched words, ignoring accents and case ("gracia" marks "gracia" and
 * "gracias").
 */
export function markWords(text: string, words: string): { text: string; mark: boolean }[] {
  const wanted = normalizeQuery(words)
    .split(" ")
    .filter((word) => word.length > 1);
  if (!wanted.length) return [{ text, mark: false }];
  const parts: { text: string; mark: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(/\p{L}+/gu)) {
    const word = normalizeQuery(match[0]);
    if (!wanted.some((w) => word.startsWith(w))) continue;
    const at = match.index ?? 0;
    if (at > last) parts.push({ text: text.slice(last, at), mark: false });
    parts.push({ text: match[0], mark: true });
    last = at + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), mark: false });
  return parts;
}

/** LSM's own search page, for when this app has no key of its own yet. */
export function lsmSearchPage(words: string, locale: "es" | "en"): string {
  const params = new URLSearchParams({ String: words, Lang: locale === "en" ? "eng" : "spa" });
  return `https://text.recoveryversion.bible/list/?${params.toString()}`;
}
