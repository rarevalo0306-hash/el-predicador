import { parsePhoneNumberFromString } from "libphonenumber-js/min";

/** E.164 for storage and delivery. Old local numbers default to the US. */
export function normalizePhone(value: string): string | null {
  const text = value.trim();
  if (!text || text.length > 50 || !/^\+?[\d\s().-]+$/.test(text)) return null;
  const input = text.startsWith("00") ? `+${text.slice(2)}` : text;
  const number = parsePhoneNumberFromString(input, "US");
  if (number?.isPossible() && !number.ext) return number.number;
  // Earlier versions stored international numbers with the '+' removed.
  if (!input.startsWith("+")) {
    const legacy = parsePhoneNumberFromString(`+${input.replace(/\D/g, "")}`);
    if (legacy?.isPossible()) return legacy.number;
  }
  return null;
}

/** Keep incomplete legacy contacts visible so the owner can correct them. */
export function restorePhone(value: string): string {
  return normalizePhone(value) ?? value.replace(/[^\d+]/g, "");
}

export function formatPhone(value: string): string {
  const normalized = normalizePhone(value);
  return normalized ? parsePhoneNumberFromString(normalized)!.formatInternational() : value;
}

function deliveryNumber(phone?: string): string {
  if (!phone?.trim()) return "";
  const number = normalizePhone(phone);
  if (!number) throw new Error("phone");
  return number;
}

export function whatsAppUrl(text: string, phone?: string): string {
  const digits = deliveryNumber(phone).replace(/^\+/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function smsUrl(text: string, phone?: string): string {
  return `sms:${deliveryNumber(phone)}?&body=${encodeURIComponent(text)}`;
}
