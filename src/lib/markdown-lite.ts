/**
 * The small slice of Markdown an answer may use: paragraphs, headings,
 * bullet and numbered lists, quotations, and **bold** / *italic* inside
 * them. Nothing else is interpreted, so a stray "<" or a link is shown as
 * written, never rendered.
 */
export type Inline = { kind: "text" | "bold" | "italic"; text: string };
export type Block =
  | { kind: "heading"; level: number; inlines: Inline[] }
  | { kind: "paragraph"; inlines: Inline[] }
  | { kind: "quote"; inlines: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "rule" };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*(#{1,6})\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

export function parseInlines(text: string): Inline[] {
  const out: Inline[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|__([^_]+)__|_([^_\n]+)_/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push({ kind: "text", text: text.slice(last, match.index) });
    if (match[1] !== undefined || match[3] !== undefined) {
      out.push({ kind: "bold", text: match[1] ?? match[3] });
    } else {
      out.push({ kind: "italic", text: match[2] ?? match[4] });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

export function parseMarkdownLite(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", inlines: parseInlines(paragraph.join("\n")) });
      paragraph = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      blocks.push({ kind: "quote", inlines: parseInlines(quote.join("\n")) });
      quote = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({
        kind: "list",
        ordered: list.ordered,
        items: list.items.map((item) => parseInlines(item)),
      });
      list = null;
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushQuote();
    flushList();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushAll();
      continue;
    }
    if (RULE.test(line)) {
      flushAll();
      blocks.push({ kind: "rule" });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      flushAll();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        inlines: parseInlines(heading[2].trim()),
      });
      continue;
    }
    const quoted = QUOTE.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1].trim());
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1].trim());
      continue;
    }
    if (list) {
      // A wrapped continuation of the last item.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    flushQuote();
    paragraph.push(line.trim());
  }
  flushAll();
  return blocks;
}

/**
 * The same text as a plain message for WhatsApp, SMS or e-mail: headings,
 * quote marks, rules and bold/italic markers are dropped and the words kept,
 * so nobody receives "##" or "**".
 */
export function messageText(source: string): string {
  return source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((raw) => {
      const line = raw.trimEnd();
      if (RULE.test(line)) return "";
      const heading = HEADING.exec(line);
      const quoted = QUOTE.exec(line);
      const text = heading ? heading[2] : quoted ? quoted[1] : line;
      return parseInlines(text.trim())
        .map((part) => part.text)
        .join("");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Whether a text uses this Markdown (headings, quotations or rules). */
export function hasMarkdown(source: string): boolean {
  return source.split("\n").some((line) => HEADING.test(line) || QUOTE.test(line) || RULE.test(line));
}
