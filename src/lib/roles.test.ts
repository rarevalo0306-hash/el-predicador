import { test } from "node:test";
import assert from "node:assert/strict";
import type { Sql } from "./db.ts";
import {
  ASK_LIMIT,
  accessFor,
  askLimit,
  cappedSender,
  messagingConfig,
} from "./roles.server.ts";

/** A stand-in database holding one manager. */
const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const query = strings.join("?");
  if (query.includes("from user_roles where user_id")) {
    return values[0] === "helper" ? [{ role: "manager" }] : [];
  }
  if (query.includes("from user_roles")) return [{ user_id: "helper" }];
  return [];
}) as unknown as Sql;

const config = {
  CONTACTS_ADMIN_USER_IDS: "owner",
  MESSAGING_ALLOWED_USER_IDS: "owner",
};

test("the owner comes from the settings, managers from the app", async () => {
  assert.deepEqual(await accessFor(sql, "owner", config), { owner: true, manager: false });
  assert.deepEqual(await accessFor(sql, "helper", config), { owner: false, manager: true });
  assert.deepEqual(await accessFor(sql, "someone", config), { owner: false, manager: false });
  assert.deepEqual(await accessFor(sql, "", config), { owner: false, manager: false });
});

test("staff ask more of the AI each day", async () => {
  assert.equal(askLimit({ owner: true, manager: false }), ASK_LIMIT.staff);
  assert.equal(askLimit({ owner: false, manager: true }), ASK_LIMIT.staff);
  assert.equal(askLimit({ owner: false, manager: false }), ASK_LIMIT.member);
});

test("managers may send automatically, within the monthly cap", async () => {
  const allowed = await messagingConfig(sql, config);
  assert.equal(allowed.MESSAGING_ALLOWED_USER_IDS, "owner,helper");
  assert.equal(cappedSender("owner", config), false);
  assert.equal(cappedSender("helper", config), true);
});
