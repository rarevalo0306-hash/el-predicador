import { SITE } from "../legal/site.ts";

/**
 * Carriers expect every SMS from a registered campaign to say who sends it,
 * and the recipient to be told how to stop. The app's own message carries
 * neither — a verse, a note, a signature — so the sender adds this line to
 * each scheduled SMS. WhatsApp is not touched: its wording is an approved
 * template, and STOP is handled by the platform there.
 */
export const SMS_FOOTER: Record<"es" | "en", string> = {
  es: `${SITE.name} · Responde STOP para cancelar`,
  en: `${SITE.name} · Reply STOP to opt out`,
};

export function withSmsFooter(message: string, locale: "es" | "en" = "es"): string {
  return `${message.trimEnd()}\n\n${SMS_FOOTER[locale]}`;
}
