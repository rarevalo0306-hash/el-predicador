import { designCopy } from "@/lib/design-copy";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VerseCard } from "@/components/verse-card";
import { useI18n } from "@/components/language-switch";
import { prefetchVerses } from "@/lib/recobro";
import { answerTopic } from "@/lib/topic-reply";
import { useAppStore, type SendDraft } from "@/lib/store";
import { THEMES, localizedTheme, versesForTheme, type ThemeId, type Verse } from "@/lib/verses";

type ThemesViewProps = {
  query: string;
  onQueryChange: (query: string) => void;
  themeId: ThemeId | null;
  onThemeChange: (id: ThemeId | null) => void;
  onSend: (verse: Verse, draft?: SendDraft) => void;
};

export function ThemesView({
  query,
  onQueryChange,
  themeId,
  onThemeChange,
  onSend,
}: ThemesViewProps) {
  const { locale, t } = useI18n();
  const copy = designCopy(locale);
  const [showAll, setShowAll] = useState(false);
  const featured = ["paz", "fortaleza", "esperanza", "familia"] as const;
  const photos: Record<ThemeId, string> = {
    paz: "peace",
    fortaleza: "strength",
    esperanza: "hope",
    familia: "family",
    jovenes: "youth",
    matrimonios: "marriage",
    amistad: "friendship",
    oracion: "prayer",
    amor: "love",
    fe: "faith",
    gratitud: "gratitude",
    bendicion: "blessing",
    consuelo: "comfort",
    sabiduria: "wisdom",
    perdon: "forgiveness",
    evangelio: "gospel",
  };
  // Re-read the themes when the verses DeepSeek added arrive.
  const extrasVersion = useAppStore((s) => s.themeExtrasVersion);
  const reply = query.trim() ? answerTopic(query, locale) : null;
  const results = reply?.verses ?? [];

  useEffect(() => {
    if (themeId) {
      prefetchVerses(versesForTheme(themeId), locale);
      return;
    }
    if (!results.length) return;
    // While typing, the verses are asked for once the words settle, not on
    // every letter.
    const timer = setTimeout(() => prefetchVerses(results, locale), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- results follow query
  }, [locale, query, themeId, extrasVersion]);

  if (themeId) {
    const theme = localizedTheme(themeId, locale);
    const verses = versesForTheme(themeId);
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => onThemeChange(null)}
          className="inline-flex h-11 w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("themesTitle")}
        </button>
        <header>
          <h1 className="screen-title">{theme.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{theme.line}</p>
        </header>
        <div className="flex flex-col gap-3">
          {verses.map((verse) => (
            <VerseCard key={verse.id} verse={verse} onSend={onSend} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="screen-title">{copy.themesTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.themesSub}</p>
      </header>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-10"
          type="search"
          aria-label={t("searchAria")}
        />
      </div>
      {query.trim() ? (
        <div className="flex flex-col gap-3">
          {reply ? (
            <article className="rounded-xl bg-card px-5 py-5 shadow-paper">
              <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                {t("topicReplyTitle")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{reply.title}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
                {reply.body}
              </p>
              {reply.verses[0] ? (
                <Button
                  type="button"
                  className="mt-4 h-11 w-full"
                  onClick={() =>
                    onSend(reply.verses[0]!, {
                      note: reply.body,
                      kind: "animo",
                    })
                  }
                >
                  <Send className="size-4" />
                  {t("sendThisReply")}
                </Button>
              ) : null}
            </article>
          ) : (
            <p className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-paper">
              {t("noVerses")}
            </p>
          )}
          {results.map((verse) => (
            <VerseCard key={verse.id} verse={verse} onSend={onSend} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 @min-[16rem]:grid-cols-2 gap-3">
            {featured
              .map((id) => THEMES.find((theme) => theme.id === id)!)
              .map((theme) => {
                const copy = localizedTheme(theme.id, locale);
                const count = versesForTheme(theme.id).length;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onThemeChange(theme.id)}
                    className="theme-feature"
                  >
                    <img
                      src={`/images/${photos[theme.id]}.jpg`}
                      alt=""
                      loading="lazy"
                      width="1086"
                      height="1448"
                    />
                    <span className="theme-feature-copy">
                      <strong>{copy.name}</strong>
                      <span>{copy.line}</span>
                      <small>{t("verseCount", { n: count })}</small>
                    </span>
                  </button>
                );
              })}
          </div>
          <button
            type="button"
            className="collection-link"
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? copy.fewerThemes : copy.moreThemes}
            <ChevronRight aria-hidden className="size-5" />
          </button>
          {showAll ? (
            <section aria-label={copy.allThemes} className="grid grid-cols-1 @min-[16rem]:grid-cols-2 gap-3">
              {THEMES.filter((theme) => !featured.some((id) => id === theme.id)).map((theme) => {
                const item = localizedTheme(theme.id, locale);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    className="theme-feature"
                    onClick={() => onThemeChange(theme.id)}
                  >
                    <img src={`/images/${photos[theme.id]}.jpg`} alt="" loading="lazy" width="1086" height="1448" />
                    <span className="theme-feature-copy">
                      <strong>{item.name}</strong>
                      <span>{item.line}</span>
                      <small>{t("verseCount", { n: versesForTheme(theme.id).length })}</small>
                    </span>
                  </button>
                );
              })}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
