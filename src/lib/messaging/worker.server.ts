import { randomUUID, timingSafeEqual } from "node:crypto";
import type { Sql } from "../db";
import { nextMessageOccurrence } from "../message-schedule.ts";
import { deliverMessage, messagingStatus, type DeliveryOutcome } from "./provider.server.ts";
import type { ScheduleRow } from "./schedules.server";

export function validCronAuthorization(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Leases plus the unique occurrence receipt prevent duplicate sends on overlapping cron runs. */
export async function runScheduledMessages(
  sql: Sql,
  now = new Date(),
  send = deliverMessage,
  ready = messagingStatus,
) {
  const token = randomUUID();
  const rows = await sql<ScheduleRow>`with due as (
    select id from message_schedules where enabled and next_run_at <= ${now.toISOString()}
      and (lease_until is null or lease_until < ${now.toISOString()})
    order by next_run_at limit 10 for update skip locked
  ) update message_schedules s set lease_token = ${token}, lease_until = ${new Date(now.getTime() + 180_000).toISOString()}
    from due where s.id = due.id returning s.*`;
  const results: string[] = [];
  for (const row of rows) {
    const scheduledFor = new Date(row.next_run_at!).toISOString();
    const deliveryId = randomUUID();
    const reserved =
      await sql`insert into message_deliveries (id, schedule_id, scheduled_for, status)
      select ${deliveryId}, id, ${scheduledFor}, 'sending' from message_schedules
      where id = ${row.id} and lease_token = ${token} and enabled
      on conflict (schedule_id, scheduled_for) do nothing returning id`;
    if (!reserved.length) {
      await sql`update message_deliveries set status = 'unknown', error_code = 'interrupted_request'
        where schedule_id = ${row.id} and scheduled_for = ${scheduledFor} and status = 'sending'`;
    }
    const configured = ready(row.user_id)[row.channel] && row.consent;
    const next = configured
      ? nextMessageOccurrence({ days: row.days, time: row.send_time, timeZone: row.time_zone }, now)
      : null;
    // Advance before the external request. A crash can leave an unknown receipt,
    // but the same occurrence is never sent again automatically.
    await sql`update message_schedules set next_run_at = ${next}, enabled = ${Boolean(next)}
      where id = ${row.id} and lease_token = ${token}`;
    if (reserved.length) {
      let result: DeliveryOutcome | { status: "skipped"; errorCode: string };
      if (!configured) result = { status: "failed", errorCode: "not_configured" };
      else if (now.getTime() - new Date(scheduledFor).getTime() > 15 * 60_000)
        result = { status: "skipped", errorCode: "missed_time" };
      else {
        try {
          result = await send({
            userId: row.user_id,
            channel: row.channel,
            phone: row.phone,
            recipientName: row.recipient_name,
            message: row.message,
          });
        } catch {
          result = { status: "unknown", errorCode: "unconfirmed_request" };
        }
      }
      await sql`update message_deliveries set status = ${result.status}, provider_id = ${"providerId" in result ? (result.providerId ?? null) : null},
        error_code = ${"errorCode" in result ? (result.errorCode ?? null) : null} where id = ${deliveryId}`;
      results.push(result.status);
    }
    await sql`update message_schedules set lease_until = null, lease_token = null where id = ${row.id} and lease_token = ${token}`;
  }
  // A terminated process may have advanced an occurrence without its receipt.
  await sql`update message_deliveries set status = 'unknown', error_code = 'interrupted_request'
    where status = 'sending' and created_at < ${new Date(now.getTime() - 180_000).toISOString()}`;
  return {
    processed: rows.length,
    accepted: results.filter((s) => s === "accepted").length,
    failed: results.filter((s) => s === "failed").length,
    unknown: results.filter((s) => s === "unknown").length,
    skipped: results.filter((s) => s === "skipped").length,
  };
}
