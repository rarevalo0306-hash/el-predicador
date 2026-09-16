import { useEffect } from "react";
import { ArrowLeft, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VerseCard } from "@/components/verse-card";
import { useI18n } from "@/components/language-switch";
import { prefetchVerses } from "@/lib/recobro";
import { answerTopic } from "@/lib/topic-reply";
import type { SendDraft } from "@/lib/store";
import {
  THEMES,
  localizedTheme,
  versesForTheme,
  type ThemeId,
  type Verse,
} from "@/lib/verses";

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
  const reply = query.trim() ? answerTopic(query, locale) : null;
  const results = reply?.verses ?? [];

  useEffect(() => {
    if (themeId) prefetchVerses(versesForTheme(themeId), locale);
    else if (results.length) prefetchVerses(results, locale);
  }, [locale, query, themeId]);

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
          <h1 className="font-serif text-3xl tracking-tight">{theme.name}</h1>
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
        <h1 className="font-serif text-3xl tracking-tight">{t("themesTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("themesSub")}</p>
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
              <h2 className="mt-2 font-serif text-2xl tracking-tight">{reply.title}</h2>
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
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((theme) => {
            const copy = localizedTheme(theme.id, locale);
            const count = versesForTheme(theme.id).length;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onThemeChange(theme.id)}
                className="rounded-lg bg-card px-4 py-5 text-left shadow-paper transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <p className="font-serif text-xl tracking-tight text-foreground">
                  {copy.name}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {copy.line}
                </p>
                <p className="mt-3 text-xs font-medium tracking-[0.12em] text-primary uppercase">
                  {t("verseCount", { n: count })}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
