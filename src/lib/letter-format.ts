/**
 * A letter is plain text with blank lines between blocks. This turns it into
 * blocks a screen can lay out: a short line on its own is a heading, a block
 * that opens with a scripture reference is a quotation, the rest are
 * paragraphs whose line breaks are kept.
 */
export type LetterBlock =
  | { kind: "heading"; text: string }
  | { kind: "quote"; ref: string; lines: string[] }
  | { kind: "paragraph"; lines: string[] };

const REFERENCE = /^(\d\s)?\p{Lu}[\p{L}.]*(\s\p{L}+)?\s\d+(:\d+(-\d+)?)?$/u;
const HEADING_END = /[.:;,»”"…!?]$/;

export function letterBlocks(letter: string): LetterBlock[] {
  return letter
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .map((lines): LetterBlock => {
      const [first, ...rest] = lines;
      if (lines.length === 1 && first.length <= 80 && !HEADING_END.test(first)) {
        return { kind: "heading", text: first };
      }
      if (rest.length > 0 && REFERENCE.test(first)) {
        return { kind: "quote", ref: first, lines: rest };
      }
      return { kind: "paragraph", lines };
    });
}
