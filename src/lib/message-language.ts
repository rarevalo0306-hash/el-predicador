import type { Locale } from "./i18n";

export const messageLanguageName = (locale: Locale) => (locale === "en" ? "English" : "Español");
export function messageLanguageCopy(locale: Locale) {
  return locale === "es"
    ? {
        label: "Idioma del mensaje",
        hint: "El idioma de envío puede ser diferente al de la app.",
        customHint:
          "Los versículos y las notas prediseñadas cambian de idioma. Revisa las notas que escribas tú; no se traducen automáticamente.",
        customScheduleHint:
          "Escribe el texto personalizado en el idioma elegido. Para cambiar un versículo de idioma, escógelo abajo.",
        theme: "Escoger un mensaje por tema",
        custom: "Texto personalizado",
        verse: "Escoger versículo",
        choose: "Selecciona un versículo",
        loading: "Preparando el mensaje…",
        error: "No se pudo cargar el mensaje en ese idioma. Vuelve a intentarlo.",
        unavailable:
          "Este texto conserva su idioma original. Puedes escoger otro versículo desde Temas.",
      }
    : {
        label: "Message language",
        hint: "The sending language can differ from the app language.",
        customHint:
          "Verses and preset notes change language. Review notes you write yourself; they are not translated automatically.",
        customScheduleHint:
          "Write custom text in the selected language. To change a verse's language, choose it below.",
        theme: "Choose a message by theme",
        custom: "Custom text",
        verse: "Choose a verse",
        choose: "Select a verse",
        loading: "Preparing the message…",
        error: "Could not load the message in that language. Try again.",
        unavailable:
          "This text keeps its original language. You can choose another verse under Themes.",
      };
}
