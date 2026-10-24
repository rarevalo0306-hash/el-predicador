/** Decode documented JSON content blocks, retaining each text fragment verbatim.
 * Numbers, headings and notes are presentation metadata, not Scripture text.
 * Reject ambiguous/unassigned content rather than silently dropping Scripture.
 */
export function apiBibleVerses(content: unknown): { n: number; text: string }[] {
  if (!Array.isArray(content)) throw new Error("bible_content_invalid");
  const verses = new Map<number, string>();
  let current: number | undefined;
  function walk(value: unknown, inherited?: number) {
    if (!value || typeof value !== "object") throw new Error("bible_content_invalid");
    const node = value as {
      name?: string;
      type?: string;
      text?: string;
      attrs?: Record<string, unknown>;
      items?: unknown[];
    };
    if (node.name === "note" || /^(s\d*|ms\d*|mt\d*|r|d)$/.test(String(node.attrs?.style ?? "")))
      return;
    if (node.name === "verse") {
      const number = String(node.attrs?.number ?? "");
      if (!/^\d+$/.test(number)) throw new Error("bible_content_invalid");
      current = Number(number);
      return; // number marker, not the words of the verse
    }
    const id = node.attrs?.verseId;
    const n = typeof id === "string" ? Number(id.split(".").at(-1)) : inherited;
    if (node.type === "text" && typeof node.text === "string") {
      const number = n ?? current;
      if (!number) {
        if (node.text.trim()) throw new Error("bible_content_invalid");
        return;
      }
      verses.set(number, (verses.get(number) ?? "") + node.text);
    }
    if (node.items) for (const child of node.items) walk(child, n);
  }
  for (const node of content) walk(node);
  const result = [...verses].map(([n, text]) => ({ n, text }));
  if (!result.length || result.some((v) => !v.text.trim()))
    throw new Error("bible_content_invalid");
  return result;
}
export const BIBLE_CACHE_MS = 28 * 24 * 60 * 60 * 1000;
export const BIBLE_UNAVAILABLE =
  "La lectura LBLA no está disponible ahora. Intenta más tarde; tus referencias siguen guardadas.";
export const BIBLE_LIMIT =
  "Se alcanzó el límite de lecturas del servicio. Puedes seguir consultando capítulos recientes disponibles; vuelve a intentar más tarde.";
