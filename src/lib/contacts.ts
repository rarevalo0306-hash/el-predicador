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

/**
 * The public "Quiero recibir la palabra" form. An email already on file is
 * left as it was: nobody can change someone else's details by typing their
 * email, and the answer is the same either way, so it does not reveal who
 * has signed up. Limited per sender and per email so it cannot be flooded.
 */
export const submitContact = createServerFn({ method: "POST" })
  .validator((data: ContactInput) => data)
  .handler(async ({ data }) => {
    if (clean(data.company, 80)) return { ok: true as const };
    const row = parseInput(data);
    const sql = await getSql();
    const { getRequest } = await import("@tanstack/react-start/server");
    const headers = getRequest()?.headers;
    const ip =
      headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || headers?.get("x-real-ip") || "";
    const { allowFormSubmission } = await import("@/lib/form-throttle.server");
    const allowed = await allowFormSubmission(sql, {
      ip,
      email: row.email,
      salt: process.env.BETTER_AUTH_SECRET || "preacher-form",
    });
    if (!allowed) throw new Error("too_many");
    const inserted = await sql<{ id: number }>`
      insert into contacts (name, email, phone, address, locale)
      values (${row.name}, ${row.email}, ${row.phone}, ${row.address}, ${row.locale})
      on conflict do nothing
      returning id
    `;
    // Only a new sign-up is sent on to the owner's inbox.
    if (inserted.length) await forwardRegistration(row);
    return { ok: true as const };
  });
