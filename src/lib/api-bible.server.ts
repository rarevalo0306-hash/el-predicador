import { randomUUID } from "node:crypto";
import { getSql, dbSource } from "@/lib/db";
import { BIBLE_TRANSLATIONS, type BibleTranslation, type BibleBook } from "@/lib/bible";
import {
  apiBibleVerses,
  BIBLE_CACHE_MS,
  BIBLE_UNAVAILABLE,
  BIBLE_LIMIT,
} from "./api-bible-content";

const pending = new Map<string, Promise<{ payload: Record<string, unknown>; expiresAt: number }>>();
// Rolling 31-day window is deliberately conservative: no calendar-boundary burst
// can exceed 5,000 calls even if the provider bills on an account anniversary.
async function requestChapter(
  book: BibleBook,
  chapter: number,
  translation: BibleTranslation = "lbla",
) {
  const bibleId = BIBLE_TRANSLATIONS[translation]?.id;
  if (!bibleId) throw new Error(BIBLE_UNAVAILABLE);
  const apiKey = process.env.API_BIBLE_KEY?.trim();
  if (!apiKey || (process.env.NODE_ENV === "production" && dbSource === "pglite"))
    throw new Error(BIBLE_UNAVAILABLE);
  const sql = await getSql();
  const key = `${bibleId}:${book.id}:${chapter}`;
  const cached = await sql<{ payload: Record<string, unknown>; expires_at: string }>`
    select payload, expires_at from api_bible_cache where key=${key} and expires_at > now() and payload is not null`;
  if (cached[0])
    return { payload: cached[0].payload, expiresAt: new Date(cached[0].expires_at).getTime() };
  const token = randomUUID();
  const lease = await sql`insert into api_bible_cache (key, lease_until, lease_token)
    values (${key}, now()+interval '30 seconds', ${token}) on conflict (key) do update
    set lease_until=excluded.lease_until, lease_token=excluded.lease_token
    where api_bible_cache.lease_until is null or api_bible_cache.lease_until < now()
    returning key`;
  if (!lease.length) {
    // Across instances: do not duplicate an upstream fetch. Caller can retry.
    throw new Error("Este capítulo se está preparando. Vuelve a intentarlo en unos segundos.");
  }
  try {
    // Single row atomic update serializes budget reservations across instances.
    // Sliding timestamps prevent bursts across a billing reset.
    const budget = await sql`insert into api_bible_budget (period,calls,attempts)
      values ('rolling',1,array[now()]) on conflict (period) do update
      set attempts=array_append(array(select t from unnest(api_bible_budget.attempts) t where t > now()-interval '31 days'),now()),
      calls=cardinality(array(select t from unnest(api_bible_budget.attempts) t where t > now()-interval '31 days'))+1
      where (api_bible_budget.blocked_until is null or api_bible_budget.blocked_until <= now())
      and cardinality(array(select t from unnest(api_bible_budget.attempts) t where t > now()-interval '31 days')) < 4900 returning calls`;
    if (!budget.length) throw new Error(BIBLE_LIMIT);
    const params = new URLSearchParams({
      "content-type": "json",
      "include-notes": "false",
      "include-titles": "false",
      "include-chapter-numbers": "false",
      "include-verse-numbers": "true",
    });
    const response = await fetch(
      `https://rest.api.bible/v1/bibles/${bibleId}/chapters/${book.id.toUpperCase()}.${chapter}?${params}`,
      {
        headers: { "api-key": apiKey, Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
        redirect: "error",
        cache: "no-store",
      },
    );
    // Stop further account calls on provider throttling; reserve remains spent on
    // errors/timeouts as the provider may have counted them. No automatic retries.
    if (response.status === 429) {
      await sql`update api_bible_budget set blocked_until=now()+interval '31 days' where period='rolling'`;
      throw new Error(BIBLE_LIMIT);
    }
    if (!response.ok) throw new Error(BIBLE_UNAVAILABLE);
    const body = await response.json();
    const data = body.data;
    if (
      !data ||
      data.bibleId !== bibleId ||
      data.id !== `${book.id.toUpperCase()}.${chapter}` ||
      typeof data.copyright !== "string" ||
      !data.copyright.trim()
    )
      throw new Error(BIBLE_UNAVAILABLE);
    const verses = apiBibleVerses(data.content);
    const expiresAt = Date.now() + BIBLE_CACHE_MS;
    const payload = {
      verses,
      copyright: data.copyright,
      fumsId: typeof body.meta?.fumsId === "string" ? body.meta.fumsId : undefined,
      fumsToken: typeof body.meta?.fumsToken === "string" ? body.meta.fumsToken : undefined,
    };
    await sql`update api_bible_cache set payload=${JSON.stringify(payload)}::jsonb, expires_at=${new Date(expiresAt).toISOString()}, lease_until=null, lease_token=null where key=${key} and lease_token=${token}`;
    // Delete expired licensed content; never return stale data on failure.
    await sql`delete from api_bible_cache where expires_at <= now() and (lease_until is null or lease_until < now())`;
    return { payload, expiresAt };
  } finally {
    await sql`update api_bible_cache set lease_until=null, lease_token=null where key=${key} and lease_token=${token}`;
  }
}
export function loadApiBibleChapter(
  book: BibleBook,
  chapter: number,
  translation: BibleTranslation = "lbla",
) {
  const key = `${translation}:${book.id}:${chapter}`;
  let request = pending.get(key);
  if (!request) {
    request = requestChapter(book, chapter, translation)
      .catch((error) => {
        throw new Error(
          error instanceof Error && [BIBLE_LIMIT, BIBLE_UNAVAILABLE].includes(error.message)
            ? error.message
            : BIBLE_UNAVAILABLE,
        );
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
  }
  return request;
}
