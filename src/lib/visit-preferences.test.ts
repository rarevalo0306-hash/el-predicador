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

test("the AI draft and the screen come back once, for the same account, within a minute", async () => {
  const { takeAskDraft, saveAskDraft, readPosition, savePosition, arrivedWithDestination } =
    await import("./visit-preferences.ts");
  const before = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  });
  try {
    saveAskDraft("a", "¿Qué dice Juan 3?", 1000);
    assert.equal(takeAskDraft("b", 2000), "", "another account never gets it");
    assert.equal(values.size, 0, "and it is removed, not left behind");
    saveAskDraft("a", "¿Qué dice Juan 3?", 1000);
    assert.equal(takeAskDraft("a", 61000), "¿Qué dice Juan 3?");
    assert.equal(takeAskDraft("a", 61000), "", "read only once");
    saveAskDraft("a", "late", 1000);
    assert.equal(takeAskDraft("a", 61001), "", "expired after a minute");
    saveAskDraft("a", "x", 1000);
    saveAskDraft("a", "   ", 1500);
    assert.equal(values.size, 0, "an empty question clears the draft");

    savePosition({ at: 1000, tab: "temas", askOpen: true, userId: "a" });
    assert.deepEqual(readPosition("a", 2000), {
      at: 1000,
      tab: "temas",
      askOpen: true,
      userId: "a",
    });
    assert.equal(readPosition("a", 2000), null, "position is used once");

    assert.equal(arrivedWithDestination("?leer=Juan+3:16"), true);
    assert.equal(arrivedWithDestination("?abrir=biblia"), true);
    assert.equal(arrivedWithDestination("?bienvenido=1"), true);
    assert.equal(arrivedWithDestination(""), false);
  } finally {
    if (before) Object.defineProperty(globalThis, "window", before);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
