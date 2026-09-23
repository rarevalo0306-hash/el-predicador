import { createFileRoute } from "@tanstack/react-router";

/**
 * A message for one person from a preaching case, streamed as plain text
 * while the model writes it. Shares "Pregunta"'s daily quota and its error
 * contract: 401 signed out, 400 bad input, 503 no key, 429 today's limit,
 * 502 `ask_failed:<code>`.
 */
export const Route = createFileRoute("/api/compose")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { callerId, fail, textStream } = await import("@/lib/ai/stream-route.server");
        const userId = await callerId(request);
        if (userId instanceof Response) return userId;
        let data: { caseId?: unknown; details?: unknown; locale?: unknown };
        try {
          data = (await request.json()) as typeof data;
        } catch {
          return fail(400, "invalid");
        }
        const { PREACH_CASES, caseVerses, localizedCase } = await import("@/lib/preach-cases");
        const entry = PREACH_CASES.find((c) => c.id === data.caseId);
        if (!entry) return fail(400, "invalid");
        const locale = data.locale === "en" ? ("en" as const) : ("es" as const);
        const { DETAILS_MAX, streamComposed } = await import("@/lib/ai/compose");
        const details = String(data.details ?? "")
          .trim()
          .slice(0, DETAILS_MAX);

        const { ASK_DAILY_LIMIT, consumeAskQuota, failureCode, releaseAskQuota } =
          await import("@/lib/ai/ask");
        const { deepseekConfigured } = await import("@/lib/ai/deepseek.server");
        if (!deepseekConfigured()) return fail(503, "ask_unavailable");
        const { getSql } = await import("@/lib/db");
        const sql = await getSql();
        const quota = await consumeAskQuota(sql, userId, ASK_DAILY_LIMIT);
        if (!quota.allowed) return fail(429, "ask_quota");

        try {
          const { hydrateVerses } = await import("@/lib/recobro");
          const localized = localizedCase(entry, locale);
          const verses = (await hydrateVerses(caseVerses(entry, locale), locale))
            .filter((v) => v.text.trim())
            .map((v) => ({ ref: v.ref, text: v.text }));
          const words = await streamComposed({
            caseTitle: localized.title,
            issue: localized.issue,
            approach: localized.approach,
            points: localized.points,
            verses,
            details,
            locale,
          });
          return textStream(words, sql, userId, ASK_DAILY_LIMIT - quota.used, "compose");
        } catch (error) {
          const code = failureCode(error);
          console.error("[compose] failed:", code, error instanceof Error ? error.message : error);
          await releaseAskQuota(sql, userId).catch(() => undefined);
          return fail(502, `ask_failed:${code}`);
        }
      },
    },
  },
});
