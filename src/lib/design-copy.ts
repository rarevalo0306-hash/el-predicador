import type { Locale } from "./i18n";

const es = {
  themesTitle: "Una palabra para cada momento.",
  themesSub: "Explora por tema.",
  allThemes: "Todos los temas",
  moreThemes: "Ver todos los temas",
  fewerThemes: "Ver menos temas",
  bibleTitle: "Tu Biblia, a mano.",
  bibleSub: "La Biblia de las Américas · Español",
  peopleTitle: "Cerca de tu gente.",
  peopleSub: "Acompaña, comparte y recuerda lo que importa.",
  peopleEmptyTitle: "Empieza por una persona",
  savedTitle: "Palabras para volver.",
  unavailableComparison:
    "Comparación retirada. Consulta las referencias en La Biblia de las Américas (LBLA).",
};
const en: Record<keyof typeof es, string> = {
  themesTitle: "A word for every moment.",
  themesSub: "Explore by theme.",
  allThemes: "All themes",
  moreThemes: "View all themes",
  fewerThemes: "Show fewer themes",
  bibleTitle: "Your Bible, close at hand.",
  bibleSub: "La Biblia de las Américas · Spanish",
  peopleTitle: "Close to your people.",
  peopleSub: "Encourage, share and remember what matters.",
  peopleEmptyTitle: "Start with one person",
  savedTitle: "Words to return to.",
  unavailableComparison:
    "Comparison removed. Look up references in La Biblia de las Américas (LBLA).",
};
export const designCopy = (locale: Locale) => (locale === "en" ? en : es);
