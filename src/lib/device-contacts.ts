import { normalizePhone } from "./phone.ts";

export type DeviceContact = { name: string; phone: string };

/** What `navigator.contacts.select(["name", "tel"])` hands back. */
export type RawDeviceContact = { name?: unknown; tel?: unknown };

type ContactsManager = {
  select: (properties: string[], options?: { multiple?: boolean }) => Promise<RawDeviceContact[]>;
  getProperties?: () => Promise<string[]>;
};

function contactsManager(): ContactsManager | null {
  if (typeof navigator === "undefined") return null;
  const manager = (navigator as Navigator & { contacts?: ContactsManager }).contacts;
  return manager && typeof manager.select === "function" ? manager : null;
}

/**
 * True where the phone can hand us contacts.
 *
 * The Contact Picker API is Chrome-on-Android only — Safari does not implement
 * it, so an iPhone (including an app installed to the home screen, which runs
 * on Safari) never gets here and keeps typing by hand. It also needs a secure
 * context and the top-level page, so it stays hidden inside the preview frame.
 */
export function canPickDeviceContacts(): boolean {
  if (!contactsManager()) return false;
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  return window.top === window.self;
}

/** First usable string in a phone-book field, which arrives as an array. */
function firstString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  for (const entry of value) {
    if (typeof entry === "string" && entry.trim()) return entry.trim();
  }
  return "";
}

/**
 * Turn picked phone-book entries into contacts this app can message.
 *
 * A phone book is messier than our form: entries carry several numbers or
 * none, an empty name, the same number twice under different names. Keep the
 * first number that survives normalization, drop what cannot be messaged, and
 * report the count so the caller can say what was left out instead of failing
 * silently. `skipped` counts entries, not numbers.
 */
export function toDeviceContacts(raw: unknown): {
  contacts: DeviceContact[];
  skipped: number;
} {
  if (!Array.isArray(raw)) return { contacts: [], skipped: 0 };
  const contacts: DeviceContact[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      skipped += 1;
      continue;
    }
    const { name, tel } = entry as RawDeviceContact;
    const numbers = Array.isArray(tel) ? tel : [tel];
    const phone = numbers
      .map((value) => (typeof value === "string" ? normalizePhone(value) : null))
      .find((value): value is string => Boolean(value));
    if (!phone || seen.has(phone)) {
      skipped += 1;
      continue;
    }
    seen.add(phone);
    contacts.push({ name: firstString(name), phone });
  }
  return { contacts, skipped };
}

/** Open the phone's contact picker. Resolves empty when the person cancels. */
export async function pickDeviceContacts(): Promise<{
  contacts: DeviceContact[];
  skipped: number;
}> {
  const manager = contactsManager();
  if (!manager) return { contacts: [], skipped: 0 };
  const picked = await manager.select(["name", "tel"], { multiple: true });
  return toDeviceContacts(picked);
}
