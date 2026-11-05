import { createFileRoute } from "@tanstack/react-router";

/**
 * "Pregunta", streamed: the answer is sent as plain text while DeepSeek
 * writes it, so the first words show within a second or two. Before any
 * text: 401 signed out, 400 bad question, 503 no key, 429 today's limit,
 * 502 `ask_failed:<code>` when the service refuses. A failed question is
 * given back to the day's quota.
 */
export const Route = createFileRoute("/api/ask")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { callerId, fail, textStream } = await import("@/lib/ai/stream-route.server");
        const userId = await callerId(request);
        if (userId instanceof Response) return userId;
        let data: { question?: unknown; history?: unknown; locale?: unknown; aiConsent?: unknown };
        try {
          data = (await request.json()) as typeof data;
        } catch {
          return fail(400, "invalid");
        }
        if (data.aiConsent !== true) return fail(400, "ai_consent_required");
        const question = String(data.question ?? "").trim();
        if (!question || question.length > 500) return fail(400, "invalid");
        const history = Array.isArray(data.history) ? data.history.slice(-12) : [];
        const locale = data.locale === "en" ? ("en" as const) : ("es" as const);

        const { consumeAskQuota, failureCode, releaseAskQuota, streamAnswer } =
          await import("@/lib/ai/ask");
        const { tasteFor } = await import("@/lib/taste.server");
        const { deepseekConfigured } = await import("@/lib/ai/deepseek.server");
        if (!deepseekConfigured()) return fail(503, "ask_unavailable");
        const { getSql } = await import("@/lib/db");
        const sql = await getSql();
        const { accessFor, askLimit } = await import("@/lib/roles.server");
        const limit = askLimit(await accessFor(sql, userId));
        const quota = await consumeAskQuota(sql, userId, limit);
        if (!quota.allowed) return fail(429, "ask_quota");

        // What the app learned from their "Me gusta", worked out in its own code.
        const taste = await tasteFor(sql, userId, locale).catch(() => "");

        let words: AsyncGenerator<string>;
        try {
          words = await streamAnswer({ question, history, locale, taste });
        } catch (error) {
          const code = failureCode(error);
          console.error(
            "[ask] answer failed:",
            code,
            error instanceof Error ? error.message : error,
          );
          await releaseAskQuota(sql, userId).catch(() => undefined);
          return fail(502, `ask_failed:${code}`);
        }
        return textStream(words, sql, userId, limit - quota.used, "ask");
      },
    },
  },
});
