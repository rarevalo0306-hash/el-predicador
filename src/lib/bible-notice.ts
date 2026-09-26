import type { BibleVersion } from "./bible.ts";
import type { Locale } from "./i18n.ts";

/**
 * The copyright line each edition asks for, shown next to its text wherever
 * it appears: on screen, in messages and on the shared image. The APIs send
 * their own line with every chapter and that one wins; these are what they
 * send today, for text that arrives without one.
 */
export const RECOBRO_NOTICE: Record<Locale, string> = {
  es: "Santa Biblia Versión Recobro (Texto solamente) © 2025 Living Stream Ministry www.lsm.org/es",
  en: "Verses accessed from the Holy Bible Recovery Version (text-only edition) © 2022 Living Stream Ministry www.lsm.org",
};

export const LOCKMAN_NOTICE: Record<Extract<BibleVersion, "lbla" | "nasb20">, string> = {
  lbla:
    "Texto bíblico tomado de LA BIBLIA DE LAS AMERICAS® © Copyright 1986, 1995, 1997 by The Lockman Foundation. Usado con permiso.",
  nasb20:
    "Scripture quotations taken from the (NASB®) New American Standard Bible®, Copyright © 1960, 1971, 1977, 1995, 2020 by The Lockman Foundation. Used by permission. All rights reserved. lockman.org",
};

export function bibleNotice(version: BibleVersion, locale: Locale): string {
  if (version === "lbla" || version === "nasb20") return LOCKMAN_NOTICE[version];
  return RECOBRO_NOTICE[locale];
}

/** A notice as plain text: LSM sends its link as Markdown, "[www.lsm.org](https://…)". */
export function plainNotice(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Which edition a verse's source line names, if any. */
export function versionOfSource(source: string | null | undefined): BibleVersion | null {
  if (!source) return null;
  if (/\bLBLA\b|Biblia de las Am[eé]ricas/i.test(source)) return "lbla";
  if (/\bNASB\b|New American Standard/i.test(source)) return "nasb20";
  if (/Recobro|Recovery Version/i.test(source)) return "recovery";
  return null;
}

/**
 * The line to show or send with a verse: the one its edition sent with it,
 * or that edition's notice when it came without one. Null for text that is
 * not from one of these editions.
 */
export function verseNotice(
  verse: { copyright?: string | null; source?: string | null },
  locale: Locale,
): string | null {
  if (verse.copyright?.trim()) return plainNotice(verse.copyright);
  const version = versionOfSource(verse.source);
  return version ? bibleNotice(version, locale) : null;
}
