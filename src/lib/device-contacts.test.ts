import { test } from "node:test";
import assert from "node:assert/strict";
import { toDeviceContacts } from "./device-contacts.ts";

test("keeps the first number that can actually be messaged", () => {
  const { contacts, skipped } = toDeviceContacts([
    { name: ["Ana Gómez"], tel: ["no es un número", "+1 201 555 0123"] },
  ]);
  assert.deepEqual(contacts, [{ name: "Ana Gómez", phone: "+12015550123" }]);
  assert.equal(skipped, 0);
});

test("drops entries with no usable number and counts them", () => {
  const { contacts, skipped } = toDeviceContacts([
    { name: ["Sin teléfono"], tel: [] },
    { name: ["Basura"], tel: ["abc"] },
    { name: ["Ana"], tel: ["+12015550123"] },
    null,
    "no es un contacto",
  ]);
  assert.deepEqual(contacts, [{ name: "Ana", phone: "+12015550123" }]);
  assert.equal(skipped, 4);
});

test("the same number under two names is imported once", () => {
  // A phone book keeps duplicates the app should not: the second entry would
  // otherwise overwrite the first through the store's phone-based upsert.
  const { contacts, skipped } = toDeviceContacts([
    { name: ["Ana"], tel: ["+1 201 555 0123"] },
    { name: ["Ana casa"], tel: ["(201) 555-0123"] },
  ]);
  assert.deepEqual(contacts, [{ name: "Ana", phone: "+12015550123" }]);
  assert.equal(skipped, 1);
});

test("a nameless contact still imports, so its number is not lost", () => {
  const { contacts } = toDeviceContacts([{ name: [], tel: ["+12015550123"] }]);
  assert.deepEqual(contacts, [{ name: "", phone: "+12015550123" }]);
});

test("fields that arrive as plain strings work too", () => {
  // The spec says arrays, but be forgiving about what a browser hands over.
  const { contacts } = toDeviceContacts([{ name: "Ana", tel: "+12015550123" }]);
  assert.deepEqual(contacts, [{ name: "Ana", phone: "+12015550123" }]);
});

test("nothing picked, or a browser that returned nonsense, is not a crash", () => {
  assert.deepEqual(toDeviceContacts([]), { contacts: [], skipped: 0 });
  assert.deepEqual(toDeviceContacts(undefined), { contacts: [], skipped: 0 });
  assert.deepEqual(toDeviceContacts("nope"), { contacts: [], skipped: 0 });
});
