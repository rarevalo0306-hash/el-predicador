import { randomUUID } from "node:crypto";
import type { Sql } from "../db";
import {
  validateSchedule,
  nextMessageOccurrence,
  type ScheduleInput,
  type MessageSchedule,
  type MessageChannel,
} from "../message-schedule.ts";
import { messagingStatus } from "./provider.server.ts";

export type ScheduleRow = {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  message: string;
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
};
const iso = (value: string | Date | null | undefined) =>
  value ? new Date(value).toISOString() : null;
export function scheduleFromRow(row: ScheduleRow): MessageSchedule {
  return {
    id: row.id,
    recipientName: row.recipient_name,
    phone: row.phone,
    message: row.message,
    channel: row.channel,
    days: row.days,
    time: row.send_time,
    timeZone: row.time_zone,
    consent: row.consent,
    enabled: row.enabled,
    nextRunAt: iso(row.next_run_at),
    lastStatus: row.last_status ?? null,
    lastRunAt: iso(row.last_run_at),
  };
}
export async function listSchedules(userId: string, providedSql?: Sql) {
  const sql = providedSql ?? (await (await import("../db")).getSql());
  const rows =
    await sql<ScheduleRow>`select s.*, d.status as last_status, d.created_at as last_run_at
    from message_schedules s left join lateral (
      select status, created_at from message_deliveries where schedule_id = s.id order by scheduled_for desc limit 1
    ) d on true where s.user_id = ${userId} order by s.created_at desc limit 20`;
  return { schedules: rows.map(scheduleFromRow), channels: messagingStatus(userId) };
}
export async function saveSchedule(userId: string, raw: ScheduleInput, providedSql?: Sql) {
  const sql = providedSql ?? (await (await import("../db")).getSql());
  const data = validateSchedule(raw);
  if (data.id) {
    const rows =
      await sql`update message_schedules set recipient_name = ${data.recipientName}, phone = ${data.phone},
      message = ${data.message}, channel = ${data.channel}, days = ${JSON.stringify(data.days)}::jsonb,
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
  await sql`insert into message_schedules (id, user_id, recipient_name, phone, message, channel, days, send_time, time_zone, consent)
    values (${id}, ${userId}, ${data.recipientName}, ${data.phone}, ${data.message}, ${data.channel},
    ${JSON.stringify(data.days)}::jsonb, ${data.time}, ${data.timeZone}, ${data.consent})`;
  return { id };
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
  if (enabled && !ready(userId)[row.channel]) throw new Error("scheduleNotConnected");
  if (enabled && !row.consent) throw new Error("scheduleConsentRequired");
  const next = enabled ? nextMessageOccurrence(scheduleFromRow(row)) : null;
  const changed =
    await sql`update message_schedules set enabled = ${enabled}, next_run_at = ${next}, updated_at = now()
    where id = ${id} and user_id = ${userId} and updated_at = ${row.revision}::timestamptz
      and (lease_until is null or lease_until < now()) returning id`;
  if (!changed.length) throw new Error("scheduleBusy");
  return { ok: true };
}
