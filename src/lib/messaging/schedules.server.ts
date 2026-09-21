import { randomUUID } from "node:crypto";
import type { Sql } from "../db";
import {
  validateSchedule,
  nextMessageOccurrence,
  type ScheduleInput,
  type MessageSchedule,
  type MessageChannel,
} from "../message-schedule.ts";
import { messagingRequirements, messagingStatus } from "./provider.server.ts";

export type ScheduleRow = {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  message: string;
  message_locale: "es" | "en";
  verse_id: string | null;
  theme_id: string | null;
  sender_name: string | null;
  channel: MessageChannel;
  days: number[];
  send_time: string;
  time_zone: string;
  consent: boolean;
  enabled: boolean;
  next_run_at: string | Date | null;
  lease_token: string | null;
  last_status?: MessageSchedule["lastStatus"];
  last_run_at?: string | Date | null;
  last_error_code?: string | null;
  last_error_message?: string | null;
  last_provider_status?: string | null;
  last_provider_error_code?: string | null;
};
const iso = (value: string | Date | null | undefined) =>
  value ? new Date(value).toISOString() : null;
export function scheduleFromRow(row: ScheduleRow): MessageSchedule {
  return {
    id: row.id,
    recipientName: row.recipient_name,
    phone: row.phone,
    message: row.message,
    messageLocale: row.message_locale ?? "es",
    verseId: row.verse_id ?? undefined,
    themeId: (row.theme_id as MessageSchedule["themeId"]) ?? null,
    senderName: row.sender_name ?? undefined,
    channel: row.channel,
    days: row.days,
    time: row.send_time,
    timeZone: row.time_zone,
    consent: row.consent,
    enabled: row.enabled,
    nextRunAt: iso(row.next_run_at),
    lastStatus: row.last_status ?? null,
    lastRunAt: iso(row.last_run_at),
    lastErrorCode: row.last_error_code ?? null,
    lastError: row.last_error_message ?? null,
    lastProviderStatus: row.last_provider_status ?? null,
    lastProviderErrorCode: row.last_provider_error_code ?? null,
  };
}
export async function listSchedules(userId: string, providedSql?: Sql) {
  const sql = providedSql ?? (await (await import("../db")).getSql());
  const rows =
    await sql<ScheduleRow>`select s.*, d.status as last_status, d.created_at as last_run_at,
      d.error_code as last_error_code, d.error_message as last_error_message,
      d.provider_status as last_provider_status, d.provider_error_code as last_provider_error_code
    from message_schedules s left join lateral (
      select status, created_at, error_code, error_message, provider_status, provider_error_code from message_deliveries where schedule_id = s.id order by scheduled_for desc limit 1
    ) d on true where s.user_id = ${userId} order by s.created_at desc limit 20`;
  return {
    schedules: rows.map(scheduleFromRow),
    channels: messagingStatus(userId),
    channelsByLocale: { es: messagingStatus(userId), en: messagingStatus(userId, undefined, "en") },
    // Booleans only, so the panel can name what is missing instead of just
    // saying "not connected". See messagingRequirements for why it is shown.
    requirements: messagingRequirements(userId),
  };
}
export async function saveSchedule(userId: string, raw: ScheduleInput, providedSql?: Sql) {
  const sql = providedSql ?? (await (await import("../db")).getSql());
  const data = validateSchedule(raw);
  if (data.id) {
    const rows =
      await sql`update message_schedules set recipient_name = ${data.recipientName}, phone = ${data.phone},
      message = ${data.message}, message_locale = ${data.messageLocale}, verse_id = ${data.verseId ?? null},
      theme_id = ${data.themeId ?? null}, sender_name = ${data.senderName ?? null}, channel = ${data.channel}, days = ${JSON.stringify(data.days)}::jsonb,
      send_time = ${data.time}, time_zone = ${data.timeZone}, consent = ${data.consent},
      enabled = false, next_run_at = null, updated_at = now()
      where id = ${data.id} and user_id = ${userId} and (lease_until is null or lease_until < now()) returning id`;
    if (!rows.length) throw new Error("scheduleBusy");
    return { id: data.id };
  }
  const [{ count }] = await sql<{
    count: number;
  }>`select count(*)::int as count from message_schedules where user_id = ${userId}`;
  if (count >= 20) throw new Error("scheduleLimit");
  const id = randomUUID();
  await sql`insert into message_schedules (id, user_id, recipient_name, phone, message, message_locale, verse_id, theme_id, sender_name, channel, days, send_time, time_zone, consent)
    values (${id}, ${userId}, ${data.recipientName}, ${data.phone}, ${data.message}, ${data.messageLocale}, ${data.verseId ?? null}, ${data.themeId ?? null}, ${data.senderName ?? null}, ${data.channel},
    ${JSON.stringify(data.days)}::jsonb, ${data.time}, ${data.timeZone}, ${data.consent})`;
  return { id };
}
/** Deleting frees a slot against the per-account limit; deliveries cascade. */
export async function deleteSchedule(userId: string, id: string, providedSql?: Sql) {
  const sql = providedSql ?? (await (await import("../db")).getSql());
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) throw new Error("scheduleInvalid");
  const rows = await sql`delete from message_schedules
    where id = ${id} and user_id = ${userId} and (lease_until is null or lease_until < now()) returning id`;
  if (!rows.length) throw new Error("scheduleBusy");
  return { ok: true };
}
export async function setScheduleEnabled(
  userId: string,
  id: string,
  enabled: boolean,
  providedSql?: Sql,
  ready = messagingStatus,
) {
  const sql = providedSql ?? (await (await import("../db")).getSql());
  const [row] = await sql<
    ScheduleRow & { revision: string }
  >`select *, updated_at::text as revision from message_schedules where id = ${id} and user_id = ${userId}`;
  if (!row) throw new Error("scheduleBusy");
  if (enabled && !ready(userId, undefined, row.message_locale)[row.channel])
    throw new Error("scheduleNotConnected");
  if (enabled && !row.consent) throw new Error("scheduleConsentRequired");
  const next = enabled ? nextMessageOccurrence(scheduleFromRow(row)) : null;
  const changed =
    await sql`update message_schedules set enabled = ${enabled}, next_run_at = ${next}, updated_at = now()
    where id = ${id} and user_id = ${userId} and updated_at = ${row.revision}::timestamptz
      and (lease_until is null or lease_until < now()) returning id`;
  if (!changed.length) throw new Error("scheduleBusy");
  return { ok: true };
}
