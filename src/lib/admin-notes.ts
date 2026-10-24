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
  /** Verses this step could not finish; the screen leaves them out of the next steps. */
  failedIds: string[];
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
  .validator((data: { locale: "es" | "en"; batch?: number; skip?: string[] }) => {
    if (data?.locale !== "es" && data?.locale !== "en") throw new Error("invalid");
    const skip = Array.isArray(data.skip)
      ? data.skip.filter((id): id is string => typeof id === "string").slice(0, 400)
      : [];
    return { locale: data.locale, batch: Math.min(8, Math.max(1, data.batch ?? 6)), skip };
  })
  .handler(async ({ context }): Promise<PrepareResult> => {
    await requireAdmin(context.userId);
    const { requireBibleAIPermission } = await import("./bible-policy");
    requireBibleAIPermission();
    // No provider reads or persistence are permitted by this edition.
    throw new Error("Bible AI preparation is unavailable");
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
