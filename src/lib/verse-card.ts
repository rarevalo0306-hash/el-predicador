import type { Verse } from "@/lib/verses";

const W = 1080;
const H = 1350;
const PAPER = "#F4EAD6";
const INK = "#221711";
const WINE = "#6B2C38";
const GOLD = "#A67C2D";

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
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

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 8;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  const logo = await loadImage("/logo.svg?v=5");
  let y = 120;
  if (logo) {
    const size = 128;
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, W / 2 - size / 2, y, size, size);
    ctx.restore();
    y += size + 36;
  }

  ctx.fillStyle = WINE;
  ctx.font = "600 28px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("THE PREACHER", W / 2, y);
  y += 56;

  const maxWidth = W - 180;
  const trimmedNote = note?.trim();
  if (trimmedNote) {
    ctx.fillStyle = "#6E5B45";
    ctx.font = "500 28px Figtree, sans-serif";
    ctx.textAlign = "center";
    const noteLines = wrapLines(ctx, trimmedNote, maxWidth).slice(0, 4);
    for (const line of noteLines) {
      ctx.fillText(line, W / 2, y);
      y += 40;
    }
    y += 24;
  }

  const body = verse.text.replace(/^«|»$/g, "").trim();
  let fontSize = 48;
  let bodyLines: string[] = [];
  const bottomLimit = H - 280;
  while (fontSize >= 28) {
    ctx.font = `500 ${fontSize}px Newsreader, Georgia, serif`;
    bodyLines = wrapLines(ctx, body, maxWidth);
    const block = bodyLines.length * (fontSize * 1.35);
    if (y + block < bottomLimit) break;
    fontSize -= 2;
  }
  const maxBody = Math.max(4, Math.floor((bottomLimit - y) / (fontSize * 1.35)));
  const shown = bodyLines.slice(0, maxBody);
  if (shown.length < bodyLines.length && shown.length > 0) {
    shown[shown.length - 1] = `${shown[shown.length - 1].replace(/[.…]*$/, "")}…`;
  }

  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.font = `500 ${fontSize}px Newsreader, Georgia, serif`;
  for (const line of shown) {
    ctx.fillText(line, W / 2, y);
    y += fontSize * 1.35;
  }

  y += 36;
  ctx.fillStyle = WINE;
  ctx.font = "600 30px Figtree, sans-serif";
  ctx.fillText(verse.ref.toUpperCase(), W / 2, y);

  if (verse.source) {
    y += 40;
    ctx.fillStyle = "#6E5B45";
    ctx.font = "400 24px Figtree, sans-serif";
    ctx.fillText(verse.source, W / 2, y);
  }

  const name = fromName?.trim();
  if (name) {
    y += 48;
    ctx.fillStyle = INK;
    ctx.font = "italic 500 28px Newsreader, Georgia, serif";
    ctx.fillText(name, W / 2, y);
  }

  ctx.fillStyle = GOLD;
  ctx.font = "500 22px Figtree, sans-serif";
  ctx.fillText("thepreacher.app", W / 2, H - 88);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("blob"));
      else resolve(blob);
    }, "image/png");
  });
}

export async function verseCardFile(
  verse: Verse,
  note?: string,
  fromName?: string,
): Promise<File> {
  const blob = await renderVerseCard(verse, note, fromName);
  const slug = verse.ref.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return new File([blob], `the-preacher-${slug || "verso"}.png`, {
    type: "image/png",
  });
}
