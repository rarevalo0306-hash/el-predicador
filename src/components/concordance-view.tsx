import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import {
  bookAbbr,
  bookById,
  bookName,
  recobroCopyright,
  recobroSource,
  recobroVerseId,
} from "@/lib/bible";
import {
  CONCORDANCE_CAP,
  cleanWords,
  lsmSearchPage,
  markWords,
  type ConcordanceHit,
  type ConcordanceResult,
} from "@/lib/concordance";
import { searchConcordance } from "@/lib/concordance-fn";
import type { Locale } from "@/lib/i18n";
import type { Verse } from "@/lib/verses";

type Filter = "all" | "at" | "nt";

// Kept for this visit only, so going back from a chapter shows the list again.
const answers = new Map<string, ConcordanceResult>();

function hitVerse(hit: ConcordanceHit, locale: Locale): Verse | null {
  const book = bookById(hit.bookId);
  if (!book) return null;
  return {
    id: recobroVerseId(book.id, hit.chapter, hit.verse, locale),
    ref: `${bookName(book, locale)} ${hit.chapter}:${hit.verse}`,
    book: bookName(book, locale),
    text: hit.text,
    themes: [],
    source: recobroSource(locale),
  };
}

/**
 * Concordance: every verse of the Recovery Version that holds the words
 * typed, marked where they appear. A verse opens in its chapter.
 */
export function ConcordanceView({
  initialWords,
  onBack,
  onWordsChange,
  onOpen,
  onSend,
}: {
  initialWords: string;
  onBack: () => void;
  onWordsChange: (words: string) => void;
  onOpen: (hit: ConcordanceHit) => void;
  onSend: (verse: Verse) => void;
}) {
  const { locale, t } = useI18n();
  const [draft, setDraft] = useState(initialWords);
  const [words, setWords] = useState(cleanWords(initialWords));
  const [result, setResult] = useState<ConcordanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setFailed(false);
    if (words.replace(/\s/g, "").length < 3) {
      setResult(null);
      return;
    }
    const key = `${locale}:${words.toLowerCase()}`;
    const known = answers.get(key);
    if (known) {
      setResult(known);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setResult(null);
    void searchConcordance({ data: { words, locale } })
      .then((answer) => {
        if (cancelled) return;
        if (answer.status === "ok") answers.set(key, answer);
        setResult(answer);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [words, locale]);

  function submit() {
    const next = cleanWords(draft);
    setFilter("all");
    setWords(next);
    onWordsChange(next);
  }

  const hits = result?.status === "ok" ? result.hits : [];
  const inTestament = (hit: ConcordanceHit, id: "at" | "nt") =>
    bookById(hit.bookId)?.testament === id;
  const counts = {
    all: hits.length,
    at: hits.filter((hit) => inTestament(hit, "at")).length,
    nt: hits.filter((hit) => inTestament(hit, "nt")).length,
  };
  const shown = filter === "all" ? hits : hits.filter((hit) => inTestament(hit, filter));
  const capped =
    result?.status === "ok" && (result.total > hits.length || hits.length >= CONCORDANCE_CAP);
  const tooShort = words !== "" && words.replace(/\s/g, "").length < 3;

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("bibleTitle")}
      </button>
      <header>
        <h1 className="font-serif text-3xl tracking-tight">{t("concordance")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("concordanceSub")}</p>
      </header>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("concordancePlaceholder")}
          type="search"
          enterKeyHint="search"
          aria-label={t("concordance")}
          className="text-base"
        />
        <Button type="submit" className="shrink-0" disabled={!cleanWords(draft)}>
          <Search />
          {t("concordanceSearch")}
        </Button>
      </form>
      {tooShort ? <p className="text-sm text-muted-foreground">{t("concordanceShort")}</p> : null}
      {loading ? (
        <p
          role="status"
          className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-paper"
        >
          {t("concordanceSearching")}
        </p>
      ) : null}
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {t("concordanceFail")}
        </p>
      ) : null}
      {result?.status === "unavailable" ? (
        <div className="flex flex-col gap-3 rounded-xl bg-card px-4 py-5 shadow-paper">
          <p className="text-sm leading-relaxed">{t("concordanceUnavailable")}</p>
          <Button asChild variant="outline" className="w-fit">
            <a href={lsmSearchPage(result.words, locale)} target="_blank" rel="noreferrer">
              <ExternalLink />
              {t("concordanceOpenLsm")}
            </a>
          </Button>
        </div>
      ) : null}
      {result?.status === "ok" && !loading ? (
        hits.length === 0 ? (
          <p className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-paper">
            {t("concordanceNone")}
          </p>
        ) : (
          <section className="flex flex-col gap-3">
            <div
              role="tablist"
              aria-label={t("concordance")}
              className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1"
            >
              {(["all", "at", "nt"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                  disabled={counts[id] === 0}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center rounded-lg px-1 py-1 text-center text-xs transition-colors duration-150 disabled:opacity-40",
                    filter === id
                      ? "bg-card text-foreground shadow-paper"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="font-medium leading-tight">
                    {id === "all"
                      ? t("concordanceAll")
                      : id === "at"
                        ? t("oldTestament")
                        : t("newTestament")}
                  </span>
                  <span className="text-[0.7rem]">{counts[id]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {hits.length === 1 ? t("concordanceOne") : t("concordanceCount", { n: hits.length })}
              {capped ? ` · ${t("concordanceCapped", { n: CONCORDANCE_CAP })}` : ""}
            </p>
            <ol className="flex flex-col gap-2">
              {shown.map((hit) => {
                const book = bookById(hit.bookId);
                if (!book) return null;
                const verse = hitVerse(hit, locale);
                return (
                  <li
                    key={`${hit.bookId}-${hit.chapter}-${hit.verse}`}
                    className="flex gap-1 rounded-xl bg-card shadow-paper"
                  >
                    <button
                      type="button"
                      onClick={() => onOpen(hit)}
                      className="min-w-0 flex-1 px-4 py-3 text-left"
                    >
                      <span className="block text-xs font-medium tracking-[0.08em] text-primary uppercase">
                        {bookAbbr(book, locale)} {hit.chapter}:{hit.verse}
                        <span className="ml-2 font-normal tracking-normal normal-case text-muted-foreground">
                          {bookName(book, locale)}
                        </span>
                      </span>
                      <span className="reader-verse-text mt-1 block text-foreground">
                        {markWords(hit.text, result.words).map((part, index) =>
                          part.mark ? (
                            <mark
                              key={index}
                              className="rounded-sm bg-primary/15 px-0.5 text-foreground"
                            >
                              {part.text}
                            </mark>
                          ) : (
                            part.text
                          ),
                        )}
                      </span>
                    </button>
                    {verse ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-1 mr-1 shrink-0"
                        aria-label={t("sendN", {
                          ref: `${bookAbbr(book, locale)} ${hit.chapter}:${hit.verse}`,
                        })}
                        onClick={() => onSend(verse)}
                      >
                        <Send />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
              {result.copyright ?? recobroCopyright(locale)}
            </p>
          </section>
        )
      ) : null}
    </div>
  );
}
