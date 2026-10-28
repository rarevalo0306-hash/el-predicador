#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "vite";
if (process.env.DATABASE_URL?.trim()) throw new Error("Refusing test against configured database");
const originalFetch = globalThis.fetch;
const originalKey = process.env.API_BIBLE_KEY;
process.env.API_BIBLE_KEY = "test-backend-only";
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { loadApiBibleChapter, searchApiBible } = await server.ssrLoadModule("/src/lib/api-bible.server.ts");
  const { parseVerseRef } = await server.ssrLoadModule("/src/lib/verses.ts");
  const { referenceOnly } = await server.ssrLoadModule("/src/lib/bible-policy.ts");
  const { selectedVerseText } = await server.ssrLoadModule("/src/lib/verse-selection.ts");
  const saved = referenceOnly({
    id: "rcv-jhn-3-range-16,18",
    ref: "Jn 3:16, 18",
    book: "Juan",
    text: "must not persist",
    themes: [],
  });
  assert.equal(saved.text, "");
  const selection = parseVerseRef(saved.ref);
  assert.deepEqual(selection.selected, [16, 18]);
  assert.equal(selection.book.id, "jhn");
  assert.equal(
    selectedVerseText(
      [
        { n: 16, text: "fixture16" },
        { n: 17, text: "excluded" },
        { n: 18, text: "fixture18" },
      ],
      selection,
    ),
    "fixture16 fixture18",
  );
  const { getSql } = await server.ssrLoadModule("/src/lib/db.ts");
  const sql = await getSql();
  const { bookById, BIBLE_TRANSLATIONS, validateBibleTranslation } =
    await server.ssrLoadModule("/src/lib/bible.ts");
  let calls = 0;
  let status = 200;
  let omitCopyright = false;
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.match(
      String(url),
      /^https:\/\/rest.api.bible\/v1\/bibles\/(?:e3f420b9665abaeb-01|bba9f40183526463-01|de4e12af7f28f599-02)\/chapters\//,
    );
    assert.equal(init.headers["api-key"], "test-backend-only");
    const id = new URL(url).pathname.split("/").at(-1);
    if (status !== 200) return new Response("upstream", { status });
    return Response.json({
      data: {
        id,
        bibleId: new URL(url).pathname.split("/")[3],
        copyright: omitCopyright ? "" : "Official fixture © test — unchanged",
        content: [
          {
            name: "para",
            type: "tag",
            items: [
              {
                name: "verse",
                type: "tag",
                attrs: { number: "1" },
                items: [{ type: "text", text: "1" }],
              },
              {
                type: "text",
                text: "  Fixture, punctuation—unchanged. ",
                attrs: { verseId: `${id}.1` },
              },
            ],
          },
        ],
      },
      meta: { fumsToken: "fixture-token" },
    });
  };
  const { formatVerseMessage } = await server.ssrLoadModule("/src/lib/share.ts");
  for (const translation of ["bsb"]) {
    const shared = formatVerseMessage({ id: "jhn-3-16", ref: "John 3:16", text: "Exact fixture.", source: BIBLE_TRANSLATIONS[translation].name, copyright: "Official notice", themes: [], book: "John" }, "Note", "", "en");
    assert.ok(shared.includes("Exact fixture."));
    assert.ok(!shared.includes("Official notice"), "BSB public-domain message uses a brief translation citation");
    assert.ok(!shared.includes("https://api.bible"), "English sharing must not generate a developer-portal link preview");
    assert.ok(shared.includes(BIBLE_TRANSLATIONS[translation].name));
  }
  const spanish = formatVerseMessage({ id: "jhn-3-16", ref: "Juan 3:16", text: "Restricted fixture.", source: BIBLE_TRANSLATIONS.lbla.name, copyright: "Official notice", themes: [], book: "Juan" });
  assert.ok(!spanish.includes("Restricted fixture."));
  assert.ok(spanish.includes("https://www.thepreacher.app/?leer=Juan+3:16"), "LBLA message links to the passage");
  const book = bookById("jhn");
  const results = await Promise.all(Array.from({ length: 20 }, () => loadApiBibleChapter(book, 3)));
  assert.equal(calls, 1, "20 simultaneous requests must make one upstream call");
  assert.equal(results[0].payload.verses[0].text, "  Fixture, punctuation—unchanged. ");
  assert.equal(results[0].payload.copyright, "Official fixture © test — unchanged");
  assert.equal(results[0].payload.fumsToken, "fixture-token");
  assert.ok(results[0].expiresAt <= Date.now() + 28 * 86400000);
  await loadApiBibleChapter(book, 3);
  assert.equal(calls, 1, "persistent cache");
  assert.equal(validateBibleTranslation(undefined, "en"), "bsb");
  assert.equal(validateBibleTranslation(undefined, "es"), "lbla");
  assert.throws(() => validateBibleTranslation("other", "en"));
  assert.throws(() => validateBibleTranslation("lbla", "en"));
  const english = await Promise.all([
    loadApiBibleChapter(book, 3, "bsb"),
    loadApiBibleChapter(book, 3, "kjv"),
    loadApiBibleChapter(book, 3, "bsb"),
  ]);
  assert.equal(calls, 3, "translations have separate requests, same translation deduplicates");
  assert.notEqual(english[0], english[1]);
  await loadApiBibleChapter(book, 3, "kjv");
  assert.equal(calls, 3, "KJV persistent cache");
  const keys = await sql`select key from api_bible_cache where payload is not null`;
  for (const translation of Object.values(BIBLE_TRANSLATIONS)) {
    assert.ok(keys.some((row) => row.key === `${translation.id}:jhn:3`));
  }
  const chapterFetch = globalThis.fetch;
  let searchCalls = 0;
  globalThis.fetch = async (url) => {
    searchCalls++;
    const path = new URL(url).pathname;
    if (path.endsWith("/search")) return Response.json({ data: { total: 1, verses: [{ id: "JHN.3.16", text: "Exact search fixture." }] } });
    return Response.json({ data: { id: BIBLE_TRANSLATIONS.bsb.id, copyright: "Official search copyright" } });
  };
  const search = await searchApiBible("love", "bsb");
  assert.equal(search.copyright, "Official search copyright");
  assert.equal(search.payload.verses[0].text, "Exact search fixture.");
  await searchApiBible("love", "bsb");
  assert.equal(searchCalls, 2, "metadata and identical search cached within shared budget");
  globalThis.fetch = chapterFetch;
  calls = 1; // Existing quota/failure assertions below use a fresh counter.
  await sql`update api_bible_cache set expires_at=now()-interval '1 second'`;
  await loadApiBibleChapter(book, 3);
  assert.equal(calls, 2, "expired text refreshes");
  await sql`update api_bible_cache set expires_at=now()-interval '1 second'`;
  status = 503;
  await assert.rejects(loadApiBibleChapter(book, 3), /no está disponible/);
  assert.equal(calls, 3, "failed requests count toward budget");
  status = 200;
  omitCopyright = true;
  await assert.rejects(loadApiBibleChapter(book, 4), /no está disponible/);
  omitCopyright = false;
  // Fill sliding budget atomically; requests on different chapters still share it.
  await sql`update api_bible_budget set calls=4899, attempts=array_fill(now(),array[4899])`;
  await Promise.allSettled([
    loadApiBibleChapter(book, 5),
    loadApiBibleChapter(book, 6),
    loadApiBibleChapter(book, 7),
  ]);
  assert.equal(calls, 5, "only one of concurrent requests can reserve the last slot");
  const [budget] = await sql`select calls,cardinality(attempts) as attempts from api_bible_budget`;
  assert.deepEqual(budget, { calls: 4900, attempts: 4900 });
  await assert.rejects(loadApiBibleChapter(book, 8), /límite/);
  // Warm content remains available at quota exhaustion.
  await loadApiBibleChapter(book, 5);
  assert.equal(calls, 5);
  // Expiring old attempts restores capacity without a month-boundary burst.
  await sql`update api_bible_budget set attempts=array[now()-interval '32 days'],calls=1`;
  status = 429;
  await assert.rejects(loadApiBibleChapter(book, 9), /límite/);
  status = 200;
  await assert.rejects(loadApiBibleChapter(book, 10), /límite/);
  assert.equal(calls, 6, "provider rate-limit stops further upstream calls");
  console.log(
    "PASS: API.Bible concurrency, exact text/copyright, cache expiry, 4900 shared rolling quota, provider failures and translation-aware sharing. All responses are synthetic; no live key used.",
  );
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.API_BIBLE_KEY;
  else process.env.API_BIBLE_KEY = originalKey;
  await server.close();
}
