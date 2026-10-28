import { selectedVerseText } from "./verse-selection";
import { createServerFn } from "@tanstack/react-start";
import {
  BIBLE_BOOKS,
  defaultBibleTranslation,
  validateBibleTranslation,
  type BibleTranslation,
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
  translation?: BibleTranslation;
  bookId: string;
  bookName: string;
  chapter: number;
  url: string;
  copyright: string;
  verses: RecobroVerse[];
  expiresAt: number;
  fumsToken?: string;
  fumsId?: string;
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
    .replace(/&#(\d+);/g, (_full, code: string) => String.fromCharCode(Number(code)))
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
  const pattern = /<p id="[^"]*-(\d+)" class="verse">[\s\S]*?<\/b>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const n = Number(match[1]);
    const text = stripHtml(match[2] ?? "");
    if (n && text) verses.push({ n, text });
  }
  return verses;
}

function toVerse(book: BibleBook, chapter: number, item: RecobroVerse, locale: Locale): Verse {
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
  translation = defaultBibleTranslation(locale),
): Promise<RecobroChapter> {
  const { loadApiBibleChapter } = await import("@/lib/api-bible.server");
  const { payload, expiresAt } = await loadApiBibleChapter(book, chapter, translation);
  return {
    translation,
    bookId: book.id,
    bookName: bookName(book, locale),
    chapter,
    url: "https://api.bible",
    copyright: payload.copyright as string,
    verses: payload.verses as RecobroVerse[],
    expiresAt,
    fumsToken: payload.fumsToken as string | undefined,
    fumsId: payload.fumsId as string | undefined,
  };
}

export const fetchRecobroChapter = createServerFn({ method: "POST" })
  .validator(
    (data: {
      bookId: string;
      chapter: number;
      locale?: Locale;
      translation?: BibleTranslation;
    }) => {
      const book = bookById(data.bookId);
      const locale: Locale = data.locale === "en" ? "en" : "es";
      if (!book) throw new Error(t(locale, "bookNotFound"));
      const chapter = Number(data.chapter);
      if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
        throw new Error(t(locale, "chapterNotFound"));
      }
      return {
        translation: validateBibleTranslation(data.translation, locale),
        bookId: book.id,
        chapter,
        locale,
      };
    },
  )
  .handler(async ({ data }): Promise<RecobroChapter> => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    const book = bookById(data.bookId);
    if (!book) throw new Error(t(data.locale, "bookNotFound"));
    return loadRecobro(book, data.chapter, data.locale, data.translation);
  });

export function chapterToVerses(
  book: BibleBook,
  chapter: RecobroChapter,
  locale: Locale = "es",
): Verse[] {
  return chapter.verses.map((item) => ({
    ...toVerse(book, chapter.chapter, item, locale),
    source: recobroSource(locale, chapter.translation),
    copyright: chapter.copyright,
    expiresAt: chapter.expiresAt,
    fumsToken: chapter.fumsToken,
    fumsId: chapter.fumsId,
  }));
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
  translation = defaultBibleTranslation(locale),
) {
  return `${translation}:${locale}:${bookId}:${chapter}`;
}

export function loadCachedChapter(
  bookId: string,
  chapter: number,
  locale: Locale,
  translation = defaultBibleTranslation(locale),
): Promise<RecobroChapter> {
  const key = chapterKey(bookId, chapter, locale, translation);
  const hit = chapterMemory.get(key);
  if (hit instanceof Promise || (hit && hit.expiresAt > Date.now())) return Promise.resolve(hit);
  chapterMemory.delete(key);
  const pending = fetchRecobroChapter({ data: { bookId, chapter, locale, translation } })
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
    .join(" ");
}

function builtFromChapter(
  verse: Verse,
  span: NonNullable<ReturnType<typeof catalogSpan>>,
  chapter: RecobroChapter,
  locale: Locale,
): Verse | null {
  const text = selectedVerseText(chapter.verses, span);
  if (!text) return null;
  const name = bookName(span.book, locale);
  const ref = span.selected
    ? `${name} ${span.chapter}:${span.selected.join(", ")}`
    : span.from === span.to
      ? `${name} ${span.chapter}:${span.from}`
      : `${name} ${span.chapter}:${span.from}-${span.to}`;
  const catalog = getVerseById(verse.id);
  return {
    ...(catalog ?? verse),
    id: verse.id,
    ref,
    book: name,
    text,
    source: recobroSource(locale, chapter.translation),
    copyright: chapter.copyright,
    expiresAt: chapter.expiresAt,
    fumsToken: chapter.fumsToken,
    fumsId: chapter.fumsId,
  };
}

export function canChangeMessageLanguage(verse: Verse): boolean {
  return (
    !isComposedVerse(verse.id) ||
    verse.id.startsWith("doctrina-") ||
    (verse.id.startsWith("caso-") && verse.id !== "caso-testigos-nwt") ||
    verse.id === "evangelio-camino" ||
    verse.id === "evangelio-oracion"
  );
}

export function peekHydratedVerse(
  verse: Verse,
  locale: Locale,
  translation = defaultBibleTranslation(locale),
): Verse | null {
  if (isComposedVerse(verse.id)) return null;
  const span = catalogSpan(getVerseById(verse.id) ?? verse);
  if (!span) {
    if (getVerseById(verse.id)) return null;
    return null;
  }
  const hit = chapterMemory.get(chapterKey(span.book.id, span.chapter, locale, translation));
  if (!hit || hit instanceof Promise || hit.expiresAt <= Date.now()) return null;
  return builtFromChapter(verse, span, hit, locale);
}

export async function hydrateVerse(
  verse: Verse,
  locale: Locale,
  translation = defaultBibleTranslation(locale),
): Promise<Verse> {
  const peeked = peekHydratedVerse(verse, locale, translation);
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
    throw new Error(
      "Esta lectura guardada pertenece a una versión retirada. Busca la referencia en LBLA.",
    );
  }
  const chapter = await loadCachedChapter(span.book.id, span.chapter, locale, translation);
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
    [...unique.values()].map((item) => loadCachedChapter(item.bookId, item.chapter, locale)),
  );
  return Promise.all(verses.map((verse) => hydrateVerse(verse, locale)));
}

export function prefetchVerses(_verses: Verse[], _locale: Locale) {
  // On-demand only: do not spend the shared budget on speculative reads.
}
