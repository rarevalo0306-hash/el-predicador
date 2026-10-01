import type { Sql } from "./db.ts";

type Locale = "es" | "en";

export type Passage = {
  id: string;
  ref: string;
  span: { bookId: string; chapter: number; from: number; to: number };
};

export type VerseText = { ref: string; text: string; source?: string | null };

export type ExpandDeps = {
  /** DeepSeek's proposals: references only. */
  propose: (existing: string[]) => Promise<string[]>;
  /** A reference as the app keeps it, or null when it is not a real passage of up to 3 verses. */
  canonical: (ref: string) => Passage | null;
  /** The theme's own verses, which the new ones must not repeat. */
  catalog: { ref: string }[];
  /** The passage's words in a language from the Recovery Version, or null. */
  textOf: (passage: Passage, locale: Locale) => Promise<VerseText | null>;
  /** At most this many are added in one step. */
  limit?: number;
};

export type ExpandResult = {
  added: string[];
  rejected: { ref: string; reason: "invalid" | "repeated" | "no_text" }[];
};

const overlaps = (a: Passage["span"], b: Passage["span"]) =>
  a.bookId === b.bookId && a.chapter === b.chapter && a.from <= b.to && b.from <= a.to;

/**
 * One step of growing a theme: DeepSeek proposes passages, and only those
 * that are real places in the Bible, of one to three verses, not already in
 * the theme (or overlapping one that is), and whose words the Recovery
 * Version returns, are published. Their texts are kept so scheduled sends
 * can use them without waiting on anything.
 */
export async function expandTheme(
  sql: Sql,
  themeId: string,
  deps: ExpandDeps,
): Promise<ExpandResult> {
  const kept = await sql<{ ref: string }>`
    select ref from theme_verses where theme_id = ${themeId} order by created_at`;
  const existing = [...deps.catalog.map((v) => v.ref), ...kept.map((row) => row.ref)];
  const taken = existing
    .map((ref) => deps.canonical(ref)?.span)
    .filter((span): span is Passage["span"] => Boolean(span));

  const proposals = await deps.propose(existing);
  const result: ExpandResult = { added: [], rejected: [] };
  const limit = deps.limit ?? 12;
  for (const raw of proposals) {
    if (result.added.length >= limit) break;
    const passage = deps.canonical(raw);
    if (!passage) {
      result.rejected.push({ ref: raw, reason: "invalid" });
      continue;
    }
    if (taken.some((span) => overlaps(span, passage.span))) {
      result.rejected.push({ ref: passage.ref, reason: "repeated" });
      continue;
    }
    const es = await deps.textOf(passage, "es").catch(() => null);
    if (!es?.text.trim()) {
      result.rejected.push({ ref: passage.ref, reason: "no_text" });
      continue;
    }
    const en = await deps.textOf(passage, "en").catch(() => null);
    for (const [locale, text] of [
      ["es", es],
      ["en", en],
    ] as const) {
      if (!text?.text.trim()) continue;
      await sql`insert into verse_texts (verse_id, locale, ref, text, source, updated_at)
        values (${passage.id}, ${locale}, ${text.ref}, ${text.text}, ${text.source ?? null}, now())
        on conflict (verse_id, locale) do nothing`;
    }
    await sql`insert into theme_verses (theme_id, verse_id, ref)
      values (${themeId}, ${passage.id}, ${passage.ref})
      on conflict (theme_id, verse_id) do nothing`;
    taken.push(passage.span);
    result.added.push(passage.ref);
  }
  return result;
}
