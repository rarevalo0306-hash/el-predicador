import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type NotesStatus = {
  configured: boolean;
  total: number;
  prepared: Record<"es" | "en", number>;
};

export type PrepareResult = {
  processed: number;
  remaining: number;
  /** A few of the lines just written, so the owner can see the tone. */
  sample: { ref: string; notes: string[] }[];
  errors: string[];
};

async function requireAdmin(userId: string) {
  const { isAdminUser } = await import("./admin-access.ts");
  if (!isAdminUser(userId, process.env)) throw new Error("forbidden");
}

/** Catalog verses only: the composed ones (gospel path, cases) are not verses. */
async function catalogVerses() {
  const { VERSES, isComposedVerse } = await import("@/lib/verses");
  return VERSES.filter((v) => !isComposedVerse(v.id));
}

export const getVerseNotesStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<NotesStatus> => {
    await requireAdmin(context.userId);
    const { deepseekConfigured } = await import("./ai/deepseek.server.ts");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const verses = await catalogVerses();
    const rows = await sql<{ locale: "es" | "en"; count: number }>`
      select locale, count(distinct verse_id)::int as count from verse_notes group by locale`;
    const prepared = { es: 0, en: 0 };
    for (const row of rows) prepared[row.locale] = row.count;
    return { configured: deepseekConfigured(), total: verses.length, prepared };
  });

/**
 * One step of the preparation: a handful of verses without lines in a
 * language get their text stored and their lines written. The owner's
 * screen calls this until nothing remains, so a slow call never times out.
 */
export const prepareVerseNotes = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { locale: "es" | "en"; batch?: number }) => {
    if (data?.locale !== "es" && data?.locale !== "en") throw new Error("invalid");
    return { locale: data.locale, batch: Math.min(8, Math.max(1, data.batch ?? 6)) };
  })
  .handler(async ({ data, context }): Promise<PrepareResult> => {
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const { hydrateVerse } = await import("@/lib/recobro");
    const { generateVerseNotes } = await import("./ai/deepseek.server.ts");
    const sql = await getSql();
    const verses = await catalogVerses();
    const done = new Set(
      (
        await sql<{ verse_id: string }>`
          select distinct verse_id from verse_notes where locale = ${data.locale}`
      ).map((r) => r.verse_id),
    );
    const pending = verses.filter((v) => !done.has(v.id));
    const batch = pending.slice(0, data.batch);
    const errors: string[] = [];
    const ready: { id: string; ref: string; text: string }[] = [];
    // Texts stored on an earlier pass are reused, so writing the lines again
    // never waits on the Bible service.
    const stored = new Map(
      (
        await sql<{ verse_id: string; ref: string; text: string }>`
          select verse_id, ref, text from verse_texts
          where locale = ${data.locale} and verse_id = any(${batch.map((v) => v.id)})`
      ).map((row) => [row.verse_id, row]),
    );
    for (const verse of batch) {
      const kept = stored.get(verse.id);
      if (kept?.text.trim()) {
        ready.push({ id: verse.id, ref: kept.ref, text: kept.text });
        continue;
      }
      try {
        const full = await hydrateVerse(verse, data.locale);
        if (!full.text.trim()) throw new Error("empty");
        await sql`insert into verse_texts (verse_id, locale, ref, text, source, updated_at)
          values (${verse.id}, ${data.locale}, ${full.ref}, ${full.text}, ${full.source ?? null}, now())
          on conflict (verse_id, locale) do update set ref = excluded.ref, text = excluded.text,
            source = excluded.source, updated_at = now()`;
        ready.push({ id: verse.id, ref: full.ref, text: full.text });
      } catch {
        errors.push(`${verse.ref}: texto no disponible`);
      }
    }
    const sample: PrepareResult["sample"] = [];
    if (ready.length) {
      const notes = await generateVerseNotes(ready, data.locale);
      for (const verse of ready) {
        const lines = notes[verse.id] ?? [];
        if (!lines.length) {
          errors.push(`${verse.ref}: sin frases`);
          continue;
        }
        for (const [position, text] of lines.entries()) {
          await sql`insert into verse_notes (verse_id, locale, position, text)
            values (${verse.id}, ${data.locale}, ${position}, ${text})
            on conflict (verse_id, locale, position) do update set text = excluded.text`;
        }
        if (sample.length < 2) sample.push({ ref: verse.ref, notes: lines });
      }
    }
    const nowDone = new Set([
      ...done,
      ...ready.filter((v) => !errors.some((e) => e.startsWith(v.ref + ":"))).map((v) => v.id),
    ]);
    return {
      processed: batch.length,
      // Verses that failed are not retried in this pass; they are reported.
      remaining: verses.filter((v) => !nowDone.has(v.id) && !batch.includes(v)).length,
      sample,
      errors,
    };
  });

/**
 * Drops the lines of one language so the owner can write them again with
 * the current voice. The verse texts stay; only the lines go. Until the
 * next preparation, theme sends use the four lines the app ships.
 */
export const resetVerseNotes = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { locale: "es" | "en" }) => {
    if (data?.locale !== "es" && data?.locale !== "en") throw new Error("invalid");
    return { locale: data.locale };
  })
  .handler(async ({ data, context }): Promise<{ removed: number }> => {
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      delete from verse_notes where locale = ${data.locale} returning id`;
    return { removed: rows.length };
  });
