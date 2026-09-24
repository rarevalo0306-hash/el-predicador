import { test } from "node:test";
import assert from "node:assert/strict";
import { recipientThemes, themeForDay, toggleTheme } from "./recipient-themes.ts";
import { parseRecipient } from "./user-state-parse.ts";

test("older contacts keep their one theme; new ones keep several", () => {
  assert.deepEqual(recipientThemes({ themeId: "paz" }), ["paz"]);
  assert.deepEqual(recipientThemes({}), ["amor"]);
  assert.deepEqual(recipientThemes({ themeIds: ["fe", "nada", "fe", "paz"], themeId: "fe" }), ["fe", "paz"]);
  assert.deepEqual(recipientThemes({ themeIds: [], themeId: "consuelo" }), ["consuelo"]);
});

test("toggling never leaves a contact without a theme", () => {
  assert.deepEqual(toggleTheme(["amor"], "fe"), ["amor", "fe"]);
  assert.deepEqual(toggleTheme(["amor", "fe"], "amor"), ["fe"]);
  assert.deepEqual(toggleTheme(["fe"], "fe"), ["fe"]);
});

test("themes take turns by day", () => {
  assert.equal(themeForDay(["amor", "fe", "paz"], 0), "amor");
  assert.equal(themeForDay(["amor", "fe", "paz"], 4), "fe");
  assert.equal(themeForDay(["paz"], 99), "paz");
});

test("several themes survive the cloud round trip", () => {
  const row = parseRecipient({
    id: "r1",
    name: "Ana",
    phone: "+12015550123",
    themeId: "fe",
    themeIds: ["fe", "paz", "bogus"],
  });
  assert.deepEqual(row?.themeIds, ["fe", "paz"]);
  assert.equal(row?.themeId, "fe");
});
