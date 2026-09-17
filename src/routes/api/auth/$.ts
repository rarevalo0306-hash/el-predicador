import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { ensureDbReady } from "@/lib/db";

async function handleAuth(request: Request) {
  // Build-time migrate may soft-skip (ENETUNREACH). Auth uses its own pg Pool,
  // so ensure schema exists before Better Auth touches the DB.
  await ensureDbReady();
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuth(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});
