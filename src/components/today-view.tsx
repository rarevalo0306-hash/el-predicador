import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { ArrowRight, Bookmark, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/verse-card";
import { ContactForm } from "@/components/contact-form";
import { useI18n } from "@/components/language-switch";
import { prefetchVerses } from "@/lib/recobro";
import { useAppStore, type SendDraft } from "@/lib/store";
import { getDailyReflection, type DailyReflection } from "@/lib/daily-reflection";
import { getDailyBlessing } from "@/lib/daily-blessing";
import { fallbackBlessing, greetingName, type DailyBlessing } from "@/lib/blessings";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { TextSkeleton } from "@/components/text-skeleton";
import { createRemembered } from "@/lib/remembered";
import {
  catalogSpan,
  DAILY_THEMES,
  getDailyVerse,
  todayKey,
  versesForTheme,
  type ThemeId,
  type Verse,
} from "@/lib/verses";
import { bookById, BOOK_EN } from "@/lib/bible";
import type { VerseLink } from "@/lib/verse-links";
import { cn } from "@/lib/utils";

// A day without its word yet is asked for again after a few minutes.
const reflections = createRemembered<DailyReflection | null>({
  keepEmptyMs: 5 * 60 * 1000,
  isEmpty: (value) => value === null || Boolean(value.fallback),
});

// Today's blessing for the greeting; a prepared one is asked for again later.
const blessings = createRemembered<DailyBlessing | null>({
  keepEmptyMs: 5 * 60 * 1000,
  isEmpty: (value) => value === null || Boolean(value.fallback),
});

/** The themes of the verse of the day, always on screen; the rest behind "Más temas". */
const MOODS: ThemeId[] = DAILY_THEMES;
const MORE_MOODS: ThemeId[] = [
  "familia",
  "matrimonios",
  "jovenes",
  "amistad",
  "gratitud",
  "sabiduria",
  "evangelio",
];

type TodayViewProps = {
  mood: ThemeId | null;
  onMoodChange: (mood: ThemeId | null) => void;
  onRead: (link: VerseLink) => void;
  onExplore: (theme?: ThemeId) => void;
  onSend: (verse: Verse, draft?: SendDraft) => void;
};

export function TodayView({ mood, onMoodChange, onSend, onRead, onExplore }: TodayViewProps) {
  const { locale, t } = useI18n();
  const readingPlace = useAppStore((s) => s.readingPlace);
  const [showVerse, setShowVerse] = useState(false);
  const dailyOffset = useAppStore((s) => s.dailyOffset);
  // Re-read the themes when the verses DeepSeek added arrive.
  useAppStore((s) => s.themeExtrasVersion);
  const bumpOffset = useAppStore((s) => s.bumpOffset);
  const [showContact, setShowContact] = useState(false);
  const [asked, setAsked] = useState(true);
  const [reflection, setReflection] = useState<DailyReflection | null>(
    () => reflections.peek(`${todayKey()}:${locale}`) ?? null,
  );
  const [reflecting, setReflecting] = useState(false);
  const { user } = useCurrentUserState();
  const displayName = useAppStore((s) => s.displayName);
  // Only people who signed in are greeted, by their first name.
  const name = user ? greetingName(user.displayName) || greetingName(displayName) : "";
  const [blessing, setBlessing] = useState<DailyBlessing | null>(null);
  const [moreMoods, setMoreMoods] = useState(false);
  const showAllMoods = moreMoods || (mood !== null && MORE_MOODS.includes(mood));

  // Today's blessing, written once for everyone; the name never leaves the device.
  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    const day = todayKey();
    const key = `${day}:${locale}`;
    const known = blessings.peek(key);
    if (known) {
      setBlessing(known);
      return;
    }
    setBlessing(null);
    blessings
      .load(key, () => getDailyBlessing({ data: { day, locale } }))
      .then((result) => {
        if (!cancelled) setBlessing(result ?? fallbackBlessing(day, locale));
      })
      .catch(() => {
        if (!cancelled) setBlessing(fallbackBlessing(day, locale));
      });
    return () => {
      cancelled = true;
    };
  }, [locale, name]);

  // The word of the day, written once for everyone; nothing shows if it is not there.
  // Kept for the rest of the visit, so coming back to Hoy does not ask again.
  useEffect(() => {
    let cancelled = false;
    const day = todayKey();
    const key = `${day}:${locale}`;
    const known = reflections.peek(key);
    if (known !== undefined) {
      setReflection(known);
      setReflecting(false);
      return;
    }
    setReflection(null);
    setReflecting(true);
    reflections
      .load(key, () => getDailyReflection({ data: { day, locale } }))
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
    mood && moodVerses.length > 0 ? moodVerses[dailyOffset % moodVerses.length]! : daily;

  useEffect(() => {
    prefetchVerses(mood ? versesForTheme(mood) : [getDailyVerse(dailyOffset)], locale);
  }, [dailyOffset, locale, mood]);
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
    bendicion: t("themeBendicion"),
  };

  const span = catalogSpan(verse);
  const readingBook = readingPlace ? bookById(readingPlace.bookId) : null;
  const chapterLabel = span
    ? `${locale === "en" ? (BOOK_EN[span.book.id]?.name ?? span.book.name) : span.book.name} ${span.chapter}`
    : verse.ref;

  return (
    <div className="today-screen flex flex-col gap-7">
      <header>
        <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {dateLabel}
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,7.5vw,2.4rem)] font-bold leading-[1.08] tracking-[-0.035em]">
          {locale === "en" ? "A moment for you." : "Un momento para ti."}
        </h1>
      </header>
      <section
        className="daily-landscape"
        aria-label={locale === "en" ? "Daily reading" : "Lectura del día"}
      >
        <img src="/images/coast.jpg" alt="" fetchPriority="high" width="1086" height="1448" />
        <div className="daily-landscape-content">
          <p className="text-xs font-medium tracking-[0.12em] uppercase">
            {mood ? moodLabel[mood] : locale === "en" ? "Daily reading" : "Lectura del día"}
          </p>
          <h2 className="mt-1 text-4xl font-bold tracking-[-0.03em]">{chapterLabel}</h2>
          <p className="mt-1 text-sm">LBLA · {locale === "en" ? "Spanish" : "Español"}</p>
          <button
            type="button"
            className="reading-cta mt-4"
            disabled={!span}
            onClick={() =>
              span &&
              onRead({ bookId: span.book.id, chapter: span.chapter, from: span.from, to: span.to })
            }
          >
            <span>{locale === "en" ? "Open reading" : "Abrir lectura"}</span>
            <ArrowRight aria-hidden className="size-5" />
          </button>
        </div>
      </section>
      {readingPlace && readingBook ? (
        <section>
          <h2 className="section-title">
            {locale === "en" ? "Pick up where you left off" : "Sigue donde lo dejaste"}
          </h2>
          <button
            type="button"
            className="continue-reading"
            onClick={() =>
              onRead({
                bookId: readingPlace.bookId,
                chapter: readingPlace.chapter,
                from: readingPlace.verse ?? 1,
                to: readingPlace.verse ?? 1,
              })
            }
          >
            <Bookmark aria-hidden className="size-6 shrink-0" />
            <span className="flex-1 text-left">
              <strong className="block text-lg">
                {locale === "en"
                  ? (BOOK_EN[readingBook.id]?.name ?? readingBook.name)
                  : readingBook.name}{" "}
                {readingPlace.chapter}
              </strong>
              <span className="text-sm text-muted-foreground">
                {locale === "en" ? "Continue reading" : "Continuar lectura"}
              </span>
            </span>
            <span className="rounded-full bg-primary p-2 text-primary-foreground">
              <ChevronRight aria-hidden className="size-5" />
            </span>
          </button>
        </section>
      ) : null}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title mb-0">
            {locale === "en" ? "Find a word" : "Encuentra una palabra"}
          </h2>
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
            onClick={() => onExplore()}
          >
            {locale === "en" ? "All themes" : "Ver temas"}
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["paz", "peace"],
              ["fortaleza", "strength"],
            ] as const
          ).map(([id, photo]) => (
            <button key={id} type="button" className="theme-photo" onClick={() => onExplore(id)}>
              <img src={`/images/${photo}.jpg`} alt="" loading="lazy" width="1536" height="1024" />
              <span>{id === "fortaleza" && locale === "es" ? "Fortaleza" : moodLabel[id]}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <button
          type="button"
          className="min-h-11 text-sm font-semibold text-primary underline underline-offset-4"
          aria-expanded={showVerse}
          onClick={() => setShowVerse(!showVerse)}
        >
          {locale === "en"
            ? "Today's verse · save and share"
            : "Versículo de hoy · guardar y compartir"}
        </button>
        {showVerse ? (
          <VerseCard
            verse={verse}
            variant="hero"
            onSend={(shown) =>
              onSend(
                shown,
                reflection && shown.id === reflection.verseId
                  ? { note: reflection.text }
                  : undefined,
              )
            }
          />
        ) : null}
      </section>
      {name ? (
        <section>
          <p className="font-semibold">{t("greetHello", { name })}</p>
          {blessing ? (
            <p className="mt-1 text-sm text-muted-foreground">{blessing.text}</p>
          ) : (
            <TextSkeleton label={t("wait")} lines={1} />
          )}
        </section>
      ) : null}
      {reflection && verse.id === reflection.verseId ? (
        <section className="rise-in rise-in-2 rounded-xl border border-border bg-card px-4 py-4 shadow-paper">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t("dailyWord")}
          </p>
          <p className="mt-2 text-lg leading-relaxed">{reflection.text}</p>
        </section>
      ) : reflecting && !mood && verse.id === daily.id ? (
        <div className="h-24 animate-pulse rounded-xl bg-card" aria-hidden />
      ) : null}
      {asked ? null : (
        <section className="rise-in rounded-xl border border-border bg-card p-4 shadow-paper">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t("contactTitle")}
          </p>
          <h2 className="mt-2 text-2xl tracking-tight">{t("contactCardTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("contactCardLine")}</p>
          {showContact ? (
            <div className="mt-4">
              <ContactForm compact />
            </div>
          ) : (
            <Button
              type="button"
              className="mt-4 h-auto min-h-12 py-2 whitespace-normal w-full"
              onClick={() => setShowContact(true)}
            >
              {t("contactCardCta")}
            </Button>
          )}
        </section>
      )}
      <div className="rise-in rise-in-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p id="mood-label" className="text-sm font-medium text-foreground">
            {t("whatNeed")}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={bumpOffset}
            className="ml-auto text-muted-foreground"
          >
            <RefreshCw />
            {t("another")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="mood-label">
          {(showAllMoods ? [...MOODS, ...MORE_MOODS] : MOODS).map((id) => {
            const active = mood === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onMoodChange(active ? null : id)}
                aria-pressed={active}
                className={cn(
                  "h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary",
                )}
              >
                {moodLabel[id]}
              </button>
            );
          })}
          {/* Hidden while a theme from the extra ones is chosen, so it never hides it. */}
          {mood && MORE_MOODS.includes(mood) ? null : (
            <button
              type="button"
              onClick={() => setMoreMoods((open) => !open)}
              aria-expanded={moreMoods}
              className="h-11 rounded-full px-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {moreMoods ? t("moodLess") : t("moodMore", { n: MORE_MOODS.length })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
