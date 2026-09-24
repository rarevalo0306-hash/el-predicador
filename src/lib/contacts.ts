import { normalizePhone } from "@/lib/phone";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
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

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parseInput(data: ContactInput) {
  const name = clean(data.name, 80);
  const email = clean(data.email, 120).toLowerCase();
  const phone = normalizePhone(String(data.phone ?? ""));
  const address = clean(data.address, 200);
  const locale = data.locale === "en" ? "en" : "es";
  const origin = clean(data.origin, 40) || "app";
  if (!data.consent) throw new Error("consent");
  if (name.length < 2) throw new Error("name");
  if (!EMAIL_RE.test(email)) throw new Error("email");
  if (!phone) throw new Error("phone");
  if (address.length < 5) throw new Error("address");
  return { name, email, phone, address, locale, origin };
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
