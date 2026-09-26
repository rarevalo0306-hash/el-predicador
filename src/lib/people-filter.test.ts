import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterCounts,
  filterPeople,
  fold,
  matchesSearch,
  themesInUse,
  type PersonRow,
} from "./people-filter.ts";

// Made-up contacts; 555 numbers are reserved for fiction.
const PEOPLE: PersonRow[] = [
  { id: "1", name: "José Pérez", phone: "+12015550101", notes: "Conocido en el parque" },
  { id: "2", name: "Ana María", phone: "+12015550102", channel: "sms", dailyEnabled: true },
  {
    id: "3",
    name: "Lucía",
    phone: "+525555550103",
    channel: "whatsapp",
    cultoEnabled: true,
    themeIds: ["fe", "paz"],
  },
  { id: "4", name: "Mateo Ruiz", phone: "+12015550104", themeId: "esperanza" },
];

const ids = (rows: PersonRow[]) => rows.map((row) => row.id);

test("fold ignores accents and case", () => {
  assert.equal(fold("  JOSÉ Pérez "), "jose perez");
  assert.equal(fold("Lucía"), "lucia");
});

test("search finds names and notes without accents, in any order of words", () => {
  assert.deepEqual(ids(filterPeople(PEOPLE, "jose", "all")), ["1"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "perez jose", "all")), ["1"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "LUCIA", "all")), ["3"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "parque", "all")), ["1"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "nadie", "all")), []);
  assert.deepEqual(ids(filterPeople(PEOPLE, "   ", "all")), ["1", "2", "3", "4"]);
});

test("search finds phone digits, however they are typed, from three digits", () => {
  assert.equal(matchesSearch(PEOPLE[1], "0102"), true);
  assert.equal(matchesSearch(PEOPLE[1], "(201) 555-0102"), true);
  assert.equal(matchesSearch(PEOPLE[1], "01"), false, "two digits match too much");
});

test("filters by channel and reminders; older contacts count as WhatsApp", () => {
  assert.deepEqual(ids(filterPeople(PEOPLE, "", "whatsapp")), ["1", "3", "4"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "", "sms")), ["2"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "", "daily")), ["2"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "", "culto")), ["3"]);
  assert.deepEqual(filterCounts(PEOPLE), { all: 4, whatsapp: 3, sms: 1, daily: 1, culto: 1 });
});

test("filters by theme, including the single theme older contacts carry", () => {
  assert.deepEqual(ids(filterPeople(PEOPLE, "", "all", "paz")), ["3"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "", "all", "esperanza")), ["4"]);
  // Contacts with no theme saved get "amor", as they always did.
  assert.deepEqual(ids(filterPeople(PEOPLE, "", "all", "amor")), ["1", "2"]);
  assert.deepEqual(ids(filterPeople(PEOPLE, "ana", "sms", "amor")), ["2"]);
  assert.deepEqual(themesInUse(PEOPLE, ["amor", "fe", "esperanza", "paz", "gratitud"]), [
    "amor",
    "fe",
    "esperanza",
    "paz",
  ]);
});
