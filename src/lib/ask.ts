import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type AskTurn = { role: "user" | "assistant"; content: string };
export type AskReply = { answer: string; used: number; limit: number };

/**
 * One question from a signed-in person, answered in the app's voice.
 * Errors are a stable contract for the screen: `ask_quota` (today's limit),
 * `ask_unavailable` (no key in the hosting), `ask_failed` (the service).
 */
export const askPreacher = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { question: string; history?: AskTurn[]; locale?: "es" | "en" }) => {
    const question = String(data?.question ?? "").trim();
    if (!question || question.length > 500) throw new Error("invalid");
    const history = Array.isArray(data.history) ? data.history.slice(-12) : [];
    return { question, history, locale: data.locale === "en" ? ("en" as const) : ("es" as const) };
  })
  .handler(async ({ data, context }): Promise<AskReply> => {
    const { ASK_DAILY_LIMIT, answerQuestion, consumeAskQuota } = await import("./ai/ask.ts");
    const { deepseekConfigured } = await import("./ai/deepseek.server.ts");
    if (!deepseekConfigured()) throw new Error("ask_unavailable");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const quota = await consumeAskQuota(sql, context.userId, ASK_DAILY_LIMIT);
    if (!quota.allowed) throw new Error("ask_quota");
    try {
      const answer = await answerQuestion(data);
      return { answer, used: quota.used, limit: ASK_DAILY_LIMIT };
    } catch {
      throw new Error("ask_failed");
    }
  });
