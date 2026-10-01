import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { ThemeExtra, ThemeId } from "@/lib/verses";

export type ThemeExtrasStatus = {
  configured: boolean;
  themes: { id: ThemeId; own: number; extras: { id: string; ref: string }[] }[];
};

async function requireAdmin(userId: string) {
  const { isAdminUser } = await import("./admin-access.ts");
  if (!isAdminUser(userId, process.env)) throw new Error("forbidden");
}

async function isTheme(id: unknown): Promise<ThemeId | null> {
  const { THEMES } = await import("@/lib/verses");
  return THEMES.some((theme) => theme.id === id) ? (id as ThemeId) : null;
}

/**
 * The verses DeepSeek added to the themes, for everyone: read once per
 * visit and merged after each theme's own. An app without the table yet
 * (before its migration runs) simply has none.
 */
export const getThemeExtras = createServerFn({ method: "GET" }).handler(
  async (): Promise<ThemeExtra[]> => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql<{ theme_id: ThemeId; verse_id: string; ref: string }>`
        select theme_id, verse_id, ref from theme_verses order by created_at, verse_id`;
      return rows.map((row) => ({ themeId: row.theme_id, id: row.verse_id, ref: row.ref }));
    } catch {
      return [];
    }
  },
);

export const getThemeExtrasStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ThemeExtrasStatus> => {
    await requireAdmin(context.userId);
    const { THEMES, catalogVersesForTheme } = await import("@/lib/verses");
    const { deepseekConfigured } = await import("@/lib/ai/deepseek.server");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ theme_id: string; verse_id: string; ref: string }>`
      select theme_id, verse_id, ref from theme_verses order by created_at, verse_id`;
    return {
      configured: deepseekConfigured(),
      themes: THEMES.map((theme) => ({
        id: theme.id,
        own: catalogVersesForTheme(theme.id).length,
        extras: rows
          .filter((row) => row.theme_id === theme.id)
          .map((row) => ({ id: row.verse_id, ref: row.ref })),
      })),
    };
  });

/**
 * One step for the owner's screen: DeepSeek proposes passages for a theme
 * and the ones that check out are published at once. The screen calls this
 * theme by theme, so no single request outlives a serverless timeout.
 */
export const expandThemeVerses = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { themeId: string }) => ({ themeId: String(data?.themeId ?? "") }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const themeId = await isTheme(data.themeId);
    if (!themeId) throw new Error("invalid");
    const { canonicalPassage, catalogVersesForTheme, themeById } = await import("@/lib/verses");
    const { proposeThemeRefs } = await import("@/lib/ai/daily.server");
    const { hydrateVerse } = await import("@/lib/recobro");
    const { expandTheme } = await import("@/lib/theme-verses.server");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const theme = themeById(themeId);
    return expandTheme(sql, themeId, {
      propose: (existing) =>
        proposeThemeRefs({ theme: theme.name, line: theme.line, existing, count: 15 }),
      canonical: (ref) => {
        const passage = canonicalPassage(ref);
        return passage
          ? {
              id: passage.id,
              ref: passage.ref,
              span: {
                bookId: passage.span.book.id,
                chapter: passage.span.chapter,
                from: passage.span.from,
                to: passage.span.to,
              },
            }
          : null;
      },
      catalog: catalogVersesForTheme(themeId),
      textOf: async (passage, locale) => {
        const verse = await hydrateVerse(
          { id: passage.id, ref: passage.ref, book: "", text: "", themes: [themeId] },
          locale,
        );
        return { ref: verse.ref, text: verse.text, source: verse.source ?? null };
      },
    });
  });

/** Takes one added verse out of a theme; its kept text stays for sends already made. */
export const removeThemeVerse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { themeId: string; verseId: string }) => ({
    themeId: String(data?.themeId ?? ""),
    verseId: String(data?.verseId ?? "").slice(0, 80),
  }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from theme_verses where theme_id = ${data.themeId} and verse_id = ${data.verseId}`;
    return { ok: true };
  });
