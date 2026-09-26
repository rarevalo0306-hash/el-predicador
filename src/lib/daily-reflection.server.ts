import type { Sql } from "./db.ts";
import { endsComplete, type VerseInput } from "./ai/daily.server.ts";
import type { DailyReflection } from "./daily-reflection.ts";

type Locale = "es" | "en";

export type ReflectionDeps = {
  /** Whether DeepSeek is set up; without it only a kept reflection is shown. */
  configured: boolean;
  /** The verse's own words to write about; "" text when they cannot be had. */
  verseText: () => Promise<{ ref: string; text: string }>;
  /** One request to DeepSeek; null when the answer misses the brief. */
  write: (input: VerseInput) => Promise<string | null>;
  now?: () => number;
};

/** Retry a day that could not be written only after a few minutes, not on every visit. */
const COOLDOWN_MS = 3 * 60_000;
const cooldown = new Map<string, number>();

/** For tests: forget every day put on hold. */
export function clearCooldown() {
  cooldown.clear();
}

/**
 * When today's reflection cannot be written: one of the verse's prepared
 * lines (written and kept from Admin → Frases) that ends on a whole
 * sentence, else nothing. Shown, never stored, so a later visit can still
 * write the real one.
 */
export async function fallbackFor(
  sql: Sql,
  verseId: string,
  locale: Locale,
): Promise<DailyReflection | null> {
  const lines = await sql<{ text: string }>`
    select text from verse_notes where verse_id = ${verseId} and locale = ${locale}
    order by position`;
  const line = lines.map((row) => row.text).find(endsComplete);
  return line ? { verseId, text: line, fallback: true } : null;
}

/**
 * The word of the day for one day and language: the kept one when it is
 * whole, else a new one from DeepSeek (one try and one retry), kept for
 * everyone. Nothing cut off is ever shown or kept. Logs carry the day,
 * language and attempt, never the text.
 */
export async function reflectionFor(
  sql: Sql,
  day: string,
  locale: Locale,
  verseId: string,
  deps: ReflectionDeps,
): Promise<DailyReflection | null> {
  const now = deps.now ?? Date.now;
  const read = async () =>
    (
      await sql<{ verse_id: string; text: string }>`
        select verse_id, text from daily_reflections
        where day = ${day} and locale = ${locale}`
    )[0];

  const kept = await read();
  if (kept && endsComplete(kept.text)) return { verseId: kept.verse_id, text: kept.text };
  if (kept) {
    // Written before the app checked for whole sentences: cut off, so it is
    // replaced by a new one rather than shown half-finished.
    console.warn("[daily-reflection] stored text was incomplete", { day, locale });
    await sql`delete from daily_reflections
      where day = ${day} and locale = ${locale} and text = ${kept.text}`;
  }

  if (!deps.configured) return fallbackFor(sql, verseId, locale);
  const key = `${day}:${locale}`;
  if ((cooldown.get(key) ?? 0) > now()) return fallbackFor(sql, verseId, locale);

  const verse = await deps.verseText().catch(() => ({ ref: "", text: "" }));
  if (!verse.text.trim()) {
    cooldown.set(key, now() + COOLDOWN_MS);
    return fallbackFor(sql, verseId, locale);
  }

  let written: string | null = null;
  for (let attempt = 1; attempt <= 2 && !written; attempt += 1) {
    written = await deps
      .write({ ref: verse.ref, text: verse.text, locale })
      .catch((error: unknown) => {
        console.warn("[daily-reflection] request failed", {
          day,
          locale,
          attempt,
          code: error instanceof Error ? error.message.slice(0, 40) : "unknown",
        });
        return null;
      });
    if (written && !endsComplete(written)) written = null;
    if (!written) console.warn("[daily-reflection] no complete text", { day, locale, attempt });
  }
  if (!written) {
    cooldown.set(key, now() + COOLDOWN_MS);
    return fallbackFor(sql, verseId, locale);
  }

  await sql`insert into daily_reflections (day, locale, verse_id, text)
    values (${day}, ${locale}, ${verseId}, ${written})
    on conflict (day, locale) do nothing`;
  const saved = await read();
  return saved ? { verseId: saved.verse_id, text: saved.text } : null;
}
