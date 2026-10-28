import type { Sql } from "../db";
import {
  isDeadToken,
  sendApns,
  type ApnsEnvironment,
  type ApnsPayload,
  type ApnsTransport,
} from "./apns.server.ts";

export type PushDevice = {
  token: string;
  environment: ApnsEnvironment;
  hour: number;
  locale: "es" | "en";
  time_zone: string;
  last_sent_day: string | null;
};

/** The device's local calendar day and hour, or null for an unknown time zone. */
export function localDayAndHour(timeZone: string, now: Date) {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(now)
        .map((part) => [part.type, part.value]),
    );
    return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
  } catch {
    return null;
  }
}

/** Devices whose chosen hour is now in their own time zone and not yet served today. */
export function dueDevices(devices: PushDevice[], now: Date) {
  return devices.flatMap((device) => {
    const local = localDayAndHour(device.time_zone, now);
    if (!local || local.hour !== device.hour || device.last_sent_day === local.day) return [];
    return [{ device, day: local.day }];
  });
}

/** What today's reminder says: only the reference, never Scripture text. */
export type DailyMessage = (day: string, locale: "es" | "en") => { ref: string; url: string };

export function dailyPayload(
  locale: "es" | "en",
  message: { ref: string; url: string },
): ApnsPayload {
  return {
    aps: {
      alert: {
        title: locale === "en" ? "Your word for today" : "Tu palabra de hoy",
        body:
          locale === "en" ? `${message.ref} · Tap to read it` : `${message.ref} · Toca para leerlo`,
      },
      sound: "default",
      "thread-id": "daily-verse",
    },
    url: message.url,
  };
}

export async function runDailyPush(
  sql: Sql,
  now: Date,
  message: DailyMessage,
  transport: ApnsTransport,
  env: Record<string, string | undefined> = process.env,
) {
  const devices = await sql.query<PushDevice>(
    "select token, environment, hour, locale, time_zone, last_sent_day from push_devices",
  );
  const due = dueDevices(devices, now);
  let sent = 0;
  let removed = 0;
  for (const { device, day } of due) {
    const [result] = await sendApns(
      [device],
      dailyPayload(device.locale, message(day, device.locale)),
      transport,
      env,
    );
    if (!result) continue;
    if (result.status === 200) {
      sent++;
      await sql.query("update push_devices set last_sent_day = $2 where token = $1", [
        device.token,
        day,
      ]);
    } else if (isDeadToken(result)) {
      removed++;
      await sql.query("delete from push_devices where token = $1", [device.token]);
    } else {
      console.warn("[push] delivery failed", { status: result.status, reason: result.reason });
    }
  }
  return { due: due.length, sent, removed };
}

const TOKEN = /^[0-9a-f]{64,200}$/i;

export type DeviceInput = {
  token: string;
  hour: number;
  locale: "es" | "en";
  timeZone: string;
  environment: ApnsEnvironment;
};

/** Validates what the iPhone app sends; null when anything is off. */
export function parseDeviceInput(body: unknown): DeviceInput | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  const token = typeof value.token === "string" ? value.token.trim() : "";
  const hour = Number(value.hour);
  const locale = value.locale === "en" ? "en" : "es";
  const timeZone = typeof value.timeZone === "string" ? value.timeZone.trim() : "";
  const environment = value.environment === "sandbox" ? "sandbox" : "production";
  if (!TOKEN.test(token) || !Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!timeZone || timeZone.length > 64 || !localDayAndHour(timeZone, new Date())) return null;
  return { token, hour, locale, timeZone, environment };
}
