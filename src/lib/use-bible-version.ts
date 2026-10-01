import { normalizeBibleVersion, type BibleVersion } from "@/lib/bible";
import type { Locale } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/** The edition read in a language: the reader's pick, or the default. */
export function useBibleVersion(locale: Locale): BibleVersion {
  const chosen = useAppStore((s) => s.bibleChoice[locale]);
  return normalizeBibleVersion(chosen, locale);
}
