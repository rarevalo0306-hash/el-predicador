import { test } from "node:test";
import assert from "node:assert/strict";
import { providerStatusLine } from "./provider-status.ts";
import { scheduleCopy } from "./schedule-copy.ts";

const es = scheduleCopy("es");
const en = scheduleCopy("en");

test("nothing is said until the provider has said something", () => {
  assert.equal(providerStatusLine(es, null, null), null);
  assert.equal(providerStatusLine(es, undefined, "30007"), null);
});

test("delivered is one word, sent is 'not confirmed yet', queued is 'in transit'", () => {
  assert.equal(providerStatusLine(es, "delivered", null), es.providerDelivered);
  assert.equal(providerStatusLine(en, "sent", null), en.providerSent);
  assert.equal(providerStatusLine(en, "queued", null), en.providerQueued);
});

test("a failure names the carrier's reason when it is a known one, or the code", () => {
  assert.equal(
    providerStatusLine(es, "undelivered", "30007"),
    `${es.providerUndelivered} · ${es.providerErr30007}`,
  );
  assert.equal(
    providerStatusLine(en, "failed", "30034"),
    `${en.providerUndelivered} · ${en.providerErr30034}`,
  );
  assert.equal(
    providerStatusLine(en, "failed", "99999"),
    `${en.providerUndelivered} · ${en.reasonCode}: 99999`,
  );
  assert.equal(providerStatusLine(en, "failed", null), en.providerUndelivered);
});

test("every known code has copy in both languages", () => {
  for (const key of Object.keys(es) as (keyof typeof es)[]) {
    if (key.startsWith("providerErr")) {
      assert.ok(es[key].trim(), `es ${key}`);
      assert.ok(en[key].trim(), `en ${key}`);
    }
  }
});
