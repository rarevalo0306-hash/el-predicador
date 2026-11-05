import type { Sql } from "@/lib/db";
import { parsePayload } from "@/lib/user-state-parse";
import { tasteNote, tasteProfile } from "@/lib/taste";
import { localizedTheme } from "@/lib/verses";

/** The taste line for one account, read from the likes stored in its saved state. */
export async function tasteFor(sql: Sql, userId: string, locale: "es" | "en"): Promise<string> {
  const rows = await sql<{ payload: string }>`
    select payload from preacher_state where user_id = ${userId} limit 1`;
  const likes = parsePayload(rows[0]?.payload)?.likes ?? [];
  return tasteNote(tasteProfile(likes), locale, (id) => localizedTheme(id, locale).name);
}
