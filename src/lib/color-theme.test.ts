import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isColorTheme,
  resolveColorTheme,
  THEME_BOOT_SCRIPT,
  THEME_COLOR,
  THEME_STORAGE_KEY,
} from "./color-theme.ts";

test("only the three choices are accepted", () => {
  assert.ok(isColorTheme("light"));
  assert.ok(isColorTheme("dark"));
  assert.ok(isColorTheme("system"));
  assert.ok(!isColorTheme("night"));
  assert.ok(!isColorTheme(null));
});

test("system follows the phone; day and night ignore it", () => {
  assert.equal(resolveColorTheme("system", true), "dark");
  assert.equal(resolveColorTheme("system", false), "light");
  assert.equal(resolveColorTheme("light", true), "light");
  assert.equal(resolveColorTheme("dark", false), "dark");
});

/** Runs the <head> script against a fake page and returns what it did. */
function boot(saved: string | null, systemDark: boolean) {
  const classes = new Set<string>();
  const meta = {
    content: THEME_COLOR.light as string,
    setAttribute(_: string, v: string) {
      this.content = v;
    },
  };
  const root = { classList: { add: (c: string) => classes.add(c) }, style: { colorScheme: "" } };
  const run = new Function("localStorage", "matchMedia", "document", THEME_BOOT_SCRIPT);
  run(
    { getItem: (key: string) => (key === THEME_STORAGE_KEY ? saved : null) },
    () => ({ matches: systemDark }),
    { documentElement: root, querySelectorAll: () => [meta] },
  );
  return { dark: classes.has("dark"), scheme: root.style.colorScheme, bar: meta.content };
}

test("the head script picks night before the page paints", () => {
  assert.deepEqual(boot("dark", false), { dark: true, scheme: "dark", bar: THEME_COLOR.dark });
  assert.deepEqual(boot("light", true), { dark: false, scheme: "light", bar: THEME_COLOR.light });
  assert.deepEqual(boot(null, true), { dark: true, scheme: "dark", bar: THEME_COLOR.dark });
  assert.deepEqual(boot("system", false), { dark: false, scheme: "light", bar: THEME_COLOR.light });
});

test("a broken storage never stops the page", () => {
  const run = new Function("localStorage", "matchMedia", "document", THEME_BOOT_SCRIPT);
  assert.doesNotThrow(() =>
    run(
      {
        getItem: () => {
          throw new Error("blocked");
        },
      },
      () => ({ matches: false }),
      {},
    ),
  );
});
