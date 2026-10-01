import { createServerFn } from "@tanstack/react-start";
import type { Locale } from "@/lib/i18n";
import type { DailyBlessing } from "@/lib/blessings";

export type { DailyBlessing } from "@/lib/blessings";

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The blessing in the greeting on Hoy: written by DeepSeek the first time
 * anyone asks for that day and language, then read by everyone. Only today
 * (by the visitor's own date, within a day of the server's) can be asked
 * for. No name ever leaves the device: the app puts it in front.
 */
export const getDailyBlessing = createServerFn({ method: "POST" })
  .validator((data: { day: string; locale?: Locale }) => ({
    day: String(data.day ?? ""),
    locale: (data.locale === "en" ? "en" : "es") as "es" | "en",
  }))
  .handler(async ({ data }): Promise<DailyBlessing | null> => {
    const match = DAY.exec(data.day);
    if (!match) return null;
    const noon = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
    if (Math.abs(noon.getTime() - Date.now()) > 36 * 60 * 60 * 1000) return null;
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { deepseekConfigured } = await import("@/lib/ai/deepseek.server");
    const { writeBlessing } = await import("@/lib/ai/daily.server");
    const { blessingFor } = await import("@/lib/daily-blessing.server");
    return blessingFor(sql, data.day, data.locale, {
      configured: deepseekConfigured(),
      write: () => writeBlessing({ day: data.day, locale: data.locale }),
    });
  });
