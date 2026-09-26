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
  /** "owner" from the deployment's settings, "manager" named in the app. */
  role: "owner" | "manager" | null;
};

export type AdminOverview = {
  registrations: Contact[];
  accounts: AdminAccount[];
  /** Whether the viewer is the owner (the AI lines are theirs only). */
  owner: boolean;
};

async function staffAccess(userId: string) {
  const { getSql } = await import("@/lib/db");
  const { accessFor, isStaff } = await import("./roles.server.ts");
  const sql = await getSql();
  const access = await accessFor(sql, userId);
  return { sql, access, staff: isStaff(access) };
}

/** Whether the signed-in account may open the administrator tab. */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { access, staff } = await staffAccess(context.userId);
    return { admin: staff, owner: access.owner };
  });

/**
 * Everything the owner needs to see who is using the app: the registrations
 * from the "receive the word" form, and the accounts people created. Account
 * rows carry counts only — never another person's contacts or messages.
 */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { sql, access, staff } = await staffAccess(context.userId);
    if (!staff) throw new Error("forbidden");
    const { parsePayload } = await import("./user-state-parse.ts");
    const { isAdminUser } = await import("./admin-access.ts");
    const { managerIds } = await import("./roles.server.ts");
    const managers = new Set(await managerIds(sql));

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
        role: isAdminUser(row.id, process.env)
          ? ("owner" as const)
          : managers.has(row.id)
            ? ("manager" as const)
            : null,
      })),
      owner: access.owner,
    };
  });

/**
 * Names or removes a manager. The owner and any manager may do it; the
 * owner's own role lives in the deployment settings and cannot be touched.
 */
export const setManager = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string; manager: boolean }) => ({
    userId: String(data.userId ?? "").slice(0, 100),
    manager: Boolean(data.manager),
  }))
  .handler(async ({ data, context }) => {
    const { sql, staff } = await staffAccess(context.userId);
    if (!staff) throw new Error("forbidden");
    const { isAdminUser } = await import("./admin-access.ts");
    if (!data.userId || isAdminUser(data.userId, process.env)) throw new Error("owner");
    const [exists] = await sql<{ id: string }>`select id from "user" where id = ${data.userId}`;
    if (!exists) throw new Error("unknown_account");
    if (data.manager) {
      await sql`insert into user_roles (user_id, role, granted_by)
        values (${data.userId}, 'manager', ${context.userId})
        on conflict (user_id) do nothing`;
    } else {
      await sql`delete from user_roles where user_id = ${data.userId}`;
    }
    return { ok: true };
  });
