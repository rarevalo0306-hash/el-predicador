import { createFileRoute } from "@tanstack/react-router";
import { dailyVerseForDay } from "@/lib/push/daily-message.server";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** What the iPhone widget shows: reference, theme and picture. No Scripture text. */
export const Route = createFileRoute("/api/widget/today")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const day = params.get("day") ?? "";
        if (!DAY.test(day)) return Response.json({ error: "bad_day" }, { status: 400 });
        const locale = params.get("locale") === "en" ? "en" : "es";
        const verse = dailyVerseForDay(day, locale);
        return Response.json(
          { ...verse, photo: `https://www.thepreacher.app/api/daily-photo?day=${day}` },
          { headers: { "cache-control": "public, max-age=3600, s-maxage=3600" } },
        );
      },
    },
  },
});
