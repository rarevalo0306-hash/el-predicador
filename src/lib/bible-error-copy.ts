import type { Locale } from "./i18n";
import { BIBLE_LIMIT, BIBLE_UNAVAILABLE } from "./api-bible-content";

/** Localize service states at the UI boundary without altering publisher content. */
export function bibleErrorCopy(error: unknown, locale: Locale): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message === BIBLE_LIMIT)
    return locale === "en"
      ? "The reading service limit has been reached. Recently cached chapters may still be available. Please try again later."
      : BIBLE_LIMIT;
  if (message.includes("capítulo se está preparando"))
    return locale === "en"
      ? "This chapter is being prepared. Please try again in a few seconds."
      : "Este capítulo se está preparando. Vuelve a intentarlo en unos segundos.";
  return locale === "en"
    ? "LBLA reading is unavailable right now. Please try again later; your references are still saved."
    : BIBLE_UNAVAILABLE;
}
