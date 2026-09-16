import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isLocale } from "@/lib/i18n";
import type { CloudPayload } from "@/lib/store";

function parsePayload(raw: string | null | undefined): CloudPayload | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as CloudPayload;
    if (!value || typeof value !== "object") return null;
    return {
      favorites: Array.isArray(value.favorites) ? value.favorites : [],
      favoriteKinds:
        value.favoriteKinds && typeof value.favoriteKinds === "object"
          ? value.favoriteKinds
          : {},
      verseMemory:
        value.verseMemory && typeof value.verseMemory === "object"
          ? value.verseMemory
          : {},
      savedMessages: Array.isArray(value.savedMessages) ? value.savedMessages : [],
      displayName: typeof value.displayName === "string" ? value.displayName : "",
      notify: Boolean(value.notify),
      sent: Array.isArray(value.sent) ? value.sent : [],
      dailyOffset: Number(value.dailyOffset) || 0,
      dailyDate: typeof value.dailyDate === "string" ? value.dailyDate : "",
      readingPlace: value.readingPlace ?? null,
      bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks : [],
      locale: isLocale(value.locale) ? value.locale : undefined,
    };
  } catch {
    return null;
  }
}

export const getMyState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string }>`
      select payload from preacher_state where user_id = ${context.userId} limit 1
    `;
    return parsePayload(rows[0]?.payload);
  });

export const saveMyState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CloudPayload) => data)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const payload = JSON.stringify(data);
    await sql`
      insert into preacher_state (user_id, payload, updated_at)
      values (${context.userId}, ${payload}, now())
      on conflict (user_id)
      do update set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true as const };
  });
