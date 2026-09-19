import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePayload } from "./user-state-parse.ts";

const base = { id: "r1", name: "Ana", phone: "+12015550123", at: 1 };
const wrap = (recipients: unknown[]) => JSON.stringify({ recipients });

test("the chosen channel survives a round trip through the cloud payload", () => {
  // parseRecipient rebuilds a contact field by field, so a field it does not
  // name is dropped on save. That is how the channel would silently vanish.
  const saved = parsePayload(wrap([{ ...base, channel: "sms" }]));
  assert.equal(saved?.recipients[0].channel, "sms");
  const other = parsePayload(wrap([{ ...base, channel: "whatsapp" }]));
  assert.equal(other?.recipients[0].channel, "whatsapp");
});

test("a contact saved before the choice existed keeps none, not a wrong one", () => {
  // The app reads a missing channel as WhatsApp, which is what it always did.
  // Inventing "sms" here would silently reroute every older contact.
  const old = parsePayload(wrap([base]));
  assert.equal(old?.recipients[0].channel, undefined);
});

test("a channel the app does not support is dropped rather than stored", () => {
  for (const channel of ["telegram", "", 7, null, {}]) {
    const parsed = parsePayload(wrap([{ ...base, channel }]));
    assert.equal(parsed?.recipients[0].channel, undefined, String(channel));
  }
});
