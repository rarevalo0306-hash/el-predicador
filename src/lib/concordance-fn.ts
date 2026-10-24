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
    const { searchApiBible } = await import("./api-bible.server");
    const { defaultBibleTranslation, bookById } = await import("./bible");
    const { payload, expiresAt, copyright } = await searchApiBible(
      data.words,
      defaultBibleTranslation(data.locale),
    );
    const hits = (payload.verses as { id: string; text: string }[]).flatMap((item) => {
      const [id, chapter, verse] = item.id.split(".");
      const book = bookById(id.toLowerCase());
      return book && Number(chapter) > 0 && Number(verse) > 0 && typeof item.text === "string"
        ? [{ bookId: book.id, chapter: Number(chapter), verse: Number(verse), text: item.text }]
        : [];
    });
    return {
      status: "ok",
      words: data.words,
      hits,
      total: Number(payload.total) || hits.length,
      copyright,
      expiresAt,
      fumsId: payload.fumsId as string | undefined,
      fumsToken: payload.fumsToken as string | undefined,
    };
  });
