import { createFileRoute } from "@tanstack/react-router";
import { normalizeDatabaseUrl } from "@/lib/database-url";

/**
 * Public, non-secret auth readiness probe for production debugging.
 * Does not expose credential values — only whether Google / DB are wired.
 */
export const Route = createFileRoute("/api/auth-status")({
  server: {
    handlers: {
      GET: async () => {
        const googleId = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
        const googleSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
        const betterAuthUrl = Boolean(process.env.BETTER_AUTH_URL?.trim());
        const betterAuthSecret = Boolean(process.env.BETTER_AUTH_SECRET?.trim());
        const rawDatabaseUrl = process.env.DATABASE_URL?.trim() || "";
        const databaseUrl = Boolean(rawDatabaseUrl);
        const normalized = normalizeDatabaseUrl(rawDatabaseUrl) || "";
        const usesPooler = /pooler\.supabase\.com/i.test(normalized);
        const usesDirectSupabase = /^db\.[a-z0-9]+\.supabase\.co$/i.test(
          (() => {
            try {
              return new URL(rawDatabaseUrl).hostname;
            } catch {
              return "";
            }
          })(),
        );
        return Response.json({
          ok: true,
          google: googleId && googleSecret,
          googleClientId: googleId,
          googleClientSecret: googleSecret,
          betterAuthUrl,
          betterAuthSecret,
          databaseUrl,
          databaseUsesPooler: usesPooler,
          databaseWasDirectSupabase: usesDirectSupabase,
        });
      },
    },
  },
});
