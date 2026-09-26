import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCKMAN_NOTICE, RECOBRO_NOTICE, plainNotice, verseNotice } from "./bible-notice.ts";

test("LSM's Markdown link reads as plain text", () => {
  assert.equal(
    plainNotice(
      "Verses accessed from the Holy Bible Recovery Version (text-only edition) © 2022 Living Stream Ministry [www.lsm.org](https://www.lsm.org)",
    ),
    "Verses accessed from the Holy Bible Recovery Version (text-only edition) © 2022 Living Stream Ministry www.lsm.org",
  );
});

test("the line an API sent wins; otherwise the edition's notice by its source", () => {
  assert.equal(
    verseNotice({ copyright: " Línea de la API ", source: "Versión Recobro" }, "es"),
    "Línea de la API",
  );
  assert.equal(verseNotice({ source: "Versión Recobro" }, "es"), RECOBRO_NOTICE.es);
  assert.equal(verseNotice({ source: "Recovery Version" }, "en"), RECOBRO_NOTICE.en);
  assert.equal(
    verseNotice({ source: "La Biblia de las Américas (LBLA) © The Lockman Foundation" }, "es"),
    LOCKMAN_NOTICE.lbla,
  );
  assert.equal(
    verseNotice({ source: "New American Standard Bible (NASB 2020) © The Lockman Foundation" }, "en"),
    LOCKMAN_NOTICE.nasb20,
  );
});

test("text from no known edition carries no notice", () => {
  assert.equal(verseNotice({}, "es"), null);
  assert.equal(verseNotice({ source: "RVR1960" }, "es"), null);
});
