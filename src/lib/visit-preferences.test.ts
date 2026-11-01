import test from "node:test";
import assert from "node:assert/strict";
import {
  validPosition,
  readChoice,
  saveChoice,
  MESSAGE_LANGUAGE_KEY,
} from "./visit-preferences.ts";
test("restore within a minute, never another account or an expired/corrupt position", () => {
  const saved = { at: 1000, tab: "biblia", askOpen: true, userId: "a" };
  assert.equal(validPosition(saved, "a", 61000), true);
  assert.equal(validPosition(saved, "a", 61001), false);
  assert.equal(validPosition(saved, "b", 2000), false);
  assert.equal(validPosition(saved, "a", 999), false);
  assert.equal(validPosition({ ...saved, tab: "bad" }, "a", 2000), false);
  assert.equal(validPosition(null, "a", 2000), false);
});
test("interface and message choices remain independent and storage failure is safe", () => {
  const before = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  });
  try {
    saveChoice("preacher-locale", "es");
    saveChoice(MESSAGE_LANGUAGE_KEY, "en");
    assert.equal(readChoice("preacher-locale"), "es");
    assert.equal(readChoice(MESSAGE_LANGUAGE_KEY), "en");
    values.set(MESSAGE_LANGUAGE_KEY, "invalid");
    assert.equal(readChoice(MESSAGE_LANGUAGE_KEY), undefined);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        get localStorage() {
          throw Error("unavailable");
        },
      },
    });
    assert.equal(readChoice("preacher-locale"), undefined);
    assert.doesNotThrow(() => saveChoice("preacher-locale", "en"));
  } finally {
    if (before) Object.defineProperty(globalThis, "window", before);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
