import { createFileRoute } from "@tanstack/react-router";
/** LBLA Express License disallows copyrighted Scripture in runtime prompts. */
export const Route = createFileRoute("/api/compose")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { error: "bible_ai_not_licensed" },
          { status: 403, headers: { "cache-control": "no-store" } },
        ),
    },
  },
});
