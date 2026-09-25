import type { Sql } from "../db";
import type { Locale } from "../i18n.ts";
import { composeVerseMessage, fallbackNotes, pickRotating } from "./compose.ts";

export type ThemeVerse = { id: string; ref: string; text: string; source?: string | null };

/** Writes a fresh line for one send; null means "use a prepared one". */
export type NoteWriter = (input: {
  ref: string;
  text: string;
  locale: Locale;
  theme: string;
  name: string | null;
}) => Promise<string | null>;

/**
 * DeepSeek, when the app has a key: one fresh line per send, in the app's
 * voice. Without a key (and in tests) there is no writer and the prepared
 * lines are used, as before.
 */
export async function defaultNoteWriter(): Promise<NoteWriter | null> {
  const { deepseekConfigured } = await import("../ai/deepseek.server.ts");
  if (!deepseekConfigured()) return null;
  const { writeSendNote } = await import("../ai/daily.server.ts");
  return (input) => writeSendNote(input);
}

/** The verses of a theme, in a stable order. Injected so tests need no catalog. */
export type VerseSource = (themeId: string) => Promise<ThemeVerse[]>;

export const catalogVerseSource: VerseSource = async (themeId) => {
  const { versesForTheme } = await import("@/lib/verses");
  return versesForTheme(themeId as never).map((v) => ({
    id: v.id,
    ref: v.ref,
    text: v.text,
    source: v.source ?? null,
  }));
};

/**
 * The text of a verse in a language: what the owner prepared, or, failing
 * that, the catalog's own copy when it carries one. A verse with neither is
 * reported, never sent half-empty.
 */
async function verseText(sql: Sql, verse: ThemeVerse, locale: Locale) {
  const [stored] = await sql<{ ref: string; text: string; source: string | null }>`
    select ref, text, source from verse_texts where verse_id = ${verse.id} and locale = ${locale}`;
  if (stored) return stored;
  if (locale === "es" && verse.text.trim())
    return { ref: verse.ref, text: verse.text, source: verse.source ?? null };
  return null;
}

/**
 * What a theme schedule sends this time.
 *
 * The count of earlier attempts is the position in the rotation, so a
 * schedule walks its theme verse by verse and the lines change with it; a
 * message never depends on the clock or on chance.
 */
export async function resolveThemeMessage(
  sql: Sql,
  schedule: {
    id: string;
    theme_id: string;
    message_locale: Locale;
    sender_name: string | null;
    recipient_name?: string | null;
  },
  verses: VerseSource = catalogVerseSource,
  fresh: { write?: NoteWriter | null; themeName?: string } = {},
): Promise<{ message: string; verseId: string } | { error: "theme_empty" | "verse_unavailable" }> {
  const list = await verses(schedule.theme_id);
  if (!list.length) return { error: "theme_empty" };
  const [{ count }] = await sql<{ count: number }>`
    select count(*)::int as count from message_deliveries where schedule_id = ${schedule.id}`;
  // The current attempt already has its receipt row, so it is counted.
  const turn = Math.max(0, count - 1);
  const verse = pickRotating(list, turn)!;
  const text = await verseText(sql, verse, schedule.message_locale);
  if (!text) return { error: "verse_unavailable" };
  const notes = (
    await sql<{ text: string }>`
      select text from verse_notes where verse_id = ${verse.id} and locale = ${schedule.message_locale}
      order by position`
  ).map((row) => row.text);
  let note: string | null = null;
  if (fresh.write) {
    // A line written for this send; any failure falls back to a prepared one.
    note = await fresh
      .write({
        ref: text.ref,
        text: text.text,
        locale: schedule.message_locale,
        theme: fresh.themeName ?? schedule.theme_id,
        name: schedule.recipient_name ?? null,
      })
      .catch(() => null);
  }
  note ??= pickRotating(
    notes.length ? notes : fallbackNotes(schedule.message_locale),
    Math.floor(turn / list.length) + turn,
  );
  return {
    verseId: verse.id,
    message: composeVerseMessage({
      note,
      text: text.text,
      ref: text.ref,
      source: text.source,
      senderName: schedule.sender_name,
      locale: schedule.message_locale,
    }),
  };
}
