import { test } from "node:test";
import assert from "node:assert/strict";
import { apiBibleContentToVerses, matchesApiBibleVersion } from "./api-bible.ts";

/** Sets LSM access for one test; returns the undo. */
function withLsmEnv(appid: string | undefined, token: string | undefined) {
  const before = { appid: process.env.LSM_APPID, token: process.env.LSM_TOKEN };
  const put = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  put("LSM_APPID", appid);
  put("LSM_TOKEN", token);
  return () => {
    put("LSM_APPID", before.appid);
    put("LSM_TOKEN", before.token);
  };
}


test("recognizes the two licensed Lockman editions", () => {
  assert.equal(
    matchesApiBibleVersion(
      { name: "La Biblia de las Américas", abbreviation: "LBLA" },
      "lbla",
    ),
    true,
  );
  assert.equal(
    matchesApiBibleVersion(
      { name: "New American Standard Bible - 2020", abbreviation: "NASB20" },
      "nasb20",
    ),
    true,
  );
  assert.equal(
    matchesApiBibleVersion({ name: "New American Standard Bible - 1995" }, "nasb20"),
    false,
  );
});

test("groups API.Bible JSON text under the correct verse number", () => {
  const verses = apiBibleContentToVerses([
    {
      name: "para",
      type: "tag",
      items: [
        {
          name: "verse",
          type: "tag",
          attrs: { number: "1", sid: "JHN 1:1" },
          items: [{ type: "text", text: "1" }],
        },
        {
          type: "text",
          text: "En el principio era el Verbo, ",
          attrs: { verseId: "JHN.1.1" },
        },
        { type: "text", text: "y el Verbo era con Dios." },
        {
          name: "verse",
          type: "tag",
          attrs: { number: "2", sid: "JHN 1:2" },
          items: [{ type: "text", text: "2" }],
        },
        {
          type: "text",
          text: "Él estaba en el principio con Dios.",
          attrs: { verseId: "JHN.1.2" },
        },
      ],
    },
  ]);

  assert.deepEqual(verses, [
    { n: 1, text: "En el principio era el Verbo, y el Verbo era con Dios." },
    { n: 2, text: "Él estaba en el principio con Dios." },
  ]);
});

test("without LSM access, LBLA and NASB 2020 are read and Recobro waits", async (t) => {
  const { FALLBACK_BIBLE_VERSIONS, defaultBibleVersion, normalizeBibleVersion, bibleVersionsFor } =
    await import("./bible.ts");
  t.after(withLsmEnv(undefined, undefined));
  assert.deepEqual(FALLBACK_BIBLE_VERSIONS, { es: "lbla", en: "nasb20" });
  assert.equal(defaultBibleVersion("es"), "lbla");
  assert.equal(normalizeBibleVersion(undefined, "es"), "lbla");
  assert.equal(normalizeBibleVersion("nasb20", "es"), "lbla", "each language keeps its own list");
  assert.equal(normalizeBibleVersion("recovery", "en"), "nasb20", "Recobro cannot be read yet");
  assert.deepEqual(
    bibleVersionsFor("en").map((item) => item.id),
    ["recovery", "nasb20"],
  );
});

test("with LSM access, Recobro is the main version and a reader's pick is kept", async (t) => {
  const { defaultBibleVersion, normalizeBibleVersion } = await import("./bible.ts");
  t.after(withLsmEnv("app-id", "app-token"));
  assert.equal(defaultBibleVersion("es"), "recovery");
  assert.equal(defaultBibleVersion("en"), "recovery");
  assert.equal(normalizeBibleVersion(undefined, "es"), "recovery");
  assert.equal(normalizeBibleVersion("lbla", "es"), "lbla", "LBLA stays for whoever picked it");
  assert.equal(normalizeBibleVersion("nasb20", "en"), "nasb20");
});

test("only a real pick is saved, so an old automatic value never pins a version", async () => {
  const { parseBibleVersionChoices } = await import("./bible.ts");
  assert.deepEqual(parseBibleVersionChoices(undefined), {});
  assert.deepEqual(parseBibleVersionChoices({ es: "lbla", en: "lbla" }), { es: "lbla" });
  assert.deepEqual(parseBibleVersionChoices({ es: "recovery", en: "nasb20" }), {
    es: "recovery",
    en: "nasb20",
  });
});

test("the key travels only in the request header, and the copyright is Lockman's", async (t) => {
  const { loadChapterFromApiBible, LOCKMAN_NOTICE } = await import("./api-bible.ts");
  const calls: { url: string; key: string | null }[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, key: new Headers(init.headers).get("api-key") });
    return new Response(
      JSON.stringify({
        data: {
          content: [
            {
              name: "para",
              type: "tag",
              items: [
                { name: "verse", type: "tag", attrs: { number: "16" } },
                { type: "text", text: "Porque de tal manera amó Dios al mundo…" },
              ],
            },
          ],
        },
        meta: { fumsId: "fums-1" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  process.env.API_BIBLE_KEY = "test-key-not-real";
  process.env.API_BIBLE_LBLA_ID = "lbla-test";
  t.after(() => {
    delete process.env.API_BIBLE_KEY;
    delete process.env.API_BIBLE_LBLA_ID;
  });
  const book = { id: "jhn", name: "Juan", chapters: 21 } as Parameters<
    typeof loadChapterFromApiBible
  >[0];
  const chapter = await loadChapterFromApiBible(book, 3, "es", "lbla");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].key, "test-key-not-real");
  assert.ok(!calls[0].url.includes("test-key-not-real"), "the key is never in the address");
  assert.match(calls[0].url, /\/bibles\/lbla-test\/chapters\/JHN\.3\?/);
  assert.deepEqual(chapter.verses, [{ n: 16, text: "Porque de tal manera amó Dios al mundo…" }]);
  assert.equal(chapter.fumsId, "fums-1");
  // API.Bible sent no copyright line: Lockman's notice, never the book's name.
  assert.equal(chapter.copyright, LOCKMAN_NOTICE.lbla);
  assert.ok(!chapter.copyright.includes("Juan"));
});

test("without the key nothing is requested", async () => {
  const { loadChapterFromApiBible } = await import("./api-bible.ts");
  delete process.env.API_BIBLE_KEY;
  process.env.API_BIBLE_NASB20_ID = "nasb-test";
  try {
    const book = { id: "jhn", chapters: 21 } as Parameters<typeof loadChapterFromApiBible>[0];
    await assert.rejects(loadChapterFromApiBible(book, 3, "en", "nasb20"), /api-bible-missing/);
  } finally {
    delete process.env.API_BIBLE_NASB20_ID;
  }
});
