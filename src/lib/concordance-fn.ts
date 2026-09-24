import { createServerFn } from "@tanstack/react-start";
import type { Locale } from "@/lib/i18n";
import { cleanWords, readHits, type ConcordanceResult } from "@/lib/concordance";

/**
 * Concordance: the verses of the Recovery Version that hold every word,
 * asked of LSM each time and never kept (LSM's terms forbid storing the
 * text).
 */
export const searchConcordance = createServerFn({ method: "POST" })
  .validator((data: { words: string; locale?: Locale }) => ({
    words: cleanWords(String(data.words ?? "")),
    locale: (data.locale === "en" ? "en" : "es") as Locale,
  }))
  .handler(async ({ data }): Promise<ConcordanceResult> => {
    if (data.words.replace(/\s/g, "").length < 3) {
      return { status: "ok", words: data.words, hits: [], total: 0 };
    }
    const { searchLsmWords } = await import("@/lib/lsm-api");
    const payload = await searchLsmWords(data.words, data.locale).catch(() => null);
    if (!payload) return { status: "unavailable", words: data.words };
    return {
      status: "ok",
      words: data.words,
      ...readHits(payload),
      copyright: payload.copyright?.trim() || undefined,
    };
  });
