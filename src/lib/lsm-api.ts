import { env } from "@/lib/env.server";
import { recobroChapterUrl, recobroCopyright, type BibleBook } from "@/lib/bible";
import type { Locale } from "@/lib/i18n";

export type LsmChapter = {
  verses: { n: number; text: string }[];
  copyright: string;
  url: string;
};

const LSM_URL = "https://api.lsm.org/recver/txo.php";
const CHUNK = 40;

const LSM_ABBR: Record<string, string> = {
  gen: "Gen.",
  exo: "Exo.",
  lev: "Lev.",
  num: "Num.",
  deu: "Deut.",
  jos: "Josh.",
  jdg: "Judg.",
  rut: "Ruth",
  "1sa": "1 Sam.",
  "2sa": "2 Sam.",
  "1ki": "1 Kings",
  "2ki": "2 Kings",
  "1ch": "1 Chron.",
  "2ch": "2 Chron.",
  ezr: "Ezra",
  neh: "Neh.",
  est: "Esth.",
  job: "Job",
  psa: "Psa.",
  pro: "Prov.",
  ecc: "Eccl.",
  sng: "S.S.",
  isa: "Isa.",
  jer: "Jer.",
  lam: "Lam.",
  ezk: "Ezek.",
  dan: "Dan.",
  hos: "Hosea",
  jol: "Joel",
  amo: "Amos",
  oba: "Oba.",
  jon: "Jonah",
  mic: "Micah",
  nah: "Nahum",
  hab: "Hab.",
  zep: "Zeph.",
  hag: "Hag.",
  zec: "Zech.",
  mal: "Mal.",
  mat: "Matt.",
  mrk: "Mark",
  luk: "Luke",
  jhn: "John",
  act: "Acts",
  rom: "Rom.",
  "1co": "1 Cor.",
  "2co": "2 Cor.",
  gal: "Gal.",
  eph: "Eph.",
  php: "Phil.",
  col: "Col.",
  "1th": "1 Thes.",
  "2th": "2 Thes.",
  "1ti": "1 Tim.",
  "2ti": "2 Tim.",
  tit: "Titus",
  phm: "Philem.",
  heb: "Heb.",
  jas: "James",
  "1pe": "1 Pet.",
  "2pe": "2 Pet.",
  "1jn": "1 John",
  "2jn": "2 John",
  "3jn": "3 John",
  jud: "Jude",
  rev: "Rev.",
};

const ONE_CHAPTER = new Set(["oba", "phm", "2jn", "3jn", "jud"]);

type LsmVerse = { ref?: string; text?: string; urlpfx?: string };
type LsmResponse = {
  detected?: string;
  verses?: LsmVerse[];
  message?: string;
  copyright?: string;
};

export function lsmCredentials() {
  const appid = env("LSM_APPID");
  const token = env("LSM_TOKEN");
  if (!appid || !token) return null;
  return { appid, token };
}

function verseNumber(ref: string) {
  const colon = ref.match(/:(\d+)\s*$/);
  if (colon) return Number(colon[1]);
  const lone = ref.match(/(\d+)\s*$/);
  return lone ? Number(lone[1]) : 0;
}

function queryFor(book: BibleBook, chapter: number, from: number, to: number) {
  const abbr = LSM_ABBR[book.id] ?? book.file;
  if (ONE_CHAPTER.has(book.id)) return `${abbr} ${from}-${to}`;
  return `${abbr} ${chapter}:${from}-${to}`;
}

async function lsmRequest(query: string, locale: Locale): Promise<LsmResponse> {
  const creds = lsmCredentials();
  if (!creds) throw new Error("lsm-missing");
  const params = new URLSearchParams({
    String: query,
    Lang: locale === "en" ? "eng" : "spa",
    Out: "json",
  });
  const auth = Buffer.from(`${creds.appid}:${creds.token}`).toString("base64");
  const response = await fetch(`${LSM_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("lsm-http");
  return (await response.json()) as LsmResponse;
}

export async function loadChapterFromLsm(
  book: BibleBook,
  chapter: number,
  locale: Locale,
): Promise<LsmChapter | null> {
  if (!lsmCredentials()) return null;
  const verses: { n: number; text: string }[] = [];
  let copyright = recobroCopyright(locale);
  let from = 1;
  for (let pass = 0; pass < 8; pass += 1) {
    const to = from + CHUNK - 1;
    const payload = await lsmRequest(queryFor(book, chapter, from, to), locale);
    const message = (payload.message ?? "").toLowerCase();
    if (message.includes("not authorized") || message.includes("authorization")) {
      return null;
    }
    if (payload.copyright?.trim()) copyright = payload.copyright.trim();
    const chunk = (payload.verses ?? [])
      .map((item) => ({
        n: verseNumber(String(item.ref ?? "")),
        text: String(item.text ?? "").replace(/\s+/g, " ").trim(),
      }))
      .filter((item) => item.n && item.text);
    if (chunk.length === 0) break;
    for (const item of chunk) {
      if (!verses.some((row) => row.n === item.n)) verses.push(item);
    }
    if (chunk.length < CHUNK) break;
    from += CHUNK;
  }
  if (verses.length === 0) return null;
  verses.sort((a, b) => a.n - b.n);
  return {
    verses,
    copyright,
    url: recobroChapterUrl(book, chapter, locale),
  };
}

/**
 * Every verse holding all of the given words (LSM's concordance search), or
 * null when this app has no LSM key yet or LSM refuses it.
 */
export async function searchLsmWords(words: string, locale: Locale) {
  if (!lsmCredentials()) return null;
  const payload = await lsmRequest(words, locale);
  const message = (payload.message ?? "").toLowerCase();
  if (message.includes("not authorized") || message.includes("authorization")) return null;
  return payload;
}
