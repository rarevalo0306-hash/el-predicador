import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { themePhotoUrl } from "@/lib/theme-photos";
import { getDailyPick } from "@/lib/verses";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Home's daily picture: the one generated for that day, else the stock
 * photo of the day's theme. Public, holds no user data.
 */
export const Route = createFileRoute("/api/daily-photo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const day = new URL(request.url).searchParams.get("day") ?? "";
        if (!DAY.test(day)) return new Response("Bad request", { status: 400 });
        const [y, m, d] = day.split("-").map(Number);
        const { theme } = getDailyPick(0, new Date(y!, m! - 1, d!, 12));
        const fallback = () =>
          new Response(null, {
            status: 302,
            headers: {
              location: themePhotoUrl(theme),
              "cache-control": "public, max-age=600",
            },
          });
        if (process.env.DAILY_PHOTO_ENABLED !== "true") return fallback();
        try {
          const sql = await getSql();
          const rows = await sql.query<{ mime: string; data: Uint8Array }>(
            "select mime, data from daily_photos where day = $1",
            [day],
          );
          const row = rows[0];
          if (!row) return fallback();
          return new Response(Buffer.from(row.data), {
            headers: {
              "content-type": row.mime,
              "cache-control": "public, max-age=86400, s-maxage=86400",
            },
          });
        } catch {
          return fallback();
        }
      },
    },
  },
});
