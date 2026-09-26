import { env } from "./env.server.ts";
import { bookName, type BibleBook, type BibleVersion } from "./bible.ts";
import type { Locale } from "./i18n.ts";

export type ApiBibleChapter = {
  verses: { n: number; text: string }[];
  copyright: string;
  url: string;
  fumsId?: string;
};

type ApiBibleEdition = {
  id?: string;
  name?: string;
  abbreviation?: string;
  abbreviationLocal?: string;
};

type ContentNode = {
  type?: string;
  name?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  items?: ContentNode[];
};

type ChapterResponse = {
  data?: {
    content?: ContentNode[];
    copyright?: string;
  };
  meta?: {
    fumsId?: string;
  };
};

const API_BIBLE_URL = "https://rest.api.bible/v1";
const LOCKMAN_URL = "https://www.lockman.org/";

let licensedBibles: Promise<ApiBibleEdition[]> | null = null;

function apiBibleKey() {
  const key = env("API_BIBLE_KEY");
  if (!key) throw new Error("api-bible-missing");
  return key;
}

async function apiBibleRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BIBLE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "api-key": apiBibleKey(),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`api-bible-http:${response.status}`);
  }
  return (await response.json()) as T;
}

async function availableBibles() {
  if (!licensedBibles) {
    licensedBibles = apiBibleRequest<{ data?: ApiBibleEdition[] }>("/bibles")
      .then((payload) => payload.data ?? [])
      .catch((error) => {
        licensedBibles = null;
        throw error;
      });
  }
  return licensedBibles;
}

function normalizedEditionText(edition: ApiBibleEdition) {
  return [edition.name, edition.abbreviation, edition.abbreviationLocal]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function matchesApiBibleVersion(
  edition: ApiBibleEdition,
  version: Extract<BibleVersion, "lbla" | "nasb20">,
) {
  const text = normalizedEditionText(edition);
  if (version === "lbla") {
    return /\blbla\b/.test(text) || text.includes("la biblia de las americas");
  }
  return (
    /\bnasb\s*20\b/.test(text) ||
    /\bnasb\s*2020\b/.test(text) ||
    (text.includes("new american standard bible") && text.includes("2020"))
  );
}

async function bibleId(version: Extract<BibleVersion, "lbla" | "nasb20">) {
  const override = env(version === "lbla" ? "API_BIBLE_LBLA_ID" : "API_BIBLE_NASB20_ID");
  if (override) return override;
  const edition = (await availableBibles()).find((item) => matchesApiBibleVersion(item, version));
  if (!edition?.id) throw new Error(`api-bible-license:${version}`);
  return edition.id;
}

function verseFromAttrs(attrs: Record<string, unknown> | undefined) {
  const number = Number(attrs?.number);
  if (Number.isInteger(number) && number > 0) return number;
  const verseId = typeof attrs?.verseId === "string" ? attrs.verseId : "";
  const match = verseId.match(/\.(\d+)$/);
  return match ? Number(match[1]) : 0;
}

export function apiBibleContentToVerses(content: ContentNode[] | undefined) {
  const byVerse = new Map<number, string[]>();
  let currentVerse = 0;

  const append = (verse: number, text: string) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!verse || !clean) return;
    byVerse.set(verse, [...(byVerse.get(verse) ?? []), clean]);
  };

  const visit = (node: ContentNode) => {
    const fromAttrs = verseFromAttrs(node.attrs);
    if (node.name === "verse" && fromAttrs) {
      currentVerse = fromAttrs;
      return;
    }
    if (node.type === "text" && node.text) {
      append(fromAttrs || currentVerse, node.text);
    }
    for (const item of node.items ?? []) visit(item);
  };

  for (const node of content ?? []) visit(node);
  return [...byVerse.entries()]
    .map(([n, parts]) => ({ n, text: parts.join(" ").replace(/\s+/g, " ").trim() }))
    .filter((item) => item.text)
    .sort((a, b) => a.n - b.n);
}

export async function loadChapterFromApiBible(
  book: BibleBook,
  chapter: number,
  locale: Locale,
  version: Extract<BibleVersion, "lbla" | "nasb20">,
): Promise<ApiBibleChapter> {
  const id = await bibleId(version);
  const chapterId = `${book.id.toUpperCase()}.${chapter}`;
  const params = new URLSearchParams({
    "content-type": "json",
    "include-notes": "false",
    "include-titles": "false",
    "include-chapter-numbers": "false",
    "include-verse-numbers": "true",
  });
  const payload = await apiBibleRequest<ChapterResponse>(
    `/bibles/${encodeURIComponent(id)}/chapters/${encodeURIComponent(chapterId)}?${params}`,
  );
  const verses = apiBibleContentToVerses(payload.data?.content);
  if (!verses.length) throw new Error("api-bible-empty");
  return {
    verses,
    copyright: payload.data?.copyright?.trim() || bookName(book, locale),
    url: LOCKMAN_URL,
    fumsId: payload.meta?.fumsId,
  };
}
