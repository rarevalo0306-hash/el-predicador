import type { Verse } from "./verses";
/** Noncommercial LBLA edition. No implicit switch/env var may enable AI. */
export function requireBibleAIPermission(): void {
  throw new Error(
    "AI desactivada: la licencia de LBLA no permite enviar su texto a modelos de IA.",
  );
}
/** Keep reference metadata, not publisher text, in user/cloud/offline storage. */
export function referenceOnly(verse: Verse): Verse {
  return { id: verse.id, ref: verse.ref, book: verse.book, themes: verse.themes ?? [], text: "" };
}
export function referenceMemory(value: Record<string, Verse> | undefined): Record<string, Verse> {
  return Object.fromEntries(
    Object.entries(value ?? {})
      .filter(([, v]) => v && typeof v.id === "string")
      .map(([id, v]) => [id, referenceOnly(v)]),
  );
}
