import type { Verse } from "@/lib/verses";
import { copyText, tryNativeShare } from "@/lib/share";

export type FontScale = 0 | 1 | 2 | 3;

export const FONT_SCALE_STEPS: FontScale[] = [0, 1, 2, 3];

/** Reader sizes: normal → larger. Applied as CSS --reader-size. */
export const FONT_SCALE_REM: Record<FontScale, string> = {
  0: "1.05rem",
  1: "1.2rem",
  2: "1.4rem",
  3: "1.65rem",
};

export function clampFontScale(value: unknown): FontScale {
  const n = Number(value);
  if (n === 0 || n === 1 || n === 2 || n === 3) return n;
  return 1;
}

export function applyFontScale(scale: FontScale) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(
    "--reader-size",
    FONT_SCALE_REM[scale],
  );
  document.documentElement.dataset.fontScale = String(scale);
}

/** Collapse sorted verse numbers into "16-18" / "16, 18" / "16-18, 20". */
export function formatVerseRange(numbers: number[]): string {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  if (!sorted.length) return "";
  const parts: string[] = [];
  let start = sorted[0]!;
  let prev = sorted[0]!;
  for (let i = 1; i < sorted.length; i += 1) {
    const n = sorted[i]!;
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? String(start) : `${start}-${prev}`);
    start = n;
    prev = n;
  }
  parts.push(start === prev ? String(start) : `${start}-${prev}`);
  return parts.join(", ");
}

export function combineVerses(
  verses: Verse[],
  bookAbbr: string,
  chapter: number,
): Verse | null {
  if (!verses.length) return null;
  const numbers = verses
    .map((v) => Number(v.id.split("-").at(-1)))
    .filter((n) => Number.isFinite(n) && n > 0);
  const range = formatVerseRange(numbers);
  const text = verses
    .map((v) => {
      const n = v.id.split("-").at(-1);
      return `${n} ${v.text}`;
    })
    .join("\n");
  const first = verses[0]!;
  return {
    ...first,
    id: `${first.id.split("-").slice(0, -1).join("-")}-range-${range.replace(/[^\d,-]/g, "")}`,
    ref: `${bookAbbr} ${chapter}:${range}`,
    text,
  };
}

export async function shareAppLink(opts: {
  title: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "failed"> {
  const url =
    opts.url ??
    (typeof window !== "undefined" ? window.location.origin : "https://www.thepreacher.app");
  const shared = await tryNativeShare(opts.title, `${opts.text}\n${url}`);
  if (shared) return "shared";
  try {
    await copyText(`${opts.text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
