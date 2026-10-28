import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { validCronAuthorization } from "@/lib/messaging/worker.server";
import { apnsConfigured, http2Transport } from "@/lib/push/apns.server";
import { runDailyPush } from "@/lib/push/daily.server";
import { dailyVerseForDay } from "@/lib/push/daily-message.server";

/** Hourly: the daily reminder for every iPhone whose chosen hour it is now. */
export const Route = createFileRoute("/api/cron/push")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (
          !validCronAuthorization(request.headers.get("authorization"), process.env.CRON_SECRET)
        ) {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!apnsConfigured()) return Response.json({ enabled: false });
        const transport = http2Transport();
        try {
          const result = await runDailyPush(
            await getSql(),
            new Date(),
            (day, locale) => dailyVerseForDay(day, locale),
            transport,
          );
          return Response.json({ enabled: true, ...result });
        } catch (error) {
          console.error("[push] run failed", {
            reason: error instanceof Error ? error.message : "unknown",
          });
          return Response.json({ enabled: true, error: "push_failed" }, { status: 502 });
        } finally {
          transport.close();
        }
      },
    },
  },
});
