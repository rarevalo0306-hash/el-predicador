import { isThemeId } from "./church.ts";
import type { ThemeId } from "./verses.ts";

/**
 * A "Me gusta" on the verse of the day: which verse, under which theme it was
 * shown, and the day. Kept in the account's saved state, so the owner can
 * learn which themes speak to people.
 */
export type VerseLike = { id: string; theme: ThemeId; day: string };

/** Likes kept per account; the oldest fall off once it is reached. */
export const MAX_LIKES = 400;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Adds the like, or takes it away when that verse is already liked. */
export function toggleLike(list: VerseLike[], like: VerseLike): VerseLike[] {
  if (list.some((item) => item.id === like.id)) return list.filter((item) => item.id !== like.id);
  return [like, ...list].slice(0, MAX_LIKES);
}

/** Rebuilds stored likes field by field, dropping anything malformed. */
export function parseLikes(raw: unknown): VerseLike[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: VerseLike[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const value = row as Record<string, unknown>;
    if (typeof value.id !== "string" || !value.id || value.id.length > 100) continue;
    if (!isThemeId(value.theme) || typeof value.day !== "string" || !DAY.test(value.day)) continue;
    if (seen.has(value.id)) continue;
    seen.add(value.id);
    out.push({ id: value.id, theme: value.theme, day: value.day });
    if (out.length >= MAX_LIKES) break;
  }
  return out;
}

export type ThemeCount = { theme: ThemeId; count: number };

/** Likes per theme, most liked first (ties keep the order first seen). */
export function themeCounts(likes: VerseLike[]): ThemeCount[] {
  const counts = new Map<ThemeId, number>();
  for (const like of likes) counts.set(like.theme, (counts.get(like.theme) ?? 0) + 1);
  return [...counts.entries()]
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}
