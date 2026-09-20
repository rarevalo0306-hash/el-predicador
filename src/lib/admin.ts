import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { Contact } from "@/lib/contacts";

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  /** People they added, from their synced state. */
  people: number;
  /** Message schedules they own. */
  schedules: number;
};

export type AdminOverview = {
  registrations: Contact[];
  accounts: AdminAccount[];
};

/** Whether the signed-in account may open the administrator tab. */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { isAdminUser } = await import("./admin-access.ts");
    return { admin: isAdminUser(context.userId, process.env) };
  });

/**
 * Everything the owner needs to see who is using the app: the registrations
 * from the "receive the word" form, and the accounts people created. Account
 * rows carry counts only — never another person's contacts or messages.
 */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { isAdminUser } = await import("./admin-access.ts");
    if (!isAdminUser(context.userId, process.env)) throw new Error("forbidden");
    const { getSql } = await import("@/lib/db");
    const { parsePayload } = await import("./user-state-parse.ts");
    const sql = await getSql();

    const registrations = await sql<{
      id: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      locale: string;
      created_at: string | Date;
    }>`select id, name, email, phone, address, locale, created_at
       from contacts order by created_at desc`;

    const users = await sql<{
      id: string;
      name: string | null;
      email: string;
      createdAt: string | Date;
    }>`select id, name, email, "createdAt" from "user" order by "createdAt" desc`;

    // Payloads are JSON text; counting in JS keeps a malformed one from
    // failing the whole query.
    const states = await sql<{ user_id: string; payload: string }>`
      select user_id, payload from preacher_state`;
    const peopleByUser = new Map(
      states.map((row) => [row.user_id, parsePayload(row.payload)?.recipients.length ?? 0]),
    );
    const schedulesByUser = new Map(
      (
        await sql<{ user_id: string; count: number }>`
          select user_id, count(*)::int as count from message_schedules group by user_id`
      ).map((row) => [row.user_id, row.count]),
    );

    const iso = (value: string | Date) => new Date(value).toISOString();
    return {
      registrations: registrations.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        locale: row.locale,
        createdAt: iso(row.created_at),
      })),
      accounts: users.map((row) => ({
        id: row.id,
        name: row.name ?? "",
        email: row.email,
        createdAt: iso(row.createdAt),
        people: peopleByUser.get(row.id) ?? 0,
        schedules: schedulesByUser.get(row.id) ?? 0,
      })),
    };
  });
