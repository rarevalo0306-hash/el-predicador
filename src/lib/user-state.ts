import { restorePhone } from "@/lib/phone";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isLocale } from "@/lib/i18n";
import { isThemeId, normalizeChurch } from "@/lib/church";
import type { CloudPayload, Recipient } from "@/lib/store";

function parseRecipient(row: unknown): Recipient | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;
  const phone = restorePhone(String(value.phone ?? ""));
  if (phone.length < 7) return null;
  const dailyHour = Number(value.dailyHour);
  return {
    id: value.id,
    name: value.name,
    phone,
    at: Number(value.at) || Date.now(),
    themeId: isThemeId(value.themeId) ? value.themeId : undefined,
    messageLocale: isLocale(value.messageLocale) ? value.messageLocale : undefined,
    notes: typeof value.notes === "string" ? value.notes : undefined,
    dailyEnabled: Boolean(value.dailyEnabled),
    dailyHour: Number.isFinite(dailyHour)
      ? Math.min(23, Math.max(0, Math.round(dailyHour)))
      : 9,
    lastDailySentDate:
      typeof value.lastDailySentDate === "string"
        ? value.lastDailySentDate
        : undefined,
    cultoEnabled: Boolean(value.cultoEnabled),
    lastCultoSentDate:
      typeof value.lastCultoSentDate === "string"
        ? value.lastCultoSentDate
        : undefined,
  };
}

function parsePayload(raw: string | null | undefined): CloudPayload | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as CloudPayload;
    if (!value || typeof value !== "object") return null;
    const recipients = Array.isArray(value.recipients)
      ? value.recipients
          .map(parseRecipient)
          .filter((row): row is Recipient => Boolean(row))
      : [];
    const hour = Number(value.notifyHour);
    const scaleRaw = Number(value.fontScale);
    const fontScale =
      scaleRaw === 0 || scaleRaw === 1 || scaleRaw === 2 || scaleRaw === 3
        ? scaleRaw
        : 1;
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
      notifyHour: Number.isFinite(hour) ? Math.min(23, Math.max(0, Math.round(hour))) : 8,
      recipients,
      church: normalizeChurch(value.church),
      sent: Array.isArray(value.sent) ? value.sent : [],
      dailyOffset: Number(value.dailyOffset) || 0,
      dailyDate: typeof value.dailyDate === "string" ? value.dailyDate : "",
      readingPlace: value.readingPlace ?? null,
      bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks : [],
      highlights: Array.isArray(value.highlights)
        ? value.highlights.filter((id): id is string => typeof id === "string")
        : [],
      fontScale,
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

const MAX_CLOUD_BYTES = 200_000;

export const saveMyState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CloudPayload) => {
    if (!data || typeof data !== "object") {
      throw new Error("invalid payload");
    }
    const payload = JSON.stringify(data);
    if (payload.length > MAX_CLOUD_BYTES) {
      throw new Error("payload too large");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const normalized = parsePayload(JSON.stringify(data)) ?? data;
    const payload = JSON.stringify(normalized);
    if (payload.length > MAX_CLOUD_BYTES) {
      throw new Error("payload too large");
    }
    await sql`
      insert into preacher_state (user_id, payload, updated_at)
      values (${context.userId}, ${payload}, now())
      on conflict (user_id)
      do update set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true as const };
  });
