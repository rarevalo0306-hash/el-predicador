import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getDailyPick } from "@/lib/verses";
import { validCronAuthorization } from "@/lib/messaging/worker.server";
import { dailyPhotoEnabled, dayKeysAround, ensureDailyPhotos } from "@/lib/daily-photo.server";

export const Route = createFileRoute("/api/cron/daily-photo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (
          !validCronAuthorization(request.headers.get("authorization"), process.env.CRON_SECRET)
        ) {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!dailyPhotoEnabled()) return Response.json({ enabled: false, generated: [] });
        try {
          const generated = await ensureDailyPhotos(await getSql(), dayKeysAround(), getDailyPick);
          return Response.json({ enabled: true, generated });
        } catch (error) {
          console.error("[daily-photo] generation failed", {
            reason: error instanceof Error ? error.message : "unknown",
          });
          return Response.json({ enabled: true, error: "generation_failed" }, { status: 502 });
        }
      },
    },
  },
});
