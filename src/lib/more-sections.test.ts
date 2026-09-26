import { test } from "node:test";
import assert from "node:assert/strict";
import { MORE_SECTIONS, isMoreSection } from "./more-sections.ts";
import { returnFocusTo } from "./panel-focus.ts";

test("Doctrina, Guardados and Admin live in Más; the bar keeps the rest", () => {
  assert.deepEqual([...MORE_SECTIONS], ["evangelio", "guardados", "admin"]);
  for (const tab of MORE_SECTIONS) assert.equal(isMoreSection(tab), true);
  for (const tab of ["hoy", "biblia", "temas", "personas", "", "ajustes"]) {
    assert.equal(isMoreSection(tab), false, tab);
  }
});

/** A stand-in document: which selectors match, and what got focus. */
function fakeDocument(matches: Record<string, boolean>) {
  const focused: string[] = [];
  const doc = {
    querySelector(selector: string) {
      if (!matches[selector]) return null;
      return { focus: () => focused.push(selector) };
    },
  };
  return { doc, focused };
}

/** Node has no document; lend one for the length of a test. */
function useDocument(t: { after: (fn: () => void) => void }, doc: unknown) {
  const global = globalThis as { document?: unknown };
  global.document = doc;
  t.after(() => {
    delete global.document;
  });
}

function closeEvent() {
  const event = { prevented: false, preventDefault: () => (event.prevented = true) };
  return event;
}

test("closing a panel gives focus back to the button that opened it", (t) => {
  const { doc, focused } = fakeDocument({ "[data-more-trigger]": true });
  useDocument(t, doc);
  const event = closeEvent();
  returnFocusTo("[data-more-trigger]")(event as unknown as Event);
  assert.equal(event.prevented, true);
  assert.deepEqual(focused, ["[data-more-trigger]"]);
});

test("when another panel opened in its place, that panel keeps focus", (t) => {
  const { doc, focused } = fakeDocument({ '[role="dialog"]': true, "[data-more-trigger]": true });
  useDocument(t, doc);
  const event = closeEvent();
  returnFocusTo("[data-more-trigger]")(event as unknown as Event);
  assert.equal(event.prevented, true);
  assert.deepEqual(focused, []);
});

test("when the button is gone, the panel's own default applies", (t) => {
  const { doc, focused } = fakeDocument({});
  useDocument(t, doc);
  const event = closeEvent();
  returnFocusTo("[data-profile-trigger]")(event as unknown as Event);
  assert.equal(event.prevented, false);
  assert.deepEqual(focused, []);
});
