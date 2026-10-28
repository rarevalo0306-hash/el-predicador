import { bookName } from "@/lib/bible";
import { passageUrl } from "@/lib/share";
import { getDailyPick, localizedTheme, parseVerseRef, type ThemeId } from "@/lib/verses";

export function dateForDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 12);
}

/** "Isaías 9:6" in Spanish, "Isaiah 9:6" in English. */
export function localizedRef(ref: string, locale: "es" | "en") {
  if (locale === "es") return ref;
  const span = parseVerseRef(ref);
  if (!span) return ref;
  return ref.replace(
    /^(.+?)(\s+\d+:.*)$/,
    (_, _book: string, rest: string) => bookName(span.book, "en") + rest,
  );
}

/** Today's verse for a local calendar day, as reminders and the widget show it. */
export function dailyVerseForDay(day: string, locale: "es" | "en") {
  const { theme, verse } = getDailyPick(0, dateForDay(day));
  return {
    day,
    theme: theme as ThemeId,
    themeName: localizedTheme(theme, locale).name,
    ref: localizedRef(verse.ref, locale),
    url: passageUrl(verse.ref),
  };
}
