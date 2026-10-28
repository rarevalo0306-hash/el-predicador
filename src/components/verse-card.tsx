import { BibleCopyright } from "@/components/bible-copyright";
import { ArrowRight, Bookmark, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreacherMark } from "@/components/mark";
import { useI18n } from "@/components/language-switch";
import { useHydratedVerse } from "@/components/use-hydrated-verse";
import { cn } from "@/lib/utils";
import { recobroSource } from "@/lib/bible";
import { localizeVerse, type Verse } from "@/lib/verses";
import { useAppStore } from "@/lib/store";
import { TextSkeleton } from "@/components/text-skeleton";

type VerseCardProps = {
  verse: Verse;
  variant?: "hero" | "list" | "post";
  onReadChapter?: () => void;
  onSend: (verse: Verse) => void;
};

export function VerseCard({ verse, variant = "list", onSend, onReadChapter }: VerseCardProps) {
  const { locale, t } = useI18n();
  const meta = localizeVerse(verse, locale);
  const { verse: shown, loading, error, retry } = useHydratedVerse(verse, locale);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const saved = favorites.includes(verse.id);
  const source = shown?.source ?? recobroSource(locale);

  if (variant === "hero" || variant === "post") {
    const post = variant === "post";
    return (
      <article className={post ? "daily-post-content" : "rounded-xl bg-card px-6 py-8 shadow-paper sm:px-8 sm:py-10"}>
        {!post && <PreacherMark className="mx-auto mb-5 size-24" />}
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">{error || t("couldNotRead")}</p>
            <Button type="button" variant="outline" onClick={retry}>
              {t("retry")}
            </Button>
          </div>
        ) : loading || !shown ? (
          <TextSkeleton label={t("loadingVerse")} lines={3} lineClassName="h-7" />
        ) : (
          <blockquote className={post ? "whitespace-pre-wrap text-xl leading-relaxed tracking-[-0.015em] text-foreground sm:text-2xl" : "reader-verse-text tracking-tight text-foreground sm:text-[1.15em]"}>
            {shown.text}
          </blockquote>
        )}
        <p className="mt-6 font-sans text-sm font-medium tracking-[0.14em] text-primary uppercase">
          {shown?.ref ?? meta.ref}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{source}</p>
        <BibleCopyright
          notice={shown?.copyright}
          fumsToken={shown?.fumsToken}
          fumsId={shown?.fumsId}
        />
        {/* With large text the labels may run to two lines and the buttons
            stack, rather than spilling past the card. */}
        <div className={post ? "mt-5 grid grid-cols-2 gap-3" : "mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap"}>
          <Button
            className={cn("h-auto min-h-12 py-2 whitespace-normal sm:flex-1", post && "order-2 rounded-full")}
            variant={post ? "outline" : "default"}
            size="lg"
            disabled={!shown}
            onClick={() => shown && onSend(shown)}
          >
            <Send />
            {post ? (locale === "en" ? "Share" : "Compartir") : t("sendThisVerse")}
          </Button>
          <Button
            type="button"
            variant={saved ? "secondary" : "outline"}
            size="lg"
            className={cn("h-auto min-h-12 py-2 whitespace-normal sm:w-auto", post && "order-1 rounded-full")}
            disabled={!shown}
            onClick={() => shown && toggleFavorite(verse.id, shown)}
            aria-pressed={saved}
          >
            {post ? <Bookmark className={cn(saved && "fill-primary text-primary")} /> : <Heart className={cn(saved && "fill-primary text-primary")} />}
            {saved ? t("saved") : t("save")}
          </Button>
        </div>
        {post && onReadChapter ? (
          <button type="button" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary" onClick={onReadChapter}>
            {locale === "en" ? "Read the full chapter" : "Leer el capítulo completo"}
            <ArrowRight aria-hidden className="size-4" />
          </button>
        ) : null}
      </article>
    );
  }

  return (
    <article className="rounded-lg bg-card px-4 py-4 shadow-paper">
      {error ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{error || t("couldNotRead")}</p>
          <Button type="button" variant="ghost" size="sm" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      ) : loading || !shown ? (
        <TextSkeleton label={t("loadingVerse")} lines={2} lineClassName="h-5" />
      ) : (
        <p className="font-serif text-lg leading-snug text-foreground">{shown.text}</p>
      )}
      <BibleCopyright
        notice={shown?.copyright}
        fumsToken={shown?.fumsToken}
        fumsId={shown?.fumsId}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
          {shown?.ref ?? meta.ref}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!shown}
            aria-label={saved ? t("removeSaved") : t("saveVerse")}
            aria-pressed={saved}
            onClick={() => shown && toggleFavorite(verse.id, shown)}
          >
            <Heart className={cn(saved && "fill-primary text-primary")} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!shown}
            aria-label={t("sendVerse")}
            onClick={() => shown && onSend(shown)}
          >
            <Send />
          </Button>
        </div>
      </div>
    </article>
  );
}
