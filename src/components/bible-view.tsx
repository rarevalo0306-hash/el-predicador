import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Heart, Languages, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import {
  bookAbbr,
  bookById,
  bookName,
  filterBooks,
  formatPlace,
  parseReference,
  recobroChapterUrl,
  recobroCopyright,
  recobroOrigin,
  recobroSource,
  recobroVerseId,
  type BibleBook,
} from "@/lib/bible";
import { chapterToVerses, loadCachedChapter, type RecobroChapter } from "@/lib/recobro";
import { isSamePlace, useAppStore, type ReadingPlace } from "@/lib/store";
import type { Verse } from "@/lib/verses";
import { NviCompare } from "@/components/nvi-compare";

type BibleViewProps = {
  onSend: (verse: Verse) => void;
};

export function BibleView({ onSend }: BibleViewProps) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [bookId, setBookId] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [data, setData] = useState<RecobroChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);

  const book = bookId ? bookById(bookId) : undefined;
  const parsed = useMemo(() => parseReference(query), [query]);
  const visibleBooks = useMemo(() => filterBooks(query), [query]);
  const readingPlace = useAppStore((s) => s.readingPlace);
  const setReadingPlace = useAppStore((s) => s.setReadingPlace);
  const bookmarks = useAppStore((s) => s.bookmarks);

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
    void loadCachedChapter(book.id, chapter, locale)
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
  }, [book, chapter, locale, t]);

  function openBook(next: BibleBook) {
    setBookId(next.id);
    setChapter(null);
    setSelected(null);
    setQuery("");
  }

  function openChapter(nextBook: BibleBook, nextChapter: number, verse?: number) {
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
        }}
        onChapter={(next) => {
          setChapter(next);
          setSelected(null);
        }}
        onSend={onSend}
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
            {recobroSource(locale)}
          </p>
        </header>
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

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-serif text-3xl tracking-tight">{t("bibleTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("bibleSub")}
        </p>
      </header>
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
      {visibleBooks.length === 0 ? (
        <p className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-paper">
          {t("noBook")}
        </p>
      ) : (
        <>
          {at.length > 0 ? (
            <BookGroup title={t("oldTestament")} books={at} onOpen={openBook} />
          ) : null}
          {nt.length > 0 ? (
            <BookGroup title={t("newTestament")} books={nt} onOpen={openBook} />
          ) : null}
        </>
      )}
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
    </div>
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
}) {
  const { locale, t } = useI18n();
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const verses = data && book ? chapterToVerses(book, data, locale) : [];
  const selectedId =
    selected !== null
      ? recobroVerseId(book.id, chapter, selected, locale)
      : null;
  const selectedVerse =
    selectedId ? verses.find((item) => item.id === selectedId) : undefined;
  const officialUrl = recobroChapterUrl(book, chapter, locale);
  const currentPlace: ReadingPlace = {
    bookId: book.id,
    chapter,
    verse: selected ?? undefined,
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

  useEffect(() => {
    if (selected === null) return;
    const node = document.getElementById(`verse-${selected}`);
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected, data]);

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
          {recobroSource(locale)}
        </p>
      </header>
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
              {t("openRecobro")}
            </a>
          </Button>
        </div>
      ) : null}
      {verses.length > 0 ? (
        <div className="rounded-xl bg-card px-4 py-5 shadow-paper">
          <div className="flex flex-col gap-3">
            {verses.map((verse) => {
              const n = Number(verse.id.split("-").at(-1));
              const active = selected === n;
              return (
                <button
                  key={verse.id}
                  id={`verse-${n}`}
                  type="button"
                  onClick={() => onSelected(active ? null : n)}
                  className={cn(
                    "flex gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150",
                    active ? "bg-secondary" : "hover:bg-secondary/60",
                    markedVerses.has(n) && !active && "bg-secondary/50",
                  )}
                >
                  <span className="mt-1 flex w-6 shrink-0 flex-col items-center gap-1 text-xs font-medium text-primary">
                    {n}
                    {markedVerses.has(n) ? (
                      <Bookmark className="size-3 fill-primary text-primary" />
                    ) : null}
                  </span>
                  <span className="font-serif text-[1.05rem] leading-relaxed text-foreground">
                    {verse.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {selectedVerse ? (
        <div className="sticky bottom-24 z-30 flex gap-2 rounded-xl bg-card p-3 shadow-paper">
          <Button
            className="flex-1"
            onClick={() => onSend(selectedVerse)}
          >
            <Send />
            {t("sendN", { ref: `${abbr} ${chapter}:${selected}` })}
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
            aria-pressed={favorites.includes(selectedVerse.id)}
            onClick={() => {
              toggleFavorite(selectedVerse.id, selectedVerse);
              toast(
                favorites.includes(selectedVerse.id)
                  ? t("removedSaved")
                  : t("saved"),
              );
            }}
          >
            <Heart
              className={cn(
                favorites.includes(selectedVerse.id) && "fill-primary text-primary",
              )}
            />
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">{t("tapVerse")}</p>
      )}
      <p className="pb-2 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
        {data?.copyright ?? recobroCopyright(locale)}.{" "}
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
