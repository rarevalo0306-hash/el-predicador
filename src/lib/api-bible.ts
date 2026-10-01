import { env } from "./env.server.ts";
import type { BibleBook, BibleVersion } from "./bible.ts";
import type { Locale } from "./i18n.ts";
import { LOCKMAN_NOTICE } from "./bible-notice.ts";

export { LOCKMAN_NOTICE };

export type ApiBibleChapter = {
  verses: { n: number; text: string }[];
  copyright: string;
  url: string;
  fumsId?: string;
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

/**
 * The licensed editions on the owner's API.Bible account (its "Bible ID"s,
 * which are not secret). API_BIBLE_LBLA_ID / API_BIBLE_NASB20_ID override
 * them if the account ever changes.
 */
export const API_BIBLE_IDS = {
  lbla: "e3f420b9665abaeb-01",
  nasb20: "a761ca71e0b3ddcf-01",
} as const;

function bibleId(version: Extract<BibleVersion, "lbla" | "nasb20">) {
  const override = env(version === "lbla" ? "API_BIBLE_LBLA_ID" : "API_BIBLE_NASB20_ID");
  return override ?? API_BIBLE_IDS[version];
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
  _locale: Locale,
  version: Extract<BibleVersion, "lbla" | "nasb20">,
): Promise<ApiBibleChapter> {
  const id = bibleId(version);
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
  ).catch((error: unknown) => {
    // API.Bible answers 403 when the key is fine but this edition is not
    // licensed to it, so the reader is told which Bible to turn on.
    if (error instanceof Error && error.message === "api-bible-http:403") {
      throw new Error(`api-bible-license:${version}`);
    }
    throw error;
  });
  const verses = apiBibleContentToVerses(payload.data?.content);
  if (!verses.length) throw new Error("api-bible-empty");
  return {
    verses,
    copyright: payload.data?.copyright?.trim() || LOCKMAN_NOTICE[version],
    url: LOCKMAN_URL,
    fumsId: payload.meta?.fumsId,
  };
}
