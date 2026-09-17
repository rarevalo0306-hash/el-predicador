import type { Locale } from "@/lib/i18n";
import type { ThemeId } from "@/lib/verses";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ChurchInfo = {
  name: string;
  address: string;
  city: string;
  /** Days of week when there is a service (0 = Sunday). */
  serviceDays: Weekday[];
  /** Local time HH:MM */
  serviceTime: string;
  /** Hours before service to remind (1–48). */
  reminderHoursBefore: number;
  note: string;
};

export const EMPTY_CHURCH: ChurchInfo = {
  name: "",
  address: "",
  city: "",
  serviceDays: [0],
  serviceTime: "10:00",
  reminderHoursBefore: 2,
  note: "",
};

export function normalizeChurch(raw: unknown): ChurchInfo {
  if (!raw || typeof raw !== "object") return { ...EMPTY_CHURCH };
  const value = raw as Partial<ChurchInfo>;
  const days = Array.isArray(value.serviceDays)
    ? (value.serviceDays
        .map((d) => Number(d))
        .filter((d): d is Weekday => d >= 0 && d <= 6) as Weekday[])
    : ([0] as Weekday[]);
  const hours = Number(value.reminderHoursBefore);
  return {
    name: typeof value.name === "string" ? value.name : "",
    address: typeof value.address === "string" ? value.address : "",
    city: typeof value.city === "string" ? value.city : "",
    serviceDays: days.length ? [...new Set(days)] : [0],
    serviceTime:
      typeof value.serviceTime === "string" && /^\d{1,2}:\d{2}$/.test(value.serviceTime)
        ? value.serviceTime
        : "10:00",
    reminderHoursBefore: Number.isFinite(hours)
      ? Math.min(48, Math.max(1, Math.round(hours)))
      : 2,
    note: typeof value.note === "string" ? value.note : "",
  };
}

export const WEEKDAY_KEYS = [
  "daySun",
  "dayMon",
  "dayTue",
  "dayWed",
  "dayThu",
  "dayFri",
  "daySat",
] as const;

export function parseServiceTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map((part) => Number(part));
  return {
    hours: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 10,
    minutes: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

/** Next service Date from now, or null if church has no days. */
export function nextServiceAt(church: ChurchInfo, from = new Date()): Date | null {
  if (!church.serviceDays.length) return null;
  const { hours, minutes } = parseServiceTime(church.serviceTime);
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);
    const day = candidate.getDay() as Weekday;
    if (!church.serviceDays.includes(day)) continue;
    if (candidate.getTime() > from.getTime() - 60_000) return candidate;
  }
  return null;
}

export function cultoInviteText(
  church: ChurchInfo,
  locale: Locale,
  personName?: string,
): string {
  const greeting =
    locale === "en"
      ? personName
        ? `Hi ${personName},`
        : "Hi,"
      : personName
        ? `Hola ${personName},`
        : "Hola,";
  const lines = [greeting, ""];
  if (locale === "en") {
    lines.push("I'd love to invite you to our church service.");
  } else {
    lines.push("Te invito con gusto a nuestro culto.");
  }
  if (church.name.trim()) lines.push(church.name.trim());
  const place = [church.address, church.city].filter(Boolean).join(", ");
  if (place) lines.push(place);
  if (church.serviceTime) {
    lines.push(
      locale === "en"
        ? `Service time: ${church.serviceTime}`
        : `Hora del culto: ${church.serviceTime}`,
    );
  }
  if (church.note.trim()) {
    lines.push("", church.note.trim());
  }
  return lines.join("\n");
}

export function isThemeId(value: unknown): value is ThemeId {
  return (
    value === "amor" ||
    value === "fe" ||
    value === "esperanza" ||
    value === "paz" ||
    value === "fortaleza" ||
    value === "consuelo" ||
    value === "gratitud" ||
    value === "sabiduria" ||
    value === "familia" ||
    value === "perdon" ||
    value === "evangelio"
  );
}
