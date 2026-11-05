import { themeCounts, type VerseLike } from "./likes.ts";
import type { ThemeId } from "./verses.ts";

/**
 * What the app has learned about a person from their "Me gusta". It is
 * worked out here, in the app's own code, from the likes stored in the
 * account — never kept inside an AI — so it stays with the app whichever
 * AI answers. Only the theme names in `tasteNote` are ever sent to one.
 */
export type TasteProfile = {
  /** The themes they like most, most liked first (at most three). */
  themes: ThemeId[];
  /** How many likes the profile rests on. */
  likes: number;
};

/** Likes needed before the app says anything about someone's taste. */
export const MIN_LIKES = 2;

export function tasteProfile(likes: VerseLike[]): TasteProfile | null {
  if (likes.length < MIN_LIKES) return null;
  return {
    themes: themeCounts(likes)
      .slice(0, 3)
      .map((row) => row.theme),
    likes: likes.length,
  };
}

function joined(names: string[], locale: "es" | "en") {
  if (names.length < 2) return names[0] ?? "";
  const last = names[names.length - 1]!;
  return `${names.slice(0, -1).join(", ")} ${locale === "en" ? "and" : "y"} ${last}`;
}

/**
 * One line for the AI's instructions: which themes speak to this person, and
 * how to use that. Empty when there is nothing to say yet.
 */
export function tasteNote(
  profile: TasteProfile | null,
  locale: "es" | "en",
  themeName: (id: ThemeId) => string,
): string {
  if (!profile?.themes.length) return "";
  const names = joined(profile.themes.map(themeName), locale);
  return locale === "en"
    ? `About this person: the daily verses they marked "Like" are mostly about ${names}. When it fits the question, lean on examples and verses from those themes; never mention that you know this, and do not force it when the question is about something else.`
    : `Sobre esta persona: los versículos del día que marcó con «Me gusta» son sobre todo de ${names}. Cuando encaje con la pregunta, apóyate en ejemplos y versículos de esos temas; nunca digas que lo sabes y no lo fuerces si la pregunta trata de otra cosa.`;
}
