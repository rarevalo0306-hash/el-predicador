import type { Sql } from "./db.ts";
import { endsComplete } from "./ai/daily.server.ts";
import { fallbackBlessing, type DailyBlessing } from "./blessings.ts";

type Locale = "es" | "en";

export type BlessingDeps = {
  /** Whether DeepSeek is set up; without it the prepared blessing is shown. */
  configured: boolean;
  /** One request to DeepSeek; null when the answer misses the brief. */
  write: () => Promise<string | null>;
  now?: () => number;
};

/** Retry a day that could not be written only after a few minutes, not on every visit. */
const COOLDOWN_MS = 3 * 60_000;
const cooldown = new Map<string, number>();

/** For tests: forget every day put on hold. */
export function clearBlessingCooldown() {
  cooldown.clear();
}

/**
 * Today's blessing for one language: the kept one, else a new one from
 * DeepSeek (one try and one retry), kept for everyone; when that cannot be
 * had, the prepared blessing for the day, shown but never stored. Logs carry
 * the day, language and attempt, never the text.
 */
export async function blessingFor(
  sql: Sql,
  day: string,
  locale: Locale,
  deps: BlessingDeps,
): Promise<DailyBlessing> {
  const now = deps.now ?? Date.now;
  const read = async () =>
    (
      await sql<{ text: string }>`
        select text from daily_blessings where day = ${day} and locale = ${locale}`
    )[0];

  const kept = await read();
  if (kept && endsComplete(kept.text)) return { text: kept.text };

  const key = `${day}:${locale}`;
  if (!deps.configured || (cooldown.get(key) ?? 0) > now()) return fallbackBlessing(day, locale);

  let written: string | null = null;
  for (let attempt = 1; attempt <= 2 && !written; attempt += 1) {
    written = await deps.write().catch((error: unknown) => {
      console.warn("[daily-blessing] request failed", {
        day,
        locale,
        attempt,
        code: error instanceof Error ? error.message.slice(0, 40) : "unknown",
      });
      return null;
    });
    if (written && !endsComplete(written)) written = null;
  }
  if (!written) {
    cooldown.set(key, now() + COOLDOWN_MS);
    return fallbackBlessing(day, locale);
  }

  await sql`insert into daily_blessings (day, locale, text)
    values (${day}, ${locale}, ${written})
    on conflict (day, locale) do nothing`;
  const saved = await read();
  return { text: saved?.text ?? written };
}
