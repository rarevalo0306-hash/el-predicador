import { test } from "node:test";
import assert from "node:assert/strict";
import { apiBibleContentToVerses, matchesApiBibleVersion } from "./api-bible.ts";

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
