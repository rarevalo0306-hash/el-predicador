import { createServerFn } from "@tanstack/react-start";
import {
  BIBLE_BOOKS,
  bibleSource,
  bibleVerseId,
  bookById,
  bookName,
  normalizeBibleVersion,
  type BibleVersion,
  type BibleBook,
} from "@/lib/bible";
import { t, type Locale } from "@/lib/i18n";
import { rangeOf, type VerseRange } from "@/lib/verse-memory";
import {
  catalogSpan,
  getVerseById,
  isComposedVerse,
  localizeVerse,
  type Verse,
} from "@/lib/verses";
import { formatVerseRange } from "@/lib/reader-prefs";

export type RecobroVerse = {
  n: number;
  text: string;
};

export type RecobroChapter = {
  bookId: string;
  bookName: string;
  chapter: number;
  version: BibleVersion;
  url: string;
  copyright: string;
  fumsId?: string;
  verses: RecobroVerse[];
};

function toVerse(
  book: BibleBook,
  chapter: number,
  item: RecobroVerse,
  locale: Locale,
  version: BibleVersion,
  copyright?: string,
): Verse {
  const name = bookName(book, locale);
  return {
    id: bibleVerseId(version, book.id, chapter, item.n, locale),
    ref: `${name} ${chapter}:${item.n}`,
    book: name,
    text: item.text,
    themes: [],
    source: bibleSource(version, locale),
    copyright,
  };
}

async function loadRecobro(
  book: BibleBook,
  chapter: number,
  locale: Locale,
  version: BibleVersion,
): Promise<RecobroChapter> {
  try {
    if (version !== "recovery") {
      const { loadChapterFromApiBible } = await import("@/lib/api-bible");
      const api = await loadChapterFromApiBible(book, chapter, locale, version);
      return {
        bookId: book.id,
        bookName: bookName(book, locale),
        chapter,
        version,
        url: api.url,
        copyright: api.copyright,
        fumsId: api.fumsId,
        verses: api.verses,
      };
    }
    const { loadChapterFromLsm } = await import("@/lib/lsm-api");
    const api = await loadChapterFromLsm(book, chapter, locale);
    if (api && api.verses.length > 0) {
      return {
        bookId: book.id,
        bookName: bookName(book, locale),
        chapter,
        version,
        url: api.url,
        copyright: api.copyright,
        verses: api.verses,
      };
    }
    throw new Error("lsm-pending");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "lsm-missing" || error.message === "lsm-pending") {
        throw new Error(t(locale, "bibleApiPending"));
      }
      if (error.message.startsWith("api-bible-")) {
        throw new Error(t(locale, "apiBibleUnavailable"));
      }
    }
    throw new Error(t(locale, "chapterOpenFail"));
  }
}

export const fetchRecobroChapter = createServerFn({ method: "POST" })
  .validator(
    (data: {
      bookId: string;
      chapter: number;
      locale?: Locale;
      version?: BibleVersion;
    }) => {
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
      version: normalizeBibleVersion(data.version, locale),
    };
    },
  )
  .handler(async ({ data }): Promise<RecobroChapter> => {
    const book = bookById(data.bookId);
    if (!book) throw new Error(t(data.locale, "bookNotFound"));
    return loadRecobro(book, data.chapter, data.locale, data.version);
  });

export function chapterToVerses(
  book: BibleBook,
  chapter: RecobroChapter,
  locale: Locale = "es",
): Verse[] {
  reportApiBibleUse(chapter);
  return chapter.verses.map((item) =>
    toVerse(book, chapter.chapter, item, locale, chapter.version, chapter.copyright),
  );
}

export function booksForTestament(testament: "at" | "nt") {
  return BIBLE_BOOKS.filter((item) => item.testament === testament);
}

type ChapterHit = RecobroChapter | Promise<RecobroChapter>;
const chapterMemory = new Map<string, ChapterHit>();

function chapterKey(
  bookId: string,
  chapter: number,
  locale: Locale,
  version: BibleVersion,
) {
  return `${locale}:${version}:${bookId}:${chapter}`;
}

export function loadCachedChapter(
  bookId: string,
  chapter: number,
  locale: Locale,
  version?: BibleVersion,
): Promise<RecobroChapter> {
  const selected = normalizeBibleVersion(version, locale);
  const key = chapterKey(bookId, chapter, locale, selected);
  const hit = chapterMemory.get(key);
  if (hit) return Promise.resolve(hit);
  const pending = fetchRecobroChapter({
    data: { bookId, chapter, locale, version: selected },
  })
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

/**
 * API.Bible asks that every use of its text be reported (FUMS). The Bible
 * reader and verse sheets report whole chapters; this covers single verses
 * built from one (Hoy, Temas, cards, messages). Browser only, once per id.
 */
function reportApiBibleUse(chapter: RecobroChapter) {
  if (!chapter.fumsId || typeof window === "undefined") return;
  const id = chapter.fumsId;
  void import("@/lib/api-bible-fums")
    .then(({ trackApiBibleFums }) => trackApiBibleFums(id))
    .catch(() => undefined);
}

function builtFromChapter(
  verse: Verse,
  span: NonNullable<ReturnType<typeof catalogSpan>>,
  chapter: RecobroChapter,
  locale: Locale,
  version: BibleVersion,
): Verse | null {
  reportApiBibleUse(chapter);
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
    source: bibleSource(version, locale),
    copyright: chapter.copyright,
  };
}

/** A picked range rebuilt from its chapter, numbered the way the reader shows it. */
function rangeFromChapter(
  verse: Verse,
  range: VerseRange,
  chapter: RecobroChapter,
  locale: Locale,
  version: BibleVersion,
): Verse | null {
  reportApiBibleUse(chapter);
  const wanted = new Set(range.numbers);
  const text = chapter.verses
    .filter((item) => wanted.has(item.n))
    .map((item) => `${item.n} ${item.text}`)
    .join("\n");
  if (!text) return null;
  return {
    ...verse,
    text,
    source: bibleSource(version, locale),
    copyright: chapter.copyright,
  };
}

/**
 * A verse from its id alone, with no text: what a schedule keeps. Catalog
 * verses, verses from a chapter ("rcv-jhn-3-16", "lbla-jhn-3-16"), ranges
 * picked in the reader and the app's composed messages all come back; the
 * text is then read with hydrateVerse. Null for an id the app cannot read.
 */
export function verseFromId(id: string, locale: Locale): Verse | null {
  const catalog = getVerseById(id);
  if (catalog) return { ...localizeVerse(catalog, locale), text: "" };
  if (isComposedVerse(id)) return { id, ref: "", book: "", text: "", themes: [] };
  const range = rangeOf(id);
  const single = id.match(/-([a-z0-9]+)-(\d+)-(\d+)$/);
  const bookId = range?.bookId ?? single?.[1];
  const book = bookId ? bookById(bookId) : undefined;
  if (!book) return null;
  const chapter = range?.chapter ?? Number(single![2]);
  const verses = range ? formatVerseRange(range.numbers) : single![3];
  const name = bookName(book, locale);
  return { id, ref: `${name} ${chapter}:${verses}`, book: name, text: "", themes: [] };
}

export function canChangeMessageLanguage(verse: Verse): boolean {
  return !isComposedVerse(verse.id) || verse.id.startsWith("doctrina-") ||
    (verse.id.startsWith("caso-") && verse.id !== "caso-testigos-nwt") ||
    verse.id === "evangelio-camino" || verse.id === "evangelio-oracion";
}

export function peekHydratedVerse(
  verse: Verse,
  locale: Locale,
  version?: BibleVersion,
): Verse | null {
  const selected = normalizeBibleVersion(version, locale);
  // A saved verse keeps only its reference; its text is read again.
  const hasText = Boolean(verse.text.trim());
  if (isComposedVerse(verse.id)) {
    if (
      hasText &&
      (!canChangeMessageLanguage(verse) || verse.source === bibleSource(selected, locale))
    ) {
      return verse;
    }
    return null;
  }
  const range = rangeOf(verse.id);
  if (range) {
    const hit = chapterMemory.get(chapterKey(range.bookId, range.chapter, locale, selected));
    if (!hit || hit instanceof Promise) return null;
    return rangeFromChapter(verse, range, hit, locale, selected);
  }
  if (
    hasText &&
    (verse.id.startsWith("rcv-") || verse.id.startsWith(`${selected}-`)) &&
    verse.source === bibleSource(selected, locale)
  ) {
    return verse;
  }
  const span = catalogSpan(getVerseById(verse.id) ?? verse);
  if (!span) {
    if (getVerseById(verse.id)) return null;
    return { ...verse, source: bibleSource(selected, locale) };
  }
  const hit = chapterMemory.get(chapterKey(span.book.id, span.chapter, locale, selected));
  if (!hit || hit instanceof Promise) return null;
  return builtFromChapter(verse, span, hit, locale, selected);
}

export async function hydrateVerse(
  verse: Verse,
  locale: Locale,
  version?: BibleVersion,
): Promise<Verse> {
  const selected = normalizeBibleVersion(version, locale);
  const peeked = peekHydratedVerse(verse, locale, selected);
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
  if (verse.id.startsWith("nvi-")) {
    const { NVI_ROWS, nviDigestVerse, nviRowVerse } = await import("./nvi-compare");
    if (verse.id === "nvi-digest") return nviDigestVerse(locale);
    const row = NVI_ROWS.find((item) => `nvi-${item.id}` === verse.id);
    if (row) return nviRowVerse(row, locale);
  }
  const range = rangeOf(verse.id);
  if (range) {
    const chapter = await loadCachedChapter(range.bookId, range.chapter, locale, selected);
    const built = rangeFromChapter(verse, range, chapter, locale, selected);
    if (!built) throw new Error(t(locale, "chapterEmpty"));
    return built;
  }
  const span = catalogSpan(getVerseById(verse.id) ?? verse);
  if (!span) {
    if (getVerseById(verse.id)) {
      throw new Error(t(locale, "chapterOpenFail"));
    }
    return { ...verse, source: bibleSource(selected, locale) };
  }
  const chapter = await loadCachedChapter(span.book.id, span.chapter, locale, selected);
  const built = builtFromChapter(verse, span, chapter, locale, selected);
  if (!built) throw new Error(t(locale, "chapterEmpty"));
  return built;
}

export async function hydrateVerses(
  verses: Verse[],
  locale: Locale,
  version?: BibleVersion,
) {
  const selected = normalizeBibleVersion(version, locale);
  const unique = new Map<string, { bookId: string; chapter: number }>();
  for (const verse of verses) {
    if (isComposedVerse(verse.id) || verse.id.startsWith("rcv-")) continue;
    const span = catalogSpan(getVerseById(verse.id) ?? verse);
    if (!span) continue;
    unique.set(`${locale}:${selected}:${span.book.id}:${span.chapter}`, {
      bookId: span.book.id,
      chapter: span.chapter,
    });
  }
  await Promise.all(
    [...unique.values()].map((item) =>
      loadCachedChapter(item.bookId, item.chapter, locale, selected),
    ),
  );
  return Promise.all(verses.map((verse) => hydrateVerse(verse, locale, selected)));
}

export function prefetchVerses(
  verses: Verse[],
  locale: Locale,
  version?: BibleVersion,
) {
  void hydrateVerses(verses, locale, version).catch(() => undefined);
}
