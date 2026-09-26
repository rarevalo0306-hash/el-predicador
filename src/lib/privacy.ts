/**
 * Showing less of other people's details. Used on screens that list many
 * people at once; the full value stays one tap away ("Mostrar") for the
 * person who owns it, and never leaves the server for those who should not
 * see it.
 */

/** "+1 ••• ••• ••01": the country code and the last two digits. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  const country = phone.trim().startsWith("+1")
    ? "1"
    : phone.trim().startsWith("+")
      ? digits.slice(0, digits.length > 10 ? digits.length - 10 : 1)
      : "";
  const tail = digits.slice(-2);
  return `${country ? `+${country} ` : ""}••• ••• ••${tail}`;
}

/** "Ana María López" → "Ana M. L.": the first name and initials. */
export function maskName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const [first, ...rest] = words;
  return [first, ...rest.map((word) => `${Array.from(word)[0]?.toUpperCase() ?? ""}.`)].join(" ");
}

/**
 * A CSV cell that spreadsheets will not run as a formula: values starting
 * with = + - @ (or a tab/return) get a leading apostrophe, as OWASP advises.
 * Values come from a public form, so this matters.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
