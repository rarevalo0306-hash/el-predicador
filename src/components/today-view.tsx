import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/verse-card";
import { ContactForm } from "@/components/contact-form";
import { useI18n } from "@/components/language-switch";
import { prefetchVerses } from "@/lib/recobro";
import { useAppStore, type SendDraft } from "@/lib/store";
import { getDailyReflection, type DailyReflection } from "@/lib/daily-reflection";
import {
  getDailyVerse,
  todayKey,
  versesForTheme,
  type ThemeId,
  type Verse,
} from "@/lib/verses";
import { cn } from "@/lib/utils";

const MOODS: ThemeId[] = ["amor", "paz", "fortaleza", "esperanza", "consuelo"];

type TodayViewProps = {
  mood: ThemeId | null;
  onMoodChange: (mood: ThemeId | null) => void;
  onSend: (verse: Verse, draft?: SendDraft) => void;
};

export function TodayView({ mood, onMoodChange, onSend }: TodayViewProps) {
  const { locale, t } = useI18n();
  const dailyOffset = useAppStore((s) => s.dailyOffset);
  const bumpOffset = useAppStore((s) => s.bumpOffset);
  const bibleVersion = useAppStore((s) => s.bibleVersions[locale]);
  const [showContact, setShowContact] = useState(false);
  const [asked, setAsked] = useState(true);
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [reflecting, setReflecting] = useState(false);

  // The word of the day, written once for everyone; nothing shows if it is not there.
  useEffect(() => {
    let cancelled = false;
    setReflection(null);
    setReflecting(true);
    getDailyReflection({ data: { day: todayKey(), locale } })
      .then((result) => {
        if (!cancelled) setReflection(result);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReflecting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    try {
      setAsked(localStorage.getItem("preacher-contacted") === "1");
    } catch {
      setAsked(false);
    }
  }, []);

  const daily = getDailyVerse(dailyOffset);
  const moodVerses = mood ? versesForTheme(mood) : [];
  const verse =
    mood && moodVerses.length > 0
      ? moodVerses[dailyOffset % moodVerses.length]!
      : daily;

  useEffect(() => {
    prefetchVerses(
      mood ? versesForTheme(mood) : [getDailyVerse(dailyOffset)],
      locale,
      bibleVersion,
    );
  }, [dailyOffset, locale, mood, bibleVersion]);
  const now = new Date();
  const dateLabel =
    locale === "en"
      ? format(now, "EEEE, MMMM d", { locale: enUS })
      : format(now, "EEEE d 'de' MMMM", { locale: es });
  const moodLabel: Record<ThemeId, string> = {
    jovenes: t("themeJovenes"),
    matrimonios: t("themeMatrimonios"),
    amistad: t("themeAmistad"),
    oracion: t("themeOracion"),
    amor: t("moodAmor"),
    fe: t("themeFe"),
    esperanza: t("moodEsperanza"),
    paz: t("moodPaz"),
    fortaleza: t("moodFortaleza"),
    consuelo: t("moodConsuelo"),
    gratitud: t("themeGratitud"),
    sabiduria: t("themeSabiduria"),
    familia: t("themeFamilia"),
    perdon: t("themePerdon"),
    evangelio: t("themeEvangelio"),
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rise-in">
        <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
          {dateLabel}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-foreground">
          {mood ? t("wordForYou") : t("todayVerse")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("sendHow")}</p>
      </header>
      <div className="rise-in rise-in-2">
        <VerseCard
          verse={verse}
          variant="hero"
          onSend={(shown) =>
            onSend(
              shown,
              reflection && shown.id === reflection.verseId ? { note: reflection.text } : undefined,
            )
          }
        />
      </div>
      {reflection && verse.id === reflection.verseId ? (
        <section className="rise-in rise-in-2 rounded-xl border border-border bg-card px-4 py-4 shadow-paper">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t("dailyWord")}
          </p>
          <p className="mt-2 font-serif text-lg leading-relaxed">{reflection.text}</p>
        </section>
      ) : reflecting && !mood && verse.id === daily.id ? (
        <div className="h-24 animate-pulse rounded-xl bg-card" aria-hidden />
      ) : null}
      {asked ? null : (
        <section className="rise-in rounded-xl border border-border bg-card p-4 shadow-paper">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t("contactTitle")}
          </p>
          <h2 className="mt-2 font-serif text-2xl tracking-tight">{t("contactCardTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("contactCardLine")}</p>
          {showContact ? (
            <div className="mt-4">
              <ContactForm compact />
            </div>
          ) : (
            <Button
              type="button"
              className="mt-4 h-12 w-full"
              onClick={() => setShowContact(true)}
            >
              {t("contactCardCta")}
            </Button>
          )}
        </section>
      )}
      <div className="rise-in rise-in-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">{t("whatNeed")}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={bumpOffset}
            className="text-muted-foreground"
          >
            <RefreshCw />
            {t("another")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((id) => {
            const active = mood === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onMoodChange(active ? null : id)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary",
                )}
              >
                {moodLabel[id]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
