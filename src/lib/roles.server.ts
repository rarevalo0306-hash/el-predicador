import type { Sql } from "./db";
import { isAdminUser } from "./admin-access.ts";

type Config = Record<string, string | undefined>;

/** What an account may do beyond an ordinary one. */
export type Access = {
  /** Listed in CONTACTS_ADMIN_USER_IDS: everything, including the AI lines. */
  owner: boolean;
  /** Named from the Admin tab: registrations, accounts, SMS, more AI. */
  manager: boolean;
};

/** Pregunta and Evangelismo questions a day, per kind of account. */
export const ASK_LIMIT = { member: 20, staff: 60 } as const;

/** Automatic SMS a manager may send each calendar month (the owner has none). */
export const MANAGER_MONTHLY_SMS = 300;

export async function managerIds(sql: Sql): Promise<string[]> {
  const rows = await sql<{ user_id: string }>`select user_id from user_roles where role = 'manager'`;
  return rows.map((row) => row.user_id);
}

export async function accessFor(
  sql: Sql,
  userId: string,
  config: Config = process.env,
): Promise<Access> {
  if (!userId) return { owner: false, manager: false };
  if (isAdminUser(userId, config)) return { owner: true, manager: false };
  const [row] = await sql<{ role: string }>`
    select role from user_roles where user_id = ${userId} and role = 'manager'`;
  return { owner: false, manager: Boolean(row) };
}

export function isStaff(access: Access) {
  return access.owner || access.manager;
}

export function askLimit(access: Access) {
  return isStaff(access) ? ASK_LIMIT.staff : ASK_LIMIT.member;
}

/**
 * The messaging settings with managers added to the accounts allowed to send
 * automatically. Everything else (sender, credentials) stays the owner's.
 */
export async function messagingConfig(sql: Sql, config: Config = process.env): Promise<Config> {
  const listed = (config.MESSAGING_ALLOWED_USER_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const managers = await managerIds(sql);
  return { ...config, MESSAGING_ALLOWED_USER_IDS: [...new Set([...listed, ...managers])].join(",") };
}

/** Whether an account's automatic sends count against the monthly cap. */
export function cappedSender(userId: string, config: Config = process.env) {
  const listed = (config.MESSAGING_ALLOWED_USER_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return !listed.includes(userId) && !isAdminUser(userId, config);
}

/** Automatic sends accepted this calendar month for one account. */
export async function sendsThisMonth(sql: Sql, userId: string, now = new Date()): Promise<number> {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const [{ count }] = await sql<{ count: number }>`
    select count(*)::int as count from message_deliveries d
    join message_schedules s on s.id = d.schedule_id
    where s.user_id = ${userId} and d.status = 'accepted' and d.created_at >= ${start}`;
  return count;
}
