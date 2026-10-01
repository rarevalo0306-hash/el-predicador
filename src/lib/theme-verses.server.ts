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
  /** How long the words may take to arrive, all passages together. */
  textBudgetMs?: number;
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
  const limit = deps.limit ?? 12;
  const rejected: (ExpandResult["rejected"][number] & { at: number })[] = [];

  // First the checks that need nothing fetched.
  const candidates: { at: number; passage: Passage }[] = [];
  const seen = new Set<string>();
  proposals.forEach((raw, at) => {
    if (candidates.length >= limit + 6) return;
    const passage = deps.canonical(raw);
    if (!passage) {
      rejected.push({ at, ref: raw, reason: "invalid" });
      return;
    }
    if (seen.has(passage.id) || taken.some((span) => overlaps(span, passage.span))) {
      rejected.push({ at, ref: passage.ref, reason: "repeated" });
      return;
    }
    seen.add(passage.id);
    candidates.push({ at, passage });
  });

  // Then the words, a few at a time, so one step stays well inside the
  // serverless time limit; a passage still loading at the deadline is skipped.
  const deadline = Date.now() + (deps.textBudgetMs ?? 20_000);
  const textOf = (passage: Passage, locale: Locale) => {
    const left = deadline - Date.now();
    if (left <= 0) return Promise.resolve(null);
    return Promise.race([
      deps.textOf(passage, locale).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), left)),
    ]);
  };
  const texts: [VerseText | null, VerseText | null][] = [];
  for (let i = 0; i < candidates.length; i += 6) {
    const batch = candidates.slice(i, i + 6);
    texts.push(
      ...(await Promise.all(
        batch.map(({ passage }) => Promise.all([textOf(passage, "es"), textOf(passage, "en")])),
      )),
    );
  }

  const added: string[] = [];
  const accepted: Passage["span"][] = [];
  for (const [index, { at, passage }] of candidates.entries()) {
    if (added.length >= limit) break;
    if (accepted.some((span) => overlaps(span, passage.span))) {
      rejected.push({ at, ref: passage.ref, reason: "repeated" });
      continue;
    }
    const [es, en] = texts[index] ?? [null, null];
    if (!es?.text.trim()) {
      rejected.push({ at, ref: passage.ref, reason: "no_text" });
      continue;
    }
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
    accepted.push(passage.span);
    added.push(passage.ref);
  }
  return {
    added,
    rejected: rejected.sort((a, b) => a.at - b.at).map(({ ref, reason }) => ({ ref, reason })),
  };
}
