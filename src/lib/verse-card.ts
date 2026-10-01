import type { Verse } from "@/lib/verses";

const W = 1080;
const H = 1350;
const PAPER = "#F4EAD6";
const INK = "#221711";
const WINE = "#6B2C38";
const GOLD = "#A67C2D";
const MUTED = "#6E5B45";

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim() === "" ? [""] : paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Inside the double gold frame, above the footer link. */
const TOP = 112;
const BOTTOM = H - 150;
const MAX_WIDTH = W - 200;
const LOGO = 168;
const VERSE_MAX = 64;
const VERSE_MIN = 30;
const VERSE_LEADING = 1.38;

type Block = { height: number; draw: (ctx: CanvasRenderingContext2D, y: number) => void };

function textBlock(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  font: string,
  color: string,
  lineHeight: number,
): Block {
  return {
    height: lines.length * lineHeight,
    draw: (c, y) => {
      c.font = font;
      c.fillStyle = color;
      lines.forEach((line, i) => c.fillText(line, W / 2, y + i * lineHeight));
    },
  };
}

function gap(height: number): Block {
  return { height, draw: () => undefined };
}

/**
 * The shareable image: seal, verse, reference. Everything is measured
 * first and the stack is centred in the frame, so a short verse grows
 * large instead of leaving the bottom half empty, and a long one shrinks
 * (and, past the smallest size, is cut with an ellipsis).
 */
export async function renderVerseCard(
  verse: Verse,
  note?: string,
  fromName?: string,
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 8;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  const logo = await loadImage("/logo.png");

  // Everything but the verse, measured once.
  const head: Block[] = [];
  if (logo) {
    head.push({
      height: LOGO,
      draw: (c, y) => {
        c.save();
        c.beginPath();
        c.arc(W / 2, y + LOGO / 2, LOGO / 2, 0, Math.PI * 2);
        c.closePath();
        c.clip();
        c.drawImage(logo, W / 2 - LOGO / 2, y, LOGO, LOGO);
        c.restore();
      },
    });
    head.push(gap(28));
  }
  head.push(textBlock(ctx, ["THE PREACHER"], "600 26px Figtree, sans-serif", WINE, 30));
  head.push(gap(56));

  const trimmedNote = note?.trim();
  if (trimmedNote) {
    const font = "italic 400 32px Newsreader, Georgia, serif";
    ctx.font = font;
    const noteLines = wrapLines(ctx, trimmedNote, MAX_WIDTH).slice(0, 4);
    head.push(textBlock(ctx, noteLines, font, MUTED, 44));
    head.push(gap(40));
  }

  const tail: Block[] = [gap(44), rule(), gap(36)];
  tail.push(textBlock(ctx, [verse.ref.toUpperCase()], "600 32px Figtree, sans-serif", WINE, 38));
  if (verse.source) {
    tail.push(gap(10));
    tail.push(textBlock(ctx, [verse.source], "400 24px Figtree, sans-serif", MUTED, 30));
  }
  const name = fromName?.trim();
  if (name) {
    tail.push(gap(32));
    tail.push(textBlock(ctx, [`— ${name}`], "italic 500 30px Newsreader, Georgia, serif", INK, 36));
  }

  const fixed = [...head, ...tail].reduce((sum, b) => sum + b.height, 0);
  const room = BOTTOM - TOP - fixed;

  // The largest verse size that fits; at the smallest, cut the last line.
  const body = verse.text.replace(/^«|»$/g, "").trim();
  let fontSize = VERSE_MAX;
  let lines: string[] = [];
  for (; fontSize >= VERSE_MIN; fontSize -= 2) {
    ctx.font = `500 ${fontSize}px Newsreader, Georgia, serif`;
    lines = wrapLines(ctx, body, MAX_WIDTH);
    if (lines.length * fontSize * VERSE_LEADING <= room) break;
  }
  fontSize = Math.max(fontSize, VERSE_MIN);
  const lineHeight = Math.round(fontSize * VERSE_LEADING);
  const fits = Math.max(1, Math.floor(room / lineHeight));
  if (lines.length > fits) {
    lines = lines.slice(0, fits);
    lines[fits - 1] = `${lines[fits - 1].replace(/[\s.,;:…]*$/, "")}…`;
  }
  const verseBlock = textBlock(
    ctx,
    lines,
    `500 ${fontSize}px Newsreader, Georgia, serif`,
    INK,
    lineHeight,
  );

  const blocks = [...head, verseBlock, ...tail];
  const total = blocks.reduce((sum, b) => sum + b.height, 0);
  let y = TOP + Math.max(0, (BOTTOM - TOP - total) / 2);
  for (const block of blocks) {
    block.draw(ctx, y);
    y += block.height;
  }

  ctx.fillStyle = GOLD;
  ctx.font = "500 22px Figtree, sans-serif";
  ctx.fillText("thepreacher.app", W / 2, H - 112);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("blob"));
      else resolve(blob);
    }, "image/png");
  });
}

/** A short gold rule with a diamond, between the verse and its reference. */
function rule(): Block {
  return {
    height: 12,
    draw: (c, y) => {
      const mid = y + 6;
      c.strokeStyle = GOLD;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(W / 2 - 72, mid);
      c.lineTo(W / 2 - 14, mid);
      c.moveTo(W / 2 + 14, mid);
      c.lineTo(W / 2 + 72, mid);
      c.stroke();
      c.fillStyle = GOLD;
      c.beginPath();
      c.moveTo(W / 2, mid - 6);
      c.lineTo(W / 2 + 6, mid);
      c.lineTo(W / 2, mid + 6);
      c.lineTo(W / 2 - 6, mid);
      c.closePath();
      c.fill();
    },
  };
}

export async function verseCardFile(verse: Verse, note?: string, fromName?: string): Promise<File> {
  const blob = await renderVerseCard(verse, note, fromName);
  const slug = verse.ref.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return new File([blob], `the-preacher-${slug || "verso"}.png`, {
    type: "image/png",
  });
}
