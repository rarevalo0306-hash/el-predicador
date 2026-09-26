import type { ThemeId } from "./verses.ts";
import { recipientThemes } from "./recipient-themes.ts";

/** What the Gente list needs of a contact. */
export type PersonRow = {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  channel?: "whatsapp" | "sms";
  dailyEnabled?: boolean;
  cultoEnabled?: boolean;
  themeId?: ThemeId;
  themeIds?: ThemeId[];
};

/** One filter at a time, next to the search. */
export type PeopleFilter = "all" | "whatsapp" | "sms" | "daily" | "culto";

export const PEOPLE_FILTERS: readonly PeopleFilter[] = ["all", "whatsapp", "sms", "daily", "culto"];

/** How many contacts show at first, and how many more each "Mostrar más" adds. */
export const PEOPLE_PAGE = 20;

/** Lower case, without accents, so "jose" finds "José". */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function matchesFilter(row: PersonRow, filter: PeopleFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "whatsapp":
      // Contacts saved before the choice existed are reached by WhatsApp.
      return (row.channel ?? "whatsapp") === "whatsapp";
    case "sms":
      return row.channel === "sms";
    case "daily":
      return Boolean(row.dailyEnabled);
    case "culto":
      return Boolean(row.cultoEnabled);
  }
}

const PHONE_LIKE = /^[\d\s()+.-]+$/;
const digitsOf = (text: string) => text.replace(/\D/g, "");

/**
 * Whether a contact matches what was typed. A number typed on its own
 * ("+1 (201) 555") is looked for in the phone, from three digits. Otherwise
 * every word must match: letters in the name or the notes (accents and case
 * ignored), digits (three or more) in the phone, so "jose 555" finds only
 * José's numbers.
 */
export function matchesSearch(row: PersonRow, query: string): boolean {
  if (!query.trim()) return true;
  const phone = digitsOf(row.phone);
  if (PHONE_LIKE.test(query.trim())) {
    const digits = digitsOf(query);
    return digits.length >= 3 && phone.includes(digits);
  }
  const text = fold(`${row.name} ${row.notes ?? ""}`);
  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => {
      if (text.includes(word)) return true;
      const digits = digitsOf(word);
      return PHONE_LIKE.test(word) && digits.length >= 3 && phone.includes(digits);
    });
}

export function filterPeople<T extends PersonRow>(
  rows: readonly T[],
  query: string,
  filter: PeopleFilter,
  theme: ThemeId | "all" = "all",
): T[] {
  return rows.filter(
    (row) =>
      matchesFilter(row, filter) &&
      (theme === "all" || recipientThemes(row).includes(theme)) &&
      matchesSearch(row, query),
  );
}

/** How many contacts each filter would show, for the counts on the chips. */
export function filterCounts(rows: readonly PersonRow[]): Record<PeopleFilter, number> {
  const counts = { all: 0, whatsapp: 0, sms: 0, daily: 0, culto: 0 };
  for (const row of rows) {
    for (const filter of PEOPLE_FILTERS) if (matchesFilter(row, filter)) counts[filter] += 1;
  }
  return counts;
}

/** The themes at least one contact follows, in the app's theme order. */
export function themesInUse(rows: readonly PersonRow[], order: readonly ThemeId[]): ThemeId[] {
  const used = new Set(rows.flatMap((row) => recipientThemes(row)));
  return order.filter((id) => used.has(id));
}
