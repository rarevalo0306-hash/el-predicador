import { createServerFn } from "@tanstack/react-start";
import type { Locale } from "@/lib/i18n";

export type DailyReflection = { verseId: string; text: string };

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Retry a day that could not be written only after a while, not on every visit. */
const cooldown = new Map<string, number>();

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
    const read = async () =>
      (
        await sql<{ verse_id: string; text: string }>`
          select verse_id, text from daily_reflections
          where day = ${data.day} and locale = ${data.locale}`
      )[0];
    const kept = await read();
    if (kept) return { verseId: kept.verse_id, text: kept.text };

    const { deepseekConfigured } = await import("@/lib/ai/deepseek.server");
    if (!deepseekConfigured()) return null;
    const key = `${data.day}:${data.locale}`;
    if ((cooldown.get(key) ?? 0) > Date.now()) return null;

    // The verse's own words: the stored copy, else the Recovery Version,
    // kept for next time like the verse lines do.
    let text = "";
    let ref = verse.ref;
    const [stored] = await sql<{ ref: string; text: string }>`
      select ref, text from verse_texts where verse_id = ${verse.id} and locale = ${data.locale}`;
    if (stored?.text.trim()) {
      text = stored.text;
      ref = stored.ref;
    } else {
      try {
        const { hydrateVerse } = await import("@/lib/recobro");
        const full = await hydrateVerse(verse, data.locale);
        text = full.text;
        ref = full.ref;
        if (text.trim()) {
          await sql`insert into verse_texts (verse_id, locale, ref, text, source, updated_at)
            values (${verse.id}, ${data.locale}, ${full.ref}, ${full.text}, ${full.source ?? null}, now())
            on conflict (verse_id, locale) do nothing`;
        }
      } catch {
        text = "";
      }
    }
    if (!text.trim()) {
      cooldown.set(key, Date.now() + 10 * 60_000);
      return null;
    }

    const { writeReflection } = await import("@/lib/ai/daily.server");
    let written: string | null = null;
    for (let attempt = 0; attempt < 2 && !written; attempt += 1) {
      written = await writeReflection({ ref, text, locale: data.locale }).catch(() => null);
    }
    if (!written) {
      cooldown.set(key, Date.now() + 10 * 60_000);
      return null;
    }
    await sql`insert into daily_reflections (day, locale, verse_id, text)
      values (${data.day}, ${data.locale}, ${verse.id}, ${written})
      on conflict (day, locale) do nothing`;
    const saved = await read();
    return saved ? { verseId: saved.verse_id, text: saved.text } : null;
  });
