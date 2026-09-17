import { createServerFn } from "@tanstack/react-start";
import {
  BIBLE_BOOKS,
  bookById,
  bookName,
  recobroChapterUrl,
  recobroCopyright,
  recobroSource,
  recobroVerseId,
  type BibleBook,
} from "@/lib/bible";
import { t, type Locale } from "@/lib/i18n";
import { catalogSpan, getVerseById, isComposedVerse, type Verse } from "@/lib/verses";

export type RecobroVerse = {
  n: number;
  text: string;
};

export type RecobroChapter = {
  bookId: string;
  bookName: string;
  chapter: number;
  url: string;
  copyright: string;
  verses: RecobroVerse[];
};

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    apos: "'",
    rsquo: "'",
    lsquo: "'",
    rdquo: '"',
    ldquo: '"',
    mdash: "\u2014",
    ndash: "\u2013",
    lt: "<",
    gt: ">",
  };
  return value
    .replace(/&([a-z]+);/gi, (_full, name: string) => named[name.toLowerCase()] ?? _full)
    .replace(/&#(\d+);/g, (_full, code: string) =>
      String.fromCharCode(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_full, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

function stripHtml(value: string) {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function parseRecobroChapter(html: string): RecobroVerse[] {
  const verses: RecobroVerse[] = [];
  const pattern =
    /<p id="[^"]*-(\d+)" class="verse">[\s\S]*?<\/b>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const n = Number(match[1]);
    const text = stripHtml(match[2] ?? "");
    if (n && text) verses.push({ n, text });
  }
  return verses;
}

function toVerse(
  book: BibleBook,
  chapter: number,
  item: RecobroVerse,
  locale: Locale,
): Verse {
  const name = bookName(book, locale);
  return {
    id: recobroVerseId(book.id, chapter, item.n, locale),
    ref: `${name} ${chapter}:${item.n}`,
    book: name,
    text: item.text,
    themes: [],
    source: recobroSource(locale),
  };
}

async function loadRecobro(
  book: BibleBook,
  chapter: number,
  locale: Locale,
): Promise<RecobroChapter> {
  try {
    const { loadChapterFromLsm } = await import("@/lib/lsm-api");
    const api = await loadChapterFromLsm(book, chapter, locale);
    if (api && api.verses.length > 0) {
      return {
        bookId: book.id,
        bookName: bookName(book, locale),
        chapter,
        url: api.url,
        copyright: api.copyright,
        verses: api.verses,
      };
    }
  } catch {
    /* fall through to the public Recobro pages */
  }
  const url = recobroChapterUrl(book, chapter, locale);
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "ThePreacher/1.0 (Recovery Version reader)",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(t(locale, "chapterOpenFail"));
  }
  const html = await response.text();
  const verses = parseRecobroChapter(html);
  if (verses.length === 0) {
    throw new Error(t(locale, "chapterEmpty"));
  }
  return {
    bookId: book.id,
    bookName: bookName(book, locale),
    chapter,
    url,
    copyright: recobroCopyright(locale),
    verses,
  };
}

export const fetchRecobroChapter = createServerFn({ method: "POST" })
  .validator((data: { bookId: string; chapter: number; locale?: Locale }) => {
    const book = bookById(data.bookId);
    const locale: Locale = data.locale === "en" ? "en" : "es";
    if (!book) throw new Error(t(locale, "bookNotFound"));
    const chapter = Number(data.chapter);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
      throw new Error(t(locale, "chapterNotFound"));
    }
    return {
      bookId: book.id,
      chapter,
      locale,
    };
  })
  .handler(async ({ data }): Promise<RecobroChapter> => {
    const book = bookById(data.bookId);
    if (!book) throw new Error(t(data.locale, "bookNotFound"));
    return loadRecobro(book, data.chapter, data.locale);
  });

export function chapterToVerses(
  book: BibleBook,
  chapter: RecobroChapter,
  locale: Locale = "es",
): Verse[] {
  return chapter.verses.map((item) => toVerse(book, chapter.chapter, item, locale));
}

export function booksForTestament(testament: "at" | "nt") {
  return BIBLE_BOOKS.filter((item) => item.testament === testament);
}

type ChapterHit = RecobroChapter | Promise<RecobroChapter>;
const chapterMemory = new Map<string, ChapterHit>();

function chapterKey(bookId: string, chapter: number, locale: Locale) {
  return `${locale}:${bookId}:${chapter}`;
}

export function loadCachedChapter(
  bookId: string,
  chapter: number,
  locale: Locale,
): Promise<RecobroChapter> {
  const key = chapterKey(bookId, chapter, locale);
  const hit = chapterMemory.get(key);
  if (hit) return Promise.resolve(hit);
  const pending = fetchRecobroChapter({ data: { bookId, chapter, locale } })
    .then((result) => {
      chapterMemory.set(key, result);
      return result;
    })
    .catch((error: unknown) => {
      chapterMemory.delete(key);
      throw error;
    });
  chapterMemory.set(key, pending);
  return pending;
}

function joinRange(chapter: RecobroChapter, from: number, to: number) {
  return chapter.verses
    .filter((item) => item.n >= from && item.n <= to)
    .map((item) => item.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function builtFromChapter(
  verse: Verse,
  span: NonNullable<ReturnType<typeof catalogSpan>>,
  chapter: RecobroChapter,
  locale: Locale,
): Verse | null {
  const text = joinRange(chapter, span.from, span.to);
  if (!text) return null;
  const name = bookName(span.book, locale);
  const ref =
    span.from === span.to
      ? `${name} ${span.chapter}:${span.from}`
      : `${name} ${span.chapter}:${span.from}-${span.to}`;
  const catalog = getVerseById(verse.id);
  return {
    ...(catalog ?? verse),
    id: verse.id,
    ref,
    book: name,
    text,
    source: recobroSource(locale),
  };
}

export function canChangeMessageLanguage(verse: Verse): boolean {
  return !isComposedVerse(verse.id) || verse.id.startsWith("doctrina-") ||
    (verse.id.startsWith("caso-") && verse.id !== "caso-testigos-nwt") ||
    verse.id === "evangelio-camino" || verse.id === "evangelio-oracion";
}

export function peekHydratedVerse(verse: Verse, locale: Locale): Verse | null {
  if (isComposedVerse(verse.id)) {
    if (!canChangeMessageLanguage(verse) || verse.source === recobroSource(locale)) return verse;
    return null;
  }
  if (verse.id.startsWith("rcv-") && verse.source === recobroSource(locale)) return verse;
  const span = catalogSpan(getVerseById(verse.id) ?? verse);
  if (!span) {
    if (getVerseById(verse.id)) return null;
    return { ...verse, source: recobroSource(locale) };
  }
  const hit = chapterMemory.get(chapterKey(span.book.id, span.chapter, locale));
  if (!hit || hit instanceof Promise) return null;
  return builtFromChapter(verse, span, hit, locale);
}

export async function hydrateVerse(verse: Verse, locale: Locale): Promise<Verse> {
  const peeked = peekHydratedVerse(verse, locale);
  if (peeked) return peeked;
  if (verse.id === "evangelio-camino" || verse.id === "evangelio-oracion") {
    const { gospelPathVerse, gospelPrayerVerse } = await import("./evangelism");
    return verse.id === "evangelio-camino" ? gospelPathVerse(locale) : gospelPrayerVerse(locale);
  }
  if (verse.id.startsWith("doctrina-")) {
    const { DOCTRINE_TOPICS, doctrineMessageVerse } = await import("./doctrine");
    const topic = DOCTRINE_TOPICS.find((item) => `doctrina-${item.id}` === verse.id);
    if (topic) return doctrineMessageVerse(topic, locale);
  }
  if (verse.id.startsWith("caso-")) {
    const { PREACH_CASES, caseMessageVerse } = await import("./preach-cases");
    const topic = PREACH_CASES.find((item) => `caso-${item.id}` === verse.id);
    if (topic) return caseMessageVerse(topic, locale);
  }
  const span = catalogSpan(getVerseById(verse.id) ?? verse);
  if (!span) {
    if (getVerseById(verse.id)) {
      throw new Error(t(locale, "chapterOpenFail"));
    }
    return { ...verse, source: recobroSource(locale) };
  }
  const chapter = await loadCachedChapter(span.book.id, span.chapter, locale);
  const built = builtFromChapter(verse, span, chapter, locale);
  if (!built) throw new Error(t(locale, "chapterEmpty"));
  return built;
}

export async function hydrateVerses(verses: Verse[], locale: Locale) {
  const unique = new Map<string, { bookId: string; chapter: number }>();
  for (const verse of verses) {
    if (isComposedVerse(verse.id) || verse.id.startsWith("rcv-")) continue;
    const span = catalogSpan(getVerseById(verse.id) ?? verse);
    if (!span) continue;
    unique.set(`${locale}:${span.book.id}:${span.chapter}`, {
      bookId: span.book.id,
      chapter: span.chapter,
    });
  }
  await Promise.all(
    [...unique.values()].map((item) =>
      loadCachedChapter(item.bookId, item.chapter, locale),
    ),
  );
  return Promise.all(verses.map((verse) => hydrateVerse(verse, locale)));
}

export function prefetchVerses(verses: Verse[], locale: Locale) {
  void hydrateVerses(verses, locale).catch(() => undefined);
}
