import { Temporal } from "@js-temporal/polyfill";
import { normalizePhone } from "./phone.ts";

export type MessageChannel = "whatsapp" | "sms";
export type ScheduleInput = {
  id?: string;
  recipientName: string;
  phone: string;
  message: string;
  messageLocale?: "es" | "en";
  verseId?: string;
  channel: MessageChannel;
  days: number[];
  time: string;
  timeZone: string;
  consent: boolean;
};
export type MessageSchedule = ScheduleInput & {
  id: string;
  enabled: boolean;
  nextRunAt: string | null;
  lastStatus: "accepted" | "failed" | "unknown" | "skipped" | "sending" | null;
  lastRunAt: string | null;
  /** The provider's code for the last attempt, and its sentence when it sent one. */
  lastErrorCode?: string | null;
  lastError?: string | null;
};

export function validTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format();
    return Boolean(zone);
  } catch {
    return false;
  }
}

export function validateSchedule(raw: ScheduleInput): ScheduleInput {
  if (!raw || typeof raw !== "object") throw new Error("scheduleInvalid");
  const phone = normalizePhone(String(raw.phone ?? ""));
  if (!phone) throw new Error("contactBadPhone");
  const recipientName = String(raw.recipientName ?? "").trim();
  const message = String(raw.message ?? "").trim();
  if (!recipientName || recipientName.length > 80 || !message || message.length > 1000) {
    throw new Error("scheduleBadMessage");
  }
  if (raw.messageLocale !== undefined && raw.messageLocale !== "es" && raw.messageLocale !== "en")
    throw new Error("scheduleInvalid");
  if (raw.verseId !== undefined && !/^[a-zA-Z0-9-]{1,64}$/.test(raw.verseId))
    throw new Error("scheduleInvalid");
  if (raw.channel !== "whatsapp" && raw.channel !== "sms") throw new Error("scheduleInvalid");
  if (
    !Array.isArray(raw.days) ||
    !raw.days.length ||
    raw.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
  ) {
    throw new Error("scheduleNeedDays");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time)) throw new Error("scheduleBadTime");
  if (!validTimeZone(raw.timeZone)) throw new Error("scheduleBadZone");
  if (raw.id !== undefined && !/^[a-zA-Z0-9-]{1,64}$/.test(raw.id))
    throw new Error("scheduleInvalid");
  return {
    ...raw,
    phone,
    recipientName,
    message,
    messageLocale: raw.messageLocale ?? "es",
    days: [...new Set(raw.days)].sort(),
    consent: raw.consent === true,
  };
}

/** A recurrence is wall-clock time in the selected country, including DST. */
export function nextMessageOccurrence(
  schedule: Pick<ScheduleInput, "days" | "time" | "timeZone">,
  after = new Date(),
): string {
  const instant = Temporal.Instant.from(after.toISOString());
  const start = instant.toZonedDateTimeISO(schedule.timeZone).toPlainDate();
  const [hour, minute] = schedule.time.split(":").map(Number);
  for (let offset = 0; offset <= 7; offset++) {
    const date = start.add({ days: offset });
    if (!schedule.days.includes(date.dayOfWeek % 7)) continue;
    // Spring gap moves forward; fall overlap uses its first occurrence once.
    const candidate = Temporal.ZonedDateTime.from(
      {
        timeZone: schedule.timeZone,
        year: date.year,
        month: date.month,
        day: date.day,
        hour,
        minute,
      },
      { disambiguation: "compatible", overflow: "reject" },
    ).toInstant();
    if (Temporal.Instant.compare(candidate, instant) > 0) return candidate.toString();
  }
  throw new Error("scheduleNeedDays");
}
