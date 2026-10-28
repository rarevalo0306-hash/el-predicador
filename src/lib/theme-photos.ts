import type { ThemeId } from "@/lib/verses";

/** Stock photo (public/images/<name>.jpg) shown for each theme. */
export const THEME_PHOTOS: Record<ThemeId, string> = {
  paz: "peace",
  fortaleza: "strength",
  esperanza: "hope",
  familia: "family",
  jovenes: "youth",
  matrimonios: "marriage",
  amistad: "friendship",
  oracion: "prayer",
  amor: "love",
  fe: "faith",
  gratitud: "gratitude",
  bendicion: "blessing",
  consuelo: "comfort",
  sabiduria: "wisdom",
  perdon: "forgiveness",
  evangelio: "gospel",
};

export function themePhotoUrl(theme: ThemeId) {
  return `/images/${THEME_PHOTOS[theme] ?? "coast"}.jpg`;
}
