import { createServerFn } from "@tanstack/react-start";
import type { Locale } from "@/lib/i18n";

export type DailyReflection = {
  verseId: string;
  text: string;
  /** A prepared, approved line shown because today's could not be written. */
  fallback?: boolean;
};

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The word of the day: a short reflection on the verse of the day, written
 * by DeepSeek the first time anyone asks for that day and language, then
 * read from the database by everyone. Only today's verse (by the visitor's
 * own date, within a day of the server's) can be asked for, so nobody can
 * make the app write about anything else.
 */
export const getDailyReflection = createServerFn({ method: "POST" })
  .validator((data: { day: string; locale?: Locale }) => ({
    day: String(data.day ?? ""),
    locale: (data.locale === "en" ? "en" : "es") as "es" | "en",
  }))
  .handler(async ({ data }): Promise<DailyReflection | null> => {
    const match = DAY.exec(data.day);
    if (!match) return null;
    const noon = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
    if (Math.abs(noon.getTime() - Date.now()) > 36 * 60 * 60 * 1000) return null;

    const { getDailyVerse } = await import("@/lib/verses");
    const verse = getDailyVerse(0, noon);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { deepseekConfigured } = await import("@/lib/ai/deepseek.server");
    const { writeReflection } = await import("@/lib/ai/daily.server");
    const { reflectionFor } = await import("@/lib/daily-reflection.server");

    return reflectionFor(sql, data.day, data.locale, verse.id, {
      configured: deepseekConfigured(),
      write: (input) => writeReflection(input),
      // The verse's own words: the stored copy, else the Recovery Version,
      // kept for next time like the verse lines do.
      verseText: async () => {
        const [stored] = await sql<{ ref: string; text: string }>`
          select ref, text from verse_texts where verse_id = ${verse.id} and locale = ${data.locale}`;
        if (stored?.text.trim()) return stored;
        const { hydrateVerse } = await import("@/lib/recobro");
        const full = await hydrateVerse(verse, data.locale);
        if (full.text.trim()) {
          await sql`insert into verse_texts (verse_id, locale, ref, text, source, updated_at)
            values (${verse.id}, ${data.locale}, ${full.ref}, ${full.text}, ${full.source ?? null}, now())
            on conflict (verse_id, locale) do nothing`;
        }
        return { ref: full.ref, text: full.text };
      },
    });
  });
