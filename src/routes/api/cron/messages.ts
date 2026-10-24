import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { runScheduledMessages, validCronAuthorization } from "@/lib/messaging/worker.server";

export const Route = createFileRoute("/api/cron/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (
          !validCronAuthorization(request.headers.get("authorization"), process.env.CRON_SECRET)
        ) {
          return new Response("Unauthorized", { status: 401 });
        }
        const sql = await getSql();
        await sql.query("delete from native_auth_handoffs where expires_at <= now()");
        await sql.query(
          "delete from api_bible_cache where expires_at <= now() and (lease_until is null or lease_until < now())",
        );
        if (process.env.MESSAGING_ENABLED !== "true")
          return Response.json({ enabled: false, processed: 0 });
        return Response.json(await runScheduledMessages(sql));
      },
    },
  },
});
