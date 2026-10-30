/** Ask before sending free-form questions or personal details to third-party AI. */
export function aiSharingText(locale: "es" | "en", kind: "ask" | "compose"): string {
  if (locale === "es")
    return kind === "ask"
      ? "Para responder, se enviarán a DeepSeek (un proveedor externo de IA) tu pregunta, las referencias bíblicas y el historial de esta conversación. No incluyas nombres, teléfonos ni información privada de otras personas. ¿Permites enviar este contenido a DeepSeek?"
      : "Para redactar, se enviarán a DeepSeek (un proveedor externo de IA) el caso, las referencias y los detalles que escribiste sobre la persona. No incluyas nombres, teléfonos ni información privada sin su permiso. ¿Permites enviar este contenido a DeepSeek?";
  return kind === "ask"
    ? "To answer, your question, Bible references and this conversation's history will be sent to DeepSeek (a third-party AI provider). Do not include names, phone numbers or other people's private information. Do you allow this content to be sent to DeepSeek?"
    : "To write the message, the case, passages and details you entered about the person will be sent to DeepSeek (a third-party AI provider). Do not include names, phone numbers or private information without their permission. Do you allow this content to be sent to DeepSeek?";
}
// Increment when the provider or disclosed purposes/data change.
export const AI_CONSENT_VERSION = "deepseek-v1";
const consentKey = (userId: string, kind: "ask" | "compose") =>
  `preacher-ai-consent:${AI_CONSENT_VERSION}:${encodeURIComponent(userId)}:${kind}`;

export function revokeAIConsent(userId: string): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    for (const kind of ["ask", "compose"] as const)
      window.localStorage.removeItem(consentKey(userId, kind));
    return true;
  } catch {
    return false;
  }
}

export function requestAIConsent(
  locale: "es" | "en",
  kind: "ask" | "compose",
  userId?: string,
): boolean {
  if (typeof window === "undefined" || !userId) return false;
  const key = consentKey(userId, kind);
  try {
    if (window.localStorage.getItem(key) === "accepted") return true;
  } catch {
    /* Storage unavailable: ask explicitly for this request. */
  }
  const remember =
    locale === "es"
      ? " Recordaremos tu permiso en este dispositivo para este uso. Puedes retirarlo en Ajustes > Privacidad de IA."
      : " We will remember your permission on this device for this use. You can withdraw it in Settings > AI privacy.";
  if (!window.confirm(aiSharingText(locale, kind) + remember)) return false;
  try {
    window.localStorage.setItem(key, "accepted");
  } catch {
    /* This request is authorized; future requests must ask again. */
  }
  return true;
}
