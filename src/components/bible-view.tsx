import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  Highlighter,
  Languages,
  MessageCircleQuestion,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import {
  BIBLE_BOOKS,
  bibleSource,
  bibleVerseId,
  bibleVersionsFor,
  bookAbbr,
  bookById,
  bookName,
  filterBooks,
  formatPlace,
  parseReference,
  recobroChapterUrl,
  recobroCopyright,
  recobroOrigin,
  type BibleVersion,
  type BibleBook,
} from "@/lib/bible";
import { chapterToVerses, loadCachedChapter, type RecobroChapter } from "@/lib/recobro";
import { isSamePlace, useAppStore, type ReadingPlace } from "@/lib/store";
import type { Verse } from "@/lib/verses";
import { NviCompare } from "@/components/nvi-compare";
import { ConcordanceView } from "@/components/concordance-view";
import { cleanWords } from "@/lib/concordance";
import { combineVerses, formatVerseRange } from "@/lib/reader-prefs";
import { copyText, formatVerseMessage } from "@/lib/share";
import { trackApiBibleFums } from "@/lib/api-bible-fums";
import { useRecoveryAvailable } from "@/lib/bible-availability";

/** A place to open as soon as the Bible shows, e.g. a verse tapped in a chat. */
export type BibleJump = { bookId: string; chapter: number; verse?: number; at: number };

type BibleViewProps = {
  onSend: (verse: Verse) => void;
  jump?: BibleJump | null;
  /** Called once the jump is shown, so coming back later starts fresh. */
  onJumpDone?: () => void;
  /** Ask Pregunta about the picked verses. */
  onAsk?: (ref: string, text: string) => void;
};

type Testament = "at" | "nt";
const TESTAMENT_KEY = "preacher-bible-testament";

function savedTestament(): Testament | null {
  try {
    const value = window.localStorage.getItem(TESTAMENT_KEY);
    return value === "at" || value === "nt" ? value : null;
  } catch {
    return null;
  }
}

export function BibleView({ onSend, jump, onJumpDone, onAsk }: BibleViewProps) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [bookId, setBookId] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [data, setData] = useState<RecobroChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);
  // The words of the open concordance (null when closed), and whether the
  // chapter being read was opened from it, so "back" returns to the list.
  const [concordance, setConcordance] = useState<string | null>(null);
  const [fromConcordance, setFromConcordance] = useState(false);

  const book = bookId ? bookById(bookId) : undefined;
  const parsed = useMemo(() => parseReference(query), [query]);
  const visibleBooks = useMemo(() => filterBooks(query), [query]);
  const readingPlace = useAppStore((s) => s.readingPlace);
  const setReadingPlace = useAppStore((s) => s.setReadingPlace);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const bibleVersion = useAppStore((s) => s.bibleVersions[locale]);
  const setBibleVersion = useAppStore((s) => s.setBibleVersion);
  const [testament, setTestament] = useState<Testament>(
    () =>
      savedTestament() ??
      (readingPlace ? (bookById(readingPlace.bookId)?.testament ?? "at") : "at"),
  );

  function pickTestament(next: Testament) {
    setTestament(next);
    try {
      window.localStorage.setItem(TESTAMENT_KEY, next);
    } catch {
      /* private mode */
    }
  }

  useEffect(() => {
    if (!jump) return;
    const next = bookById(jump.bookId);
    if (next) openChapter(next, jump.chapter, jump.verse);
    onJumpDone?.();
    // Only a new jump moves the reader; `at` tells two taps on one verse apart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump?.at]);

  useEffect(() => {
    if (!book || chapter === null) return;
    setReadingPlace({
      bookId: book.id,
      chapter,
      verse: selected ?? undefined,
      at: Date.now(),
    });
  }, [book, chapter, selected, setReadingPlace]);

  useEffect(() => {
    if (!book || chapter === null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    void loadCachedChapter(book.id, chapter, locale, bibleVersion)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : t("chapterOpenFail"),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, locale, bibleVersion, t]);

  useEffect(() => {
    void trackApiBibleFums(data?.fumsId).catch(() => undefined);
  }, [data?.fumsId]);

  function openBook(next: BibleBook) {
    setBookId(next.id);
    setChapter(null);
    setSelected(null);
    setQuery("");
  }

  function openChapter(nextBook: BibleBook, nextChapter: number, verse?: number) {
    setFromConcordance(false);
    setBookId(nextBook.id);
    setChapter(nextChapter);
    setSelected(verse ?? null);
    setQuery("");
  }

  function resumePlace(place: ReadingPlace) {
    const next = bookById(place.bookId);
    if (!next) return;
    openChapter(next, place.chapter, place.verse);
  }

  function handleSearch() {
    if (!parsed) return;
    openChapter(parsed.book, parsed.chapter, parsed.verse);
  }

  if (compare) {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => setCompare(false)}
          className="inline-flex h-11 w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("bibleTitle")}
        </button>
        <header>
          <h1 className="font-serif text-3xl tracking-tight">{t("nviTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("nviSub")}</p>
        </header>
        <NviCompare onSend={onSend} />
      </div>
    );
  }

  if (book && chapter !== null) {
    return (
      <ChapterReader
        book={book}
        chapter={chapter}
        data={data}
        loading={loading}
        error={error}
        selected={selected}
        onSelected={setSelected}
        onBack={() => {
          setChapter(null);
          setSelected(null);
          if (fromConcordance) {
            setBookId(null);
            setFromConcordance(false);
          }
        }}
        onChapter={(next) => {
          setChapter(next);
          setSelected(null);
        }}
        onSend={onSend}
        onAsk={onAsk}
        version={bibleVersion}
        onVersion={(version) => setBibleVersion(locale, version)}
      />
    );
  }

  if (concordance !== null) {
    return (
      <ConcordanceView
        initialWords={concordance}
        onBack={() => setConcordance(null)}
        onWordsChange={setConcordance}
        onSend={onSend}
        onOpen={(hit) => {
          const next = bookById(hit.bookId);
          if (!next) return;
          openChapter(next, hit.chapter, hit.verse);
          setFromConcordance(true);
        }}
      />
    );
  }

  if (book) {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => setBookId(null)}
          className="inline-flex h-11 w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("bibleTitle")}
        </button>
        <header>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            {book.testament === "at" ? t("oldTestament") : t("newTestament")}
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight">
            {bookName(book, locale)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {book.chapters}{" "}
            {book.chapters === 1 ? t("chapterOne") : t("chapters")} ·{" "}
            {bibleSource(bibleVersion, locale)}
          </p>
        </header>
        <BibleVersionPicker
          locale={locale}
          value={bibleVersion}
          onChange={(version) => setBibleVersion(locale, version)}
        />
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {Array.from({ length: book.chapters }, (_, index) => {
            const n = index + 1;
            return (
              <button
                key={n}
                type="button"
                onClick={() => openChapter(book, n)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-md bg-card text-sm font-medium shadow-paper transition-transform duration-150 ease-out active:scale-[0.96]",
                  readingPlace?.bookId === book.id &&
                    readingPlace.chapter === n &&
                    "bg-primary text-primary-foreground",
                  bookmarks.some(
                    (place) => place.bookId === book.id && place.chapter === n,
                  ) &&
                    !(readingPlace?.bookId === book.id && readingPlace.chapter === n) &&
                    "ring-1 ring-primary/40",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const at = visibleBooks.filter((item) => item.testament === "at");
  const nt = visibleBooks.filter((item) => item.testament === "nt");
  const searching = query.trim().length > 0;
  const wordSearch = !parsed && cleanWords(query).replace(/\s/g, "").length >= 3;
  const counts = {
    at: BIBLE_BOOKS.filter((item) => item.testament === "at").length,
    nt: BIBLE_BOOKS.filter((item) => item.testament === "nt").length,
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-serif text-3xl tracking-tight">{t("bibleTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("bibleSub")}
        </p>
      </header>
      <BibleVersionPicker
        locale={locale}
        value={bibleVersion}
        onChange={(version) => setBibleVersion(locale, version)}
      />
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={locale === "en" ? t("searchRefEn") : t("searchRef")}
          type="search"
          aria-label={t("searchRefAria")}
        />
        <Button type="submit" disabled={!parsed} className="shrink-0">
          {t("go")}
        </Button>
      </form>
      {wordSearch ? (
        <button
          type="button"
          onClick={() => {
            setConcordance(cleanWords(query));
            setQuery("");
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-card px-4 py-3 text-left text-sm font-medium text-primary shadow-paper transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          <Search className="size-5 shrink-0" />
          {t("concordanceSearchFor", { q: cleanWords(query) })}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setCompare(true)}
        className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-4 text-left shadow-paper transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        <Languages className="size-5 shrink-0 text-primary" />
        <span className="min-w-0">
          <span className="block font-medium">{t("nviTitle")}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {t("nviCardLine")}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => setConcordance("")}
        className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-4 text-left shadow-paper transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        <Search className="size-5 shrink-0 text-primary" />
        <span className="min-w-0">
          <span className="block font-medium">{t("concordance")}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {t("concordanceLine")}
          </span>
        </span>
      </button>
      {readingPlace ? (
        <PlaceCard
          place={readingPlace}
          label={t("continueReading")}
          line={t("whereYouLeft")}
          onOpen={() => resumePlace(readingPlace)}
        />
      ) : null}
      {bookmarks.filter(
        (place) => !readingPlace || !isSamePlace(place, readingPlace),
      ).length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
            {t("bookmarks")}
          </h2>
          <div className="flex flex-col gap-2">
            {bookmarks
              .filter((place) => !readingPlace || !isSamePlace(place, readingPlace))
              .map((place) => (
              <PlaceCard
                key={`${place.bookId}-${place.chapter}-${place.verse ?? 0}`}
                place={place}
                label={t("bookmark")}
                onOpen={() => resumePlace(place)}
              />
            ))}
          </div>
        </section>
      ) : null}
      {visibleBooks.length === 0 && !wordSearch ? (
        <p className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-paper">
          {t("noBook")}
        </p>
      ) : visibleBooks.length === 0 ? null : searching ? (
        <>
          {at.length > 0 ? (
            <BookGroup title={t("oldTestament")} books={at} onOpen={openBook} />
          ) : null}
          {nt.length > 0 ? (
            <BookGroup title={t("newTestament")} books={nt} onOpen={openBook} />
          ) : null}
        </>
      ) : (
        <section className="flex flex-col gap-3">
          <div
            role="tablist"
            aria-label={t("bibleTitle")}
            className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1"
          >
            {(["at", "nt"] as const).map((id) => {
              const active = testament === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => pickTestament(id)}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-center transition-colors duration-150",
                    active
                      ? "bg-card text-foreground shadow-paper"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="font-serif text-base leading-tight">
                    {id === "at" ? t("oldTestament") : t("newTestament")}
                  </span>
                  <span className="text-[0.7rem] tracking-wide">
                    {t("booksCount", { n: counts[id] })}
                  </span>
                </button>
              );
            })}
          </div>
          <BookGrid books={testament === "at" ? at : nt} onOpen={openBook} />
        </section>
      )}
      {bibleVersion === "recovery" ? (
        <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
          {t("recobroFooter")}{" "}
          <a
            href={recobroOrigin(locale)}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-primary/40 underline-offset-2"
          >
            {locale === "en" ? "text.recoveryversion.bible" : "texto.versionrecobro.org"}
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}

function BibleVersionPicker({
  locale,
  value,
  onChange,
}: {
  locale: "es" | "en";
  value: BibleVersion;
  onChange: (version: BibleVersion) => void;
}) {
  const { t } = useI18n();
  const recoveryAvailable = useRecoveryAvailable();
  const choices = bibleVersionsFor(locale);
  return (
    <section className="rounded-xl bg-card p-3 shadow-paper">
      <div className="px-1 pb-2">
        <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
          {t("bibleVersion")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("bibleVersionHelp")}</p>
      </div>
      <div role="radiogroup" aria-label={t("bibleVersion")} className="grid grid-cols-2 gap-1">
        {choices.map((choice) => {
          const active = choice.id === value;
          // Recobro waits for Living Stream Ministry's official access.
          const soon = choice.id === "recovery" && !recoveryAvailable;
          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={soon}
              onClick={() => onChange(choice.id)}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
                active
                  ? "bg-primary text-primary-foreground"
                  : soon
                    ? "bg-secondary/60 text-muted-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{choice.shortLabel}</span>
              {soon ? (
                <span className="text-[0.7rem] font-normal">{t("bibleVersionSoon")}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PlaceCard({
  place,
  label,
  line,
  onOpen,
}: {
  place: ReadingPlace;
  label: string;
  line?: string;
  onOpen: () => void;
}) {
  const { locale } = useI18n();
  const book = bookById(place.bookId);
  if (!book) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-4 text-left shadow-paper transition-transform duration-150 ease-out active:scale-[0.98]"
    >
      <Bookmark className="size-5 shrink-0 fill-primary text-primary" />
      <span className="min-w-0">
        <span className="block text-xs font-medium tracking-[0.14em] text-primary uppercase">
          {label}
        </span>
        <span className="mt-1 block font-serif text-xl tracking-tight">
          {formatPlace(book, place.chapter, place.verse, locale)}
        </span>
        {line ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{line}</span>
        ) : null}
      </span>
    </button>
  );
}

/** One testament's books, two to a row so the whole list fits at a glance. */
function BookGrid({
  books,
  onOpen,
}: {
  books: BibleBook[];
  onOpen: (book: BibleBook) => void;
}) {
  const { locale } = useI18n();
  const readingPlace = useAppStore((s) => s.readingPlace);
  return (
    <div role="tabpanel" className="grid grid-cols-2 gap-2">
      {books.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(item)}
          className={cn(
            "flex min-h-12 items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-left text-sm shadow-paper transition-transform duration-150 ease-out active:scale-[0.97]",
            readingPlace?.bookId === item.id && "ring-1 ring-primary/40",
          )}
        >
          <span className="min-w-0 font-medium leading-snug">{bookName(item, locale)}</span>
          <span className="shrink-0 text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
            {bookAbbr(item, locale)}
          </span>
        </button>
      ))}
    </div>
  );
}

function BookGroup({
  title,
  books,
  onOpen,
}: {
  title: string;
  books: BibleBook[];
  onOpen: (book: BibleBook) => void;
}) {
  const { locale } = useI18n();
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl bg-card shadow-paper">
        {books.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item)}
            className={cn(
              "flex h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm hover:bg-secondary/80",
              index !== 0 && "border-t border-border/70",
            )}
          >
            <span className="font-medium">{bookName(item, locale)}</span>
            <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
              {bookAbbr(item, locale)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ChapterReader({
  book,
  chapter,
  data,
  loading,
  error,
  selected,
  onSelected,
  onBack,
  onChapter,
  onSend,
  onAsk,
  version,
  onVersion,
}: {
  book: BibleBook;
  chapter: number;
  data: RecobroChapter | null;
  loading: boolean;
  error: string | null;
  selected: number | null;
  onSelected: (n: number | null) => void;
  onBack: () => void;
  onChapter: (chapter: number) => void;
  onSend: (verse: Verse) => void;
  onAsk?: (ref: string, text: string) => void;
  version: BibleVersion;
  onVersion: (version: BibleVersion) => void;
}) {
  const { locale, t } = useI18n();
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const highlights = useAppStore((s) => s.highlights);
  const toggleHighlight = useAppStore((s) => s.toggleHighlight);
  const displayName = useAppStore((s) => s.displayName);
  const [picked, setPicked] = useState<number[]>(() =>
    selected !== null ? [selected] : [],
  );

  useEffect(() => {
    setPicked(selected !== null ? [selected] : []);
  }, [book.id, chapter]);

  useEffect(() => {
    if (selected === null) return;
    setPicked((prev) => (prev.includes(selected) ? prev : [...prev, selected]));
  }, [selected]);

  const verses = data && book ? chapterToVerses(book, data, locale) : [];
  const pickedSorted = useMemo(
    () => [...picked].sort((a, b) => a - b),
    [picked],
  );
  const pickedVerses = useMemo(
    () =>
      pickedSorted
        .map((n) =>
          verses.find(
            (item) => item.id === bibleVerseId(version, book.id, chapter, n, locale),
          ),
        )
        .filter((item): item is Verse => Boolean(item)),
    [pickedSorted, verses, book.id, chapter, locale, version],
  );
  const combined = useMemo(
    () => combineVerses(pickedVerses, bookAbbr(book, locale), chapter),
    [pickedVerses, book, chapter, locale],
  );
  const rangeLabel = formatVerseRange(pickedSorted);
  const officialUrl =
    data?.url ??
    (version === "recovery" ? recobroChapterUrl(book, chapter, locale) : "https://www.lockman.org/");
  const lastPicked = pickedSorted.at(-1) ?? null;
  const currentPlace: ReadingPlace = {
    bookId: book.id,
    chapter,
    verse: lastPicked ?? undefined,
    at: Date.now(),
  };
  const marked = bookmarks.some((place) => isSamePlace(place, currentPlace));
  const chapterMarked = bookmarks.some(
    (place) =>
      place.bookId === book.id && place.chapter === chapter && !place.verse,
  );
  const markedVerses = new Set(
    bookmarks
      .filter((place) => place.bookId === book.id && place.chapter === chapter)
      .map((place) => place.verse)
      .filter((verse): verse is number => Boolean(verse)),
  );
  const name = bookName(book, locale);
  const abbr = bookAbbr(book, locale);
  const allHighlighted =
    pickedVerses.length > 0 &&
    pickedVerses.every((v) => highlights.includes(v.id));

  useEffect(() => {
    if (lastPicked === null) return;
    const node = document.getElementById(`verse-${lastPicked}`);
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [lastPicked, data]);

  function togglePick(n: number) {
    setPicked((prev) => {
      const next = prev.includes(n)
        ? prev.filter((item) => item !== n)
        : [...prev, n];
      onSelected(next.length ? next[next.length - 1]! : null);
      return next;
    });
  }

  async function handleCopy() {
    if (!combined) return;
    try {
      await copyText(formatVerseMessage(combined, undefined, displayName, locale));
      toast(t("copied"));
    } catch {
      toast(t("copyFail"));
    }
  }

  function handleHighlight() {
    if (!pickedVerses.length) return;
    for (const verse of pickedVerses) {
      const on = highlights.includes(verse.id);
      if (allHighlighted) {
        if (on) toggleHighlight(verse.id);
      } else if (!on) {
        toggleHighlight(verse.id, verse);
      }
    }
    toast(allHighlighted ? t("highlightOff") : t("highlightOn"));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {name}
        </button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={chapter <= 1}
            aria-label={t("prevChapter")}
            onClick={() => onChapter(chapter - 1)}
          >
            <ChevronLeft />
          </Button>
          <p className="min-w-10 text-center text-sm font-medium">{chapter}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={chapter >= book.chapters}
            aria-label={t("nextChapter")}
            onClick={() => onChapter(chapter + 1)}
          >
            <ChevronRight />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={chapterMarked ? t("unmarkChapter") : t("markChapter")}
            aria-pressed={chapterMarked}
            onClick={() => {
              toggleBookmark({
                bookId: book.id,
                chapter,
                at: Date.now(),
              });
              toast(chapterMarked ? t("bookmarkRemoved") : t("chapterMarked"));
            }}
          >
            <Bookmark className={cn(chapterMarked && "fill-primary text-primary")} />
          </Button>
        </div>
      </div>
      <header>
        <h1 className="font-serif text-3xl tracking-tight">
          {name} {chapter}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {bibleSource(version, locale)}
        </p>
      </header>
      <BibleVersionPicker locale={locale} value={version} onChange={onVersion} />
      {loading ? (
        <p className="rounded-lg bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-paper">
          {t("openingChapter")}
        </p>
      ) : null}
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-10 text-center shadow-paper">
          <p className="font-serif text-xl">{t("couldNotRead")}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
          <Button asChild>
            <a href={officialUrl} target="_blank" rel="noreferrer">
              {t("source")}
            </a>
          </Button>
        </div>
      ) : null}
      {verses.length > 0 ? (
        <div className="rounded-xl bg-card px-4 py-5 shadow-paper">
          <div className="flex flex-col gap-3">
            {verses.map((verse) => {
              const n = Number(verse.id.split("-").at(-1));
              const active = picked.includes(n);
              const lit = highlights.includes(verse.id);
              return (
                <button
                  key={verse.id}
                  id={`verse-${n}`}
                  type="button"
                  onClick={() => togglePick(n)}
                  aria-pressed={active}
                  className={cn(
                    "flex gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150",
                    active ? "bg-secondary ring-1 ring-primary/30" : "hover:bg-secondary/60",
                    markedVerses.has(n) && !active && "bg-secondary/40",
                  )}
                >
                  <span className="mt-1 flex w-6 shrink-0 flex-col items-center gap-1 text-xs font-medium text-primary">
                    {n}
                    {markedVerses.has(n) ? (
                      <Bookmark className="size-3 fill-primary text-primary" />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "reader-verse-text text-foreground",
                      lit && "verse-highlight",
                    )}
                  >
                    {verse.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {combined ? (
        <div className="sticky bottom-24 z-30 flex flex-col gap-2 rounded-xl bg-card p-3 shadow-paper">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-medium text-primary">
              {pickedSorted.length > 1
                ? t("versesSelected", { n: pickedSorted.length })
                : `${abbr} ${chapter}:${rangeLabel}`}
            </p>
            {pickedSorted.length > 1 ? (
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => {
                  setPicked([]);
                  onSelected(null);
                }}
              >
                {t("clearSelection")}
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button className="min-w-0 flex-1" onClick={() => onSend(combined)}>
              <Send />
              <span className="truncate">{t("sendN", { ref: `${abbr} ${chapter}:${rangeLabel}` })}</span>
            </Button>
            {onAsk ? (
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                aria-label={t("askVerses")}
                onClick={() =>
                  onAsk(
                    `${name} ${chapter}:${rangeLabel}`,
                    pickedVerses.map((verse) => verse.text).join(" "),
                  )
                }
              >
                <MessageCircleQuestion />
                {t("askVersesShort")}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("copyVerses")}
              onClick={() => void handleCopy()}
            >
              <Copy />
            </Button>
            <Button
              type="button"
              variant={allHighlighted ? "secondary" : "outline"}
              size="icon"
              aria-label={allHighlighted ? t("unhighlightVerse") : t("highlightVerse")}
              aria-pressed={allHighlighted}
              onClick={handleHighlight}
            >
              <Highlighter
                className={cn(allHighlighted && "fill-amber-400 text-amber-700")}
              />
            </Button>
            <Button
              type="button"
              variant={marked ? "secondary" : "outline"}
              size="icon"
              aria-label={marked ? t("unmarkHere") : t("markHere")}
              aria-pressed={marked}
              onClick={() => {
                toggleBookmark(currentPlace);
                toast(marked ? t("bookmarkRemoved") : t("bookmarkSet"));
              }}
            >
              <Bookmark className={cn(marked && "fill-primary text-primary")} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("saveVerse")}
              aria-pressed={pickedVerses.every((v) => favorites.includes(v.id))}
              onClick={() => {
                for (const verse of pickedVerses) {
                  if (!favorites.includes(verse.id)) {
                    toggleFavorite(verse.id, verse);
                  }
                }
                toast(t("saved"));
              }}
            >
              <Heart
                className={cn(
                  pickedVerses.some((v) => favorites.includes(v.id)) &&
                    "fill-primary text-primary",
                )}
              />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">{t("tapVerse")}</p>
      )}
      <p className="pb-2 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
        {data?.copyright ??
          (version === "recovery" ? recobroCopyright(locale) : bibleSource(version, locale))}.{" "}
        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-primary/40 underline-offset-2"
        >
          {t("source")}
        </a>
      </p>
    </div>
  );
}
