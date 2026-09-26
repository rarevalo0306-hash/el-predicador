import { createHash } from "node:crypto";
import type { Sql } from "./db.ts";

/** Per sender address: a family sharing a connection still fits. */
export const PER_ADDRESS_PER_HOUR = 5;
/** Per email: enough to fix a typo, not to overwrite or spam. */
export const PER_EMAIL_PER_DAY = 3;

/**
 * A salted hash, so the table never holds an address or an email and the
 * values cannot be reversed by trying every IP.
 */
export function throttleKey(kind: "ip" | "email", value: string, salt: string): string {
  return `${kind}:${createHash("sha256").update(`${salt}|${kind}|${value}`).digest("hex").slice(0, 32)}`;
}

/**
 * Whether one more form may be taken from this address and email. Counts
 * the attempt when it is allowed, and clears entries older than a day.
 */
export async function allowFormSubmission(
  sql: Sql,
  input: { ip: string; email: string; salt: string; now?: Date },
): Promise<boolean> {
  const now = input.now ?? new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const ipKey = throttleKey("ip", input.ip || "unknown", input.salt);
  const emailKey = throttleKey("email", input.email, input.salt);
  await sql`delete from form_throttle where at < ${dayAgo}`;
  const [counts] = await sql<{ ip: number; email: number }>`
    select
      (select count(*)::int from form_throttle where key = ${ipKey} and at >= ${hourAgo}) as ip,
      (select count(*)::int from form_throttle where key = ${emailKey} and at >= ${dayAgo}) as email`;
  if ((counts?.ip ?? 0) >= PER_ADDRESS_PER_HOUR || (counts?.email ?? 0) >= PER_EMAIL_PER_DAY) {
    return false;
  }
  const stamp = now.toISOString();
  await sql`insert into form_throttle (key, at) values (${ipKey}, ${stamp}), (${emailKey}, ${stamp})`;
  return true;
}
