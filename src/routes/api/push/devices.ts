import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { parseDeviceInput } from "@/lib/push/daily.server";

const TOKEN = /^[0-9a-f]{64,200}$/i;

/**
 * The iPhone app registers its Apple push token for the daily reminder, or
 * removes it. Holds no account data; a token only receives that reminder.
 */
export const Route = createFileRoute("/api/push/devices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const input = parseDeviceInput(await request.json().catch(() => null));
        if (!input) return Response.json({ ok: false }, { status: 400 });
        const sql = await getSql();
        await sql.query(
          `insert into push_devices (token, environment, hour, locale, time_zone)
           values ($1, $2, $3, $4, $5)
           on conflict (token) do update set environment = excluded.environment, hour = excluded.hour,
             locale = excluded.locale, time_zone = excluded.time_zone, updated_at = now()`,
          [input.token, input.environment, input.hour, input.locale, input.timeZone],
        );
        return Response.json({ ok: true });
      },
      DELETE: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
        const token = typeof body?.token === "string" ? body.token.trim() : "";
        if (!TOKEN.test(token)) return Response.json({ ok: false }, { status: 400 });
        const sql = await getSql();
        await sql.query("delete from push_devices where token = $1", [token]);
        return Response.json({ ok: true });
      },
    },
  },
});
