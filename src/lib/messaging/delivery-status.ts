import type { Sql } from "../db";

/** The provider's message lifecycle, in the order it can only move forward. */
export const PROVIDER_STATUSES = [
  "queued",
  "accepted",
  "sending",
  "sent",
  "delivered",
  "undelivered",
  "failed",
] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

const rank = (status: ProviderStatus) => PROVIDER_STATUSES.indexOf(status);

export type StatusCallback = { sid: string; status: ProviderStatus; errorCode: string | null };

/** The fields of a status callback the app keeps; null when it is not one. */
export function parseStatusCallback(params: Record<string, string>): StatusCallback | null {
  const sid = params.MessageSid ?? params.SmsSid ?? "";
  const status = (params.MessageStatus ?? params.SmsStatus ?? "").toLowerCase();
  if (!/^[A-Za-z0-9]{1,64}$/.test(sid)) return null;
  if (!(PROVIDER_STATUSES as readonly string[]).includes(status)) return null;
  const code = (params.ErrorCode ?? "").trim();
  return {
    sid,
    status: status as ProviderStatus,
    errorCode: /^[0-9]{1,10}$/.test(code) ? code : null,
  };
}

/**
 * Record what the provider reported for a message it accepted earlier.
 *
 * Callbacks can arrive out of order ("delivered" before "sent"), so a status
 * never moves backwards. A sid the app never sent is ignored: the row is the
 * proof the send was ours.
 */
export async function recordProviderStatus(sql: Sql, callback: StatusCallback) {
  const [row] = await sql<{ id: string; provider_status: ProviderStatus | null }>`
    select id, provider_status from message_deliveries where provider_id = ${callback.sid} limit 1`;
  if (!row) return { recorded: false as const, reason: "unknown_sid" as const };
  if (row.provider_status && rank(row.provider_status) >= rank(callback.status))
    return { recorded: false as const, reason: "older" as const };
  await sql`update message_deliveries
    set provider_status = ${callback.status},
        provider_error_code = ${callback.errorCode},
        provider_status_at = now()
    where id = ${row.id} and provider_status is not distinct from ${row.provider_status}`;
  return { recorded: true as const };
}
