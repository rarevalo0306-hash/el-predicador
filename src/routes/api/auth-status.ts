import { createFileRoute } from "@tanstack/react-router";

/**
 * Public, non-secret auth readiness probe for production debugging.
 * Does not expose credential values — only whether Google is wired.
 */
export const Route = createFileRoute("/api/auth-status")({
  server: {
    handlers: {
      GET: async () => {
        const googleId = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
        const googleSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
        const betterAuthUrl = Boolean(process.env.BETTER_AUTH_URL?.trim());
        const betterAuthSecret = Boolean(process.env.BETTER_AUTH_SECRET?.trim());
        const databaseUrl = Boolean(process.env.DATABASE_URL?.trim());
        return Response.json({
          ok: true,
          google: googleId && googleSecret,
          googleClientId: googleId,
          googleClientSecret: googleSecret,
          betterAuthUrl,
          betterAuthSecret,
          databaseUrl,
        });
      },
    },
  },
});
