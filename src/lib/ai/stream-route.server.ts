/**
 * What the streamed AI routes share: who is asking, the day's quota, and a
 * plain-text response that gives the question back when no text came.
 */
import type { Sql } from "@/lib/db";

export function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Whether a browser sent this from somewhere else (another site, or a
 * sibling app on the same domain). The app's own pages send
 * "same-origin"; scripts and servers send no header at all. The same rule
 * authMiddleware applies to server functions.
 */
export function crossSite(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  return Boolean(site) && site !== "same-origin" && site !== "none";
}

/** The signed-in user id, or a ready 401 (or 403) response. */
export async function callerId(request: Request): Promise<string | Response> {
  if (crossSite(request)) return fail(403, "forbidden");
  const { requireUserId, UnauthorizedError } = await import("@/lib/auth/verify.server");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  try {
    return await requireUserId(bearer || undefined);
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail(401, "unauthorized");
    throw error;
  }
}

/**
 * Streams the words as UTF-8 text. If nothing at all was sent, the quota is
 * given back, since the person got no answer.
 */
export function textStream(
  words: AsyncGenerator<string>,
  sql: Sql,
  userId: string,
  remaining: number,
  tag: string,
) {
  const encoder = new TextEncoder();
  let sent = 0;
  const release = async () => {
    const { releaseAskQuota } = await import("./ask.ts");
    await releaseAskQuota(sql, userId).catch(() => undefined);
  };
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await words.next();
        if (next.done) {
          if (sent === 0) await release();
          controller.close();
          return;
        }
        sent += next.value.length;
        controller.enqueue(encoder.encode(next.value));
      } catch (error) {
        const { failureCode } = await import("./ask.ts");
        console.error(`[${tag}] stream failed:`, failureCode(error));
        if (sent === 0) await release();
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
      "X-Ask-Remaining": String(Math.max(0, remaining)),
    },
  });
}
