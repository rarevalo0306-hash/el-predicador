import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { forwardRegistration } from "@/lib/sheet";

export type Contact = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  locale: string;
  createdAt: string;
};

type ContactInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  consent: boolean;
  locale?: string;
  company?: string;
  origin?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\s.-]{7,20}$/;

/** Admin PIN must come from env — no public default. */
function adminPin(): string | undefined {
  return env("CONTACTS_ADMIN_PIN");
}

function adminUserIds(): string[] {
  const raw = env("CONTACTS_ADMIN_USER_IDS");
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parseInput(data: ContactInput) {
  const name = clean(data.name, 80);
  const email = clean(data.email, 120).toLowerCase();
  const phone = clean(data.phone, 20);
  const address = clean(data.address, 200);
  const locale = data.locale === "en" ? "en" : "es";
  const origin = clean(data.origin, 40) || "app";
  if (!data.consent) throw new Error("consent");
  if (name.length < 2) throw new Error("name");
  if (!EMAIL_RE.test(email)) throw new Error("email");
  if (!PHONE_RE.test(phone)) throw new Error("phone");
  if (address.length < 5) throw new Error("address");
  return { name, email, phone, address, locale, origin };
}

function isAuthorizedAdmin(userId: string, pin: string): boolean {
  const expected = adminPin();
  if (!expected) return false;
  if (clean(pin, 40) !== expected) return false;
  const allow = adminUserIds();
  if (allow.length > 0 && !allow.includes(userId)) return false;
  return true;
}

export const submitContact = createServerFn({ method: "POST" })
  .validator((data: ContactInput) => data)
  .handler(async ({ data }) => {
    if (clean(data.company, 80)) {
      return { ok: true as const, duplicate: false };
    }
    const row = parseInput(data);
    const sql = await getSql();
    const existing = await sql<{ id: number }>`
      select id from contacts where lower(email) = ${row.email} limit 1
    `;
    if (existing[0]) {
      await sql`
        update contacts
        set name = ${row.name},
            phone = ${row.phone},
            address = ${row.address},
            locale = ${row.locale}
        where id = ${existing[0].id}
      `;
      await forwardRegistration(row);
      return { ok: true as const, duplicate: true };
    }
    await sql`
      insert into contacts (name, email, phone, address, locale)
      values (${row.name}, ${row.email}, ${row.phone}, ${row.address}, ${row.locale})
    `;
    await forwardRegistration(row);
    return { ok: true as const, duplicate: false };
  });

export const listContacts = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { pin: string }) => data)
  .handler(async ({ data, context }) => {
    if (!adminPin()) {
      return { ok: false as const, error: "unavailable" as const };
    }
    if (!isAuthorizedAdmin(context.userId, data.pin)) {
      return { ok: false as const, error: "pin" as const };
    }
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      locale: string;
      created_at: string;
    }>`
      select id, name, email, phone, address, locale, created_at
      from contacts
      order by created_at desc
    `;
    return {
      ok: true as const,
      rows: rows.map(
        (row): Contact => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          locale: row.locale,
          createdAt: row.created_at,
        }),
      ),
    };
  });
