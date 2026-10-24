/** Metadata only; never expands gaps in a saved noncontiguous selection. */
export function parseVerseSelection(
  value: string,
): { from: number; to: number; selected?: number[] } | null {
  if (!/^\d+(?:\s*[-–—]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–—]\s*\d+)?)*$/.test(value)) return null;
  const parts = value.split(",");
  const selected = new Set<number>();
  for (const part of parts) {
    const [from, end] = part
      .trim()
      .split(/\s*[-–—]\s*/)
      .map(Number);
    const to = end ?? from;
    if (!Number.isInteger(from) || from < 1 || to < from || to > 176) return null;
    for (let n = from; n <= to; n++) selected.add(n);
  }
  const numbers = [...selected].sort((a, b) => a - b);
  return {
    from: numbers[0]!,
    to: numbers.at(-1)!,
    ...(parts.length > 1 ? { selected: numbers } : {}),
  };
}
export function selectedVerseText(
  verses: { n: number; text: string }[],
  selection: { from: number; to: number; selected?: number[] },
) {
  const wanted =
    selection.selected ??
    Array.from({ length: selection.to - selection.from + 1 }, (_, i) => selection.from + i);
  const byNumber = new Map(verses.map((v) => [v.n, v.text]));
  if (wanted.some((n) => !byNumber.has(n))) return null;
  return wanted.map((n) => byNumber.get(n)!).join(" ");
}
