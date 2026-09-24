import { useEffect, useState } from "react";
import { BookOpen, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-switch";
import { bookAbbr, bookById, bookName, recobroSource } from "@/lib/bible";
import { chapterToVerses, loadCachedChapter } from "@/lib/recobro";
import { combineVerses } from "@/lib/reader-prefs";
import type { VerseLink } from "@/lib/verse-links";
import type { Verse } from "@/lib/verses";

type VerseSheetProps = {
  link: VerseLink | null;
  onClose: () => void;
  onSend?: (verse: Verse) => void;
  onRead?: (link: VerseLink) => void;
};

/**
 * The passage behind a tapped reference, read from the same Bible the app
 * uses, over whatever was open. From here it can be sent, or read in its
 * chapter.
 */
export function VerseSheet({ link, onClose, onSend, onRead }: VerseSheetProps) {
  const { locale, t } = useI18n();
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [failed, setFailed] = useState(false);
  const book = link ? bookById(link.bookId) : undefined;

  useEffect(() => {
    setVerses(null);
    setFailed(false);
    if (!link || !book) return;
    let cancelled = false;
    void loadCachedChapter(book.id, link.chapter, locale)
      .then((chapter) => {
        if (cancelled) return;
        const picked = chapterToVerses(book, chapter, locale).filter((verse) => {
          const n = Number(verse.id.split("-").at(-1));
          return n >= link.from && n <= link.to;
        });
        if (!picked.length) setFailed(true);
        setVerses(picked);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [link, book, locale]);

  useEffect(() => {
    if (!link) return;
    // Escape closes this card only, not the chat underneath it.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [link, onClose]);

  if (!link || !book) return null;
  const place =
    link.from === link.to
      ? `${bookName(book, locale)} ${link.chapter}:${link.from}`
      : `${bookName(book, locale)} ${link.chapter}:${link.from}-${link.to}`;
  const sendable =
    verses && verses.length
      ? verses.length === 1
        ? verses[0]!
        : combineVerses(verses, bookAbbr(book, locale), link.chapter)
      : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t("verseSheetClose")}
        className="absolute inset-0 cursor-default bg-foreground/30"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={place}
        className="relative mx-auto flex max-h-[80dvh] w-full max-w-lg flex-col rounded-t-xl bg-card text-card-foreground shadow-lg sm:rounded-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4 pb-2">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl tracking-tight">{place}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{recobroSource(locale)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t("verseSheetClose")}
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
          {failed ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("chapterOpenFail")}
            </p>
          ) : !verses ? (
            <p role="status" className="py-6 text-center text-sm text-muted-foreground">
              {t("openingChapter")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {verses.map((verse) => (
                <p key={verse.id} className="reader-verse-text flex gap-2">
                  {verses.length > 1 ? (
                    <span className="mt-1 w-5 shrink-0 text-xs font-medium text-primary">
                      {verse.id.split("-").at(-1)}
                    </span>
                  ) : null}
                  <span>{verse.text}</span>
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2 border-t border-border px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {onSend ? (
            <Button
              type="button"
              className="flex-1"
              disabled={!sendable}
              onClick={() => sendable && onSend(sendable)}
            >
              <Send />
              {t("askSend")}
            </Button>
          ) : null}
          {onRead ? (
            <Button type="button" variant="outline" className="flex-1" onClick={() => onRead(link)}>
              <BookOpen />
              {t("verseReadChapter")}
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
