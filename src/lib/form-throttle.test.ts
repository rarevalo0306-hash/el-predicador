import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "./db.ts";
import {
  PER_ADDRESS_PER_HOUR,
  PER_EMAIL_PER_DAY,
  allowFormSubmission,
  throttleKey,
} from "./form-throttle.server.ts";

const db = new PGlite();
const sql = (async (parts: TemplateStringsArray, ...values: unknown[]) => {
  let text = parts[0];
  values.forEach((_, i) => {
    text += `$${i + 1}${parts[i + 1]}`;
  });
  return (await db.query(text, values)).rows;
}) as Sql;
sql.query = async <T>(text: string, values: unknown[] = []) =>
  (await db.query<T>(text, values)).rows;

before(async () => {
  // Every migration, in order, the way the app applies them.
  const dir = new URL("../../migrations/", import.meta.url);
  for (const name of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, dir), "utf8"));
  }
});
beforeEach(async () => {
  await db.exec("truncate form_throttle, contacts");
});
after(async () => {
  await db.close();
});

const NOW = new Date("2026-09-26T12:00:00Z");
const salt = "test-salt";

test("the table never holds an address or an email", () => {
  const key = throttleKey("email", "ana@example.com", salt);
  assert.ok(!key.includes("ana"));
  assert.notEqual(key, throttleKey("email", "ana@example.com", "other-salt"));
});

test("one sender gets a few forms an hour, then must wait", async () => {
  for (let i = 0; i < PER_ADDRESS_PER_HOUR; i += 1) {
    assert.equal(
      await allowFormSubmission(sql, {
        ip: "203.0.113.7",
        email: `p${i}@example.com`,
        salt,
        now: NOW,
      }),
      true,
    );
  }
  assert.equal(
    await allowFormSubmission(sql, {
      ip: "203.0.113.7",
      email: "late@example.com",
      salt,
      now: NOW,
    }),
    false,
  );
  const nextHour = new Date(NOW.getTime() + 61 * 60 * 1000);
  assert.equal(
    await allowFormSubmission(sql, {
      ip: "203.0.113.7",
      email: "late@example.com",
      salt,
      now: nextHour,
    }),
    true,
  );
});

test("one email gets a few forms a day, from anywhere", async () => {
  for (let i = 0; i < PER_EMAIL_PER_DAY; i += 1) {
    assert.equal(
      await allowFormSubmission(sql, {
        ip: `198.51.100.${i}`,
        email: "ana@example.com",
        salt,
        now: NOW,
      }),
      true,
    );
  }
  assert.equal(
    await allowFormSubmission(sql, {
      ip: "198.51.100.99",
      email: "ana@example.com",
      salt,
      now: NOW,
    }),
    false,
  );
});

test("a registration already on file is never overwritten by the same email", async () => {
  await sql`insert into contacts (name, email, phone, address, locale)
    values ('Ana Real', 'ana@example.com', '+12015550101', 'Calle 1', 'es')`;
  // The same statement submitContact runs.
  const inserted = await sql<{ id: number }>`
    insert into contacts (name, email, phone, address, locale)
    values ('Otro', 'ANA@example.com', '+12015550199', 'Otra calle', 'es')
    on conflict do nothing
    returning id`;
  assert.equal(inserted.length, 0);
  const [row] = await sql<{ name: string; phone: string }>`select name, phone from contacts`;
  assert.deepEqual(row, { name: "Ana Real", phone: "+12015550101" });
});

test("personal tables have row security on", async () => {
  const rows = await sql<{ relname: string; relrowsecurity: boolean }>`
    select relname, relrowsecurity from pg_class
    where relname in ('contacts', 'preacher_state', 'user', 'session', 'account', 'form_throttle')`;
  assert.equal(rows.length, 6);
  for (const row of rows) assert.equal(row.relrowsecurity, true, row.relname);
});
