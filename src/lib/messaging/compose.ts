import { t, type Locale } from "../i18n.ts";

/**
 * The message a theme schedule sends: a short line, the verse, its reference
 * and source, and the sender's sign-off. Same shape as formatVerseMessage in
 * share.ts, which the hand-sent messages use; kept apart because the worker
 * and its tests must load without the app's import aliases.
 */
export function composeVerseMessage(input: {
  note?: string | null;
  text: string;
  ref: string;
  source?: string | null;
  senderName?: string | null;
  locale: Locale;
}): string {
  const lines: string[] = [];
  const note = input.note?.trim();
  if (note) lines.push(note, "");
  lines.push(`«${input.text.trim()}»`, `— ${input.ref}`);
  if (input.source) lines.push(input.source);
  const name = input.senderName?.trim();
  if (name) lines.push("", t(input.locale, "signOff", { name }));
  return lines.join("\n");
}

/** The nth item of a rotation that wraps around; null for an empty list. */
export function pickRotating<T>(items: readonly T[], index: number): T | null {
  if (!items.length) return null;
  return items[((index % items.length) + items.length) % items.length];
}

/**
 * The lines the app already ships, for a verse that has no prepared ones
 * yet. Ordered so that consecutive sends do not repeat.
 */
export function fallbackNotes(locale: Locale): string[] {
  return [
    t(locale, "tplAnimo"),
    t(locale, "tplPaz"),
    t(locale, "tplOracion"),
    t(locale, "tplBendicion"),
  ];
}
