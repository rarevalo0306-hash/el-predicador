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
        const { requireUserId, UnauthorizedError } = await import("@/lib/auth/verify.server");
        const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        let userId: string;
        try {
          userId = await requireUserId(bearer || undefined);
        } catch (error) {
          if (error instanceof UnauthorizedError) return fail(401, "unauthorized");
          throw error;
        }
        let data: { question?: unknown; history?: unknown; locale?: unknown };
        try {
          data = (await request.json()) as typeof data;
        } catch {
          return fail(400, "invalid");
        }
        const question = String(data.question ?? "").trim();
        if (!question || question.length > 500) return fail(400, "invalid");
        const history = Array.isArray(data.history) ? data.history.slice(-12) : [];
        const locale = data.locale === "en" ? ("en" as const) : ("es" as const);

        const { ASK_DAILY_LIMIT, consumeAskQuota, failureCode, releaseAskQuota, streamAnswer } =
          await import("@/lib/ai/ask");
        const { deepseekConfigured } = await import("@/lib/ai/deepseek.server");
        if (!deepseekConfigured()) return fail(503, "ask_unavailable");
        const { getSql } = await import("@/lib/db");
        const sql = await getSql();
        const quota = await consumeAskQuota(sql, userId, ASK_DAILY_LIMIT);
        if (!quota.allowed) return fail(429, "ask_quota");

        let words: AsyncGenerator<string>;
        try {
          words = await streamAnswer({ question, history, locale });
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
        const encoder = new TextEncoder();
        let sent = 0;
        const body = new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              const next = await words.next();
              if (next.done) {
                if (sent === 0) await releaseAskQuota(sql, userId).catch(() => undefined);
                controller.close();
                return;
              }
              sent += next.value.length;
              controller.enqueue(encoder.encode(next.value));
            } catch (error) {
              console.error("[ask] stream failed:", failureCode(error));
              if (sent === 0) await releaseAskQuota(sql, userId).catch(() => undefined);
              controller.error(error);
            }
          },
          cancel() {
            void words.return(undefined);
          },
        });
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no",
            "X-Ask-Remaining": String(Math.max(0, ASK_DAILY_LIMIT - quota.used)),
          },
        });
      },
    },
  },
});

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}
