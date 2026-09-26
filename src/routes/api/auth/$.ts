import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { ensureDbReady } from "@/lib/db";

async function handleAuth(request: Request) {
  try {
    // Build-time migrate may soft-skip (ENETUNREACH). Auth uses its own pg Pool,
    // so ensure schema exists before Better Auth touches the DB.
    await ensureDbReady();
    return await auth.handler(request);
  } catch (err) {
    // The details stay in the server log; the browser gets no database text.
    const message = err instanceof Error ? `${err.name}: ${err.message}` : "error";
    console.error("[auth] handler failed:", message.replace(/[^\s@]+@[^\s@]+/g, "[email]").slice(0, 300));
    return Response.json(
      { message: "Auth request failed", code: "AUTH_HANDLER_ERROR" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuth(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});
