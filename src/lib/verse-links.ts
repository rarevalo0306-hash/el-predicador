import { BIBLE_BOOKS, BOOK_EN, normalizeQuery, type BibleBook } from "./bible.ts";

/** A passage named in a piece of text, e.g. "Juan 3:16" or "1 Jn 1:7-9". */
export type VerseLink = {
  bookId: string;
  chapter: number;
  from: number;
  to: number;
};

export type LinkPart = { text: string; link?: VerseLink };

const compact = (value: string) => normalizeQuery(value).replace(/\s+/g, "");

let lookup: Map<string, BibleBook> | null = null;

/** Every way a book is written, squeezed: "1juan", "1jn", "1john", "salmo"… */
function bookLookup() {
  if (lookup) return lookup;
  lookup = new Map();
  for (const book of BIBLE_BOOKS) {
    const en = BOOK_EN[book.id];
    const names = [book.name, book.abbr, ...book.aliases];
    if (en) names.push(en.name, en.abbr, en.query);
    for (const name of names) {
      const key = compact(name);
      if (key && !lookup.has(key)) lookup.set(key, book);
    }
  }
  return lookup;
}

/** Only a whole name counts here; "de" must never turn into Deuteronomio. */
export function exactBook(name: string): BibleBook | undefined {
  return bookLookup().get(compact(name));
}

const NUMBERS = /(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/g;

/** The book name right before a "3:16", trying the longest name first. */
function bookBefore(prefix: string): { book: BibleBook; start: number } | null {
  for (let words = 4; words >= 1; words -= 1) {
    const pattern = new RegExp(
      `((?:[123]\\s?)?\\p{L}+\\.?(?:\\s+\\p{L}+\\.?){${words - 1}})\\s*$`,
      "u",
    );
    const match = pattern.exec(prefix);
    if (!match) continue;
    const before = prefix[match.index - 1];
    if (before && /[\p{L}\d]/u.test(before)) continue;
    const book = exactBook(match[1]);
    if (book) return { book, start: match.index };
  }
  return null;
}

/**
 * Splits a text into plain runs and the Bible references inside it, so each
 * reference can be tapped. A reference needs a book and chapter:verse; a
 * clock time ("a las 3:30") or a number with no book stays plain text.
 */
export function linkVerses(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  let last = 0;
  for (const match of text.matchAll(NUMBERS)) {
    const at = match.index ?? 0;
    if (at < last) continue;
    const found = bookBefore(text.slice(last, at));
    if (!found) continue;
    const start = last + found.start;
    const chapter = Number(match[1]);
    const from = Number(match[2]);
    const to = match[3] ? Number(match[3]) : from;
    if (chapter < 1 || chapter > found.book.chapters || from < 1 || to < from) continue;
    if (start > last) parts.push({ text: text.slice(last, start) });
    const end = at + match[0].length;
    parts.push({
      text: text.slice(start, end),
      link: { bookId: found.book.id, chapter, from, to },
    });
    last = end;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** The distinct passages a text mentions, in order. */
export function versesIn(text: string): { label: string; link: VerseLink }[] {
  const seen = new Set<string>();
  const out: { label: string; link: VerseLink }[] = [];
  for (const part of linkVerses(text)) {
    if (!part.link) continue;
    const key = `${part.link.bookId}-${part.link.chapter}-${part.link.from}-${part.link.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label: part.text.trim(), link: part.link });
  }
  return out;
}
