import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "./db.ts";
import { expandTheme, type ExpandDeps, type Passage } from "./theme-verses.server.ts";

const db = new PGlite();
const sql = (async (parts: TemplateStringsArray, ...values: unknown[]) => {
  let text = parts[0];
  values.forEach((_, i) => {
    text += `$${i + 1}${parts[i + 1]}`;
  });
  return (await db.query(text, values)).rows;
}) as Sql;
sql.query = async <T>(text: string, values: unknown[] = []) =>
  (await db.query<T>(text, values)).rows;

/** A small stand-in for the Bible: "Book c:v" or "Book c:v-w", up to 3 verses, books A and B. */
function canonical(ref: string): Passage | null {
  const m = /^(A|B) (\d+):(\d+)(?:-(\d+))?$/.exec(ref.trim());
  if (!m) return null;
  const from = Number(m[3]);
  const to = m[4] ? Number(m[4]) : from;
  if (to < from || to - from > 2) return null;
  const verses = to > from ? `${from}-${to}` : `${from}`;
  return {
    id: `x-${m[1]!.toLowerCase()}-${m[2]}-${verses}`,
    ref: `${m[1]} ${m[2]}:${verses}`,
    span: { bookId: m[1]!, chapter: Number(m[2]), from, to },
  };
}

function deps(proposals: string[], overrides: Partial<ExpandDeps> = {}): ExpandDeps {
  return {
    propose: async () => proposals,
    canonical,
    catalog: [{ ref: "A 1:1-2" }],
    // B 9 is a chapter the Recovery Version does not return.
    textOf: async (passage, locale) =>
      passage.span.bookId === "B" && passage.span.chapter === 9
        ? null
        : { ref: passage.ref, text: `${locale} text of ${passage.ref}` },
    ...overrides,
  };
}

before(async () => {
  const dir = new URL("../../migrations/", import.meta.url);
  for (const name of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, dir), "utf8"));
  }
});
beforeEach(async () => {
  await db.exec("truncate theme_verses, verse_texts");
});
after(async () => {
  await db.close();
});

test("only real, short, new passages with text are published", async () => {
  const result = await expandTheme(
    sql,
    "paz",
    deps(["B 2:3", "Invented 4:4", "A 1:2", "B 5:1-6", "B 9:1", "B 2:3", " B 7:1-2 "]),
  );
  assert.deepEqual(result.added, ["B 2:3", "B 7:1-2"]);
  assert.deepEqual(
    result.rejected.map((r) => [r.ref, r.reason]),
    [
      ["Invented 4:4", "invalid"],
      ["A 1:2", "repeated"],
      ["B 5:1-6", "invalid"],
      ["B 9:1", "no_text"],
      ["B 2:3", "repeated"],
    ],
  );
  const rows = await sql<{ verse_id: string }>`select verse_id from theme_verses order by verse_id`;
  assert.deepEqual(
    rows.map((r) => r.verse_id),
    ["x-b-2-3", "x-b-7-1-2"],
  );
});

test("texts are kept in both languages so scheduled sends can use them", async () => {
  await expandTheme(sql, "paz", deps(["B 2:3"]));
  const texts = await sql<{ locale: string; text: string }>`
    select locale, text from verse_texts where verse_id = 'x-b-2-3' order by locale`;
  assert.deepEqual(texts, [
    { locale: "en", text: "en text of B 2:3" },
    { locale: "es", text: "es text of B 2:3" },
  ]);
});

test("a second run sees what was added and does not repeat it; the limit holds", async () => {
  await expandTheme(sql, "paz", deps(["B 2:3"]));
  let seen: string[] = [];
  const second = await expandTheme(
    sql,
    "paz",
    deps(["B 2:2-4", "B 3:1", "B 3:2", "B 3:3"], {
      propose: async (existing) => {
        seen = existing;
        return ["B 2:2-4", "B 3:1", "B 3:2", "B 3:3"];
      },
      limit: 2,
    }),
  );
  assert.deepEqual(seen, ["A 1:1-2", "B 2:3"], "DeepSeek is told what the theme already has");
  assert.deepEqual(second.added, ["B 3:1", "B 3:2"]);
  assert.equal(second.rejected[0]?.reason, "repeated", "B 2:2-4 overlaps B 2:3");
});

test("themes are separate: a verse in one theme can be added to another", async () => {
  await expandTheme(sql, "paz", deps(["B 2:3"]));
  const other = await expandTheme(sql, "fe", deps(["B 2:3"]));
  assert.deepEqual(other.added, ["B 2:3"]);
});
