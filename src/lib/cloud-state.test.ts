import { test } from "node:test";
import assert from "node:assert/strict";
import { isEmptyCloud } from "./cloud-state.ts";
import { EMPTY_CHURCH } from "./church.ts";
import type { CloudPayload } from "./store.ts";

// store.ts reaches zustand and the verse tables, which `node --test` cannot
// resolve, so EMPTY_CLOUD is rebuilt here. Typing it as CloudPayload keeps the
// two in step: a new field on the payload fails `npm run typecheck` here until
// this copy — and isEmptyCloud itself — account for it.
const EMPTY: CloudPayload = {
  favorites: [],
  favoriteKinds: {},
  verseMemory: {},
  savedMessages: [],
  displayName: "",
  notify: false,
  notifyHour: 8,
  recipients: [],
  church: { ...EMPTY_CHURCH },
  sent: [],
  dailyOffset: 0,
  dailyDate: "",
  readingPlace: null,
  bookmarks: [],
  highlights: [],
  fontScale: 1,
};

test("an untouched visit is empty, and so is a payload that is not there", () => {
  assert.equal(isEmptyCloud(EMPTY), true);
  assert.equal(isEmptyCloud(null), true);
  assert.equal(isEmptyCloud(undefined), true);
});

test("every collection the owner fills counts as work", () => {
  // Contacts were the collection this check forgot: state holding only them
  // read as empty, so signing in replaced it with the account's empty state
  // and the save that followed wrote that emptiness back.
  assert.equal(
    isEmptyCloud({
      ...EMPTY,
      recipients: [{ id: "r1", name: "Ana", phone: "+12015550123", at: 1 }],
    }),
    false,
  );
  assert.equal(isEmptyCloud({ ...EMPTY, favorites: ["v1"] }), false);
  assert.equal(
    isEmptyCloud({
      ...EMPTY,
      savedMessages: [{ id: "m1", verseId: "v1", kind: "animo", at: 1 }],
    }),
    false,
  );
  assert.equal(
    isEmptyCloud({ ...EMPTY, bookmarks: [{ bookId: "jn", chapter: 3, verse: 16, at: 1 }] }),
    false,
  );
  assert.equal(isEmptyCloud({ ...EMPTY, highlights: ["jn-3-16"] }), false);
  assert.equal(isEmptyCloud({ ...EMPTY, sent: [{ verseId: "v1", at: 1 }] }), false);
  assert.equal(isEmptyCloud({ ...EMPTY, displayName: "Ricardo" }), false);
});

test("a configured congregation counts, its untouched defaults do not", () => {
  assert.equal(isEmptyCloud({ ...EMPTY, church: { ...EMPTY_CHURCH, name: "Iglesia" } }), false);
  assert.equal(isEmptyCloud({ ...EMPTY, church: { ...EMPTY_CHURCH, city: "Boston" } }), false);
  assert.equal(isEmptyCloud({ ...EMPTY, church: { ...EMPTY_CHURCH, serviceDays: [0, 3] } }), false);
  assert.equal(
    isEmptyCloud({ ...EMPTY, church: { ...EMPTY_CHURCH, serviceTime: "18:00" } }),
    false,
  );
  assert.equal(
    isEmptyCloud({ ...EMPTY, church: { ...EMPTY_CHURCH, reminderHoursBefore: 5 } }),
    false,
  );
  assert.equal(isEmptyCloud({ ...EMPTY, church: { ...EMPTY_CHURCH } }), true);
});

test("preferences alone are not work", () => {
  // Otherwise merely opening the app would look occupied, and the account's
  // own stored state would stop loading over it.
  assert.equal(isEmptyCloud({ ...EMPTY, fontScale: 3 }), true);
  assert.equal(isEmptyCloud({ ...EMPTY, locale: "en" }), true);
  assert.equal(isEmptyCloud({ ...EMPTY, notify: true, notifyHour: 21 }), true);
  assert.equal(
    isEmptyCloud({ ...EMPTY, readingPlace: { bookId: "jn", chapter: 3, verse: 16, at: 1 } }),
    true,
  );
  assert.equal(isEmptyCloud({ ...EMPTY, displayName: "   " }), true);
});
