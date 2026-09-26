import { Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreacherMark } from "@/components/mark";
import { useI18n } from "@/components/language-switch";
import { useHydratedVerse } from "@/components/use-hydrated-verse";
import { cn } from "@/lib/utils";
import { recobroSource } from "@/lib/bible";
import { localizeVerse, type Verse } from "@/lib/verses";
import { useAppStore } from "@/lib/store";

type VerseCardProps = {
  verse: Verse;
  variant?: "hero" | "list";
  onSend: (verse: Verse) => void;
};

export function VerseCard({ verse, variant = "list", onSend }: VerseCardProps) {
  const { locale, t } = useI18n();
  const meta = localizeVerse(verse, locale);
  const { verse: shown, loading, error, retry } = useHydratedVerse(verse, locale);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const saved = favorites.includes(verse.id);
  const source = shown?.source ?? recobroSource(locale);

  if (variant === "hero") {
    return (
      <article className="rounded-xl bg-card px-6 py-8 shadow-paper sm:px-8 sm:py-10">
        <PreacherMark className="mx-auto mb-5 size-24" />
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">{t("couldNotRead")}</p>
            <Button type="button" variant="outline" onClick={retry}>
              {t("retry")}
            </Button>
          </div>
        ) : loading || !shown ? (
          <p className="font-serif text-2xl leading-snug tracking-tight text-muted-foreground">
            {t("loadingVerse")}
          </p>
        ) : (
          <blockquote className="reader-verse-text tracking-tight text-foreground sm:text-[1.15em]">
            {shown.text}
          </blockquote>
        )}
        <p className="mt-6 font-sans text-sm font-medium tracking-[0.14em] text-primary uppercase">
          {shown?.ref ?? meta.ref}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{source}</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button
            className="sm:flex-1"
            size="lg"
            disabled={!shown}
            onClick={() => shown && onSend(shown)}
          >
            <Send />
            {t("sendThisVerse")}
          </Button>
          <Button
            type="button"
            variant={saved ? "secondary" : "outline"}
            size="lg"
            className="sm:w-auto"
            disabled={!shown}
            onClick={() => shown && toggleFavorite(verse.id, shown)}
            aria-pressed={saved}
          >
            <Heart className={cn(saved && "fill-primary text-primary")} />
            {saved ? t("saved") : t("save")}
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-lg bg-card px-4 py-4 shadow-paper">
      {error ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t("couldNotRead")}</p>
          <Button type="button" variant="ghost" size="sm" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      ) : loading || !shown ? (
        <p className="font-serif text-lg leading-snug text-muted-foreground">
          {t("loadingVerse")}
        </p>
      ) : (
        <p className="font-serif text-lg leading-snug text-foreground">{shown.text}</p>
      )}
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
