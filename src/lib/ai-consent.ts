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
export function requestAIConsent(locale: "es" | "en", kind: "ask" | "compose"): boolean {
  return typeof window !== "undefined" && window.confirm(aiSharingText(locale, kind));
}
