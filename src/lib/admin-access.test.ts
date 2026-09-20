import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminUser } from "./admin-access.ts";

test("only the listed account is an administrator", () => {
  const config = { CONTACTS_ADMIN_USER_IDS: "owner" };
  assert.equal(isAdminUser("owner", config), true);
  assert.equal(isAdminUser("other", config), false);
});

test("an unset list makes nobody an administrator, not everybody", () => {
  // "".split(",") is [""], so an empty caller id would otherwise match.
  assert.equal(isAdminUser("", {}), false);
  assert.equal(isAdminUser("", { CONTACTS_ADMIN_USER_IDS: "" }), false);
  assert.equal(isAdminUser("owner", {}), false);
});

test("spaces and several ids are tolerated", () => {
  const config = { CONTACTS_ADMIN_USER_IDS: " owner , second " };
  assert.equal(isAdminUser("owner", config), true);
  assert.equal(isAdminUser("second", config), true);
  assert.equal(isAdminUser("", config), false);
});
