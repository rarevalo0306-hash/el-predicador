import { isThemeId } from "./church.ts";
import type { ThemeId } from "./verses.ts";

/**
 * The themes a contact cares about, in the order they were chosen. Contacts
 * saved before several could be chosen carry only `themeId`; everyone gets
 * at least one theme, "amor", as the app always did.
 */
export function recipientThemes(row: { themeIds?: unknown; themeId?: unknown }): ThemeId[] {
  const list = Array.isArray(row.themeIds) ? row.themeIds.filter(isThemeId) : [];
  const unique = [...new Set(list)];
  if (unique.length) return unique;
  return [isThemeId(row.themeId) ? row.themeId : "amor"];
}

/** Adds or removes a theme, never leaving the list empty. */
export function toggleTheme(list: readonly ThemeId[], id: ThemeId): ThemeId[] {
  if (!list.includes(id)) return [...list, id];
  const next = list.filter((item) => item !== id);
  return next.length ? next : [...list];
}

/**
 * The verse for today's message to a contact with several themes: the
 * themes take turns by day, and within one the verse is picked at random.
 */
export function themeForDay(themes: readonly ThemeId[], day: number): ThemeId {
  return themes[((day % themes.length) + themes.length) % themes.length] ?? "amor";
}
