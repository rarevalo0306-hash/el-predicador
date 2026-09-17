import { normalizePhone } from "@/lib/phone";
import { todayKey } from "@/lib/verses";
import type { Recipient } from "@/lib/store";
import { nextServiceAt, type ChurchInfo } from "@/lib/church";

export type DueDaily = {
  kind: "daily";
  recipient: Recipient;
};

export type DueCulto = {
  kind: "culto";
  recipient: Recipient;
  serviceAt: Date;
};

export type DueItem = DueDaily | DueCulto;

/** Contacts due for a daily theme message at this local hour. */
export function dueDailyRecipients(
  recipients: Recipient[],
  hour: number,
  now = new Date(),
): DueDaily[] {
  const today = todayKey(now);
  const currentHour = now.getHours();
  return recipients
    .filter((row) => {
      if (!row.dailyEnabled) return false;
      if (!normalizePhone(row.phone)) return false;
      const targetHour = Number.isFinite(row.dailyHour) ? row.dailyHour! : hour;
      if (currentHour < targetHour) return false;
      if (row.lastDailySentDate === today) return false;
      return true;
    })
    .map((recipient) => ({ kind: "daily" as const, recipient }));
}

/** Contacts due for a culto reminder (within reminder window before next service). */
export function dueCultoRecipients(
  recipients: Recipient[],
  church: ChurchInfo,
  now = new Date(),
): DueCulto[] {
  const serviceAt = nextServiceAt(church, now);
  if (!serviceAt) return [];
  const msBefore = church.reminderHoursBefore * 60 * 60 * 1000;
  const windowStart = serviceAt.getTime() - msBefore;
  if (now.getTime() < windowStart || now.getTime() > serviceAt.getTime()) {
    return [];
  }
  const stamp = serviceAt.toISOString().slice(0, 10);
  return recipients
    .filter((row) => {
      if (!row.cultoEnabled) return false;
      if (!normalizePhone(row.phone)) return false;
      if (row.lastCultoSentDate === stamp) return false;
      return true;
    })
    .map((recipient) => ({ kind: "culto" as const, recipient, serviceAt }));
}

export function allDueItems(
  recipients: Recipient[],
  church: ChurchInfo,
  dailyHour: number,
  now = new Date(),
): DueItem[] {
  return [
    ...dueDailyRecipients(recipients, dailyHour, now),
    ...dueCultoRecipients(recipients, church, now),
  ];
}
