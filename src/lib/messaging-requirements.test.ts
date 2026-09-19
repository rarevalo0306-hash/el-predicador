import { test } from "node:test";
import assert from "node:assert/strict";
import { missingRequirements } from "./messaging-requirements.ts";
import { scheduleCopy } from "./schedule-copy.ts";
import type { MessagingRequirements } from "./messaging/provider.server.ts";

const copy = scheduleCopy("es");
const nothing: MessagingRequirements = {
  allowed: false,
  credentials: false,
  scheduler: false,
  senders: { es: { whatsapp: false, sms: false }, en: { whatsapp: false, sms: false } },
};
const whatsappEs = { channel: "whatsapp" as const, messageLocale: "es" as const };

test("names all four conditions, in the order they have to be fixed", () => {
  const items = missingRequirements(nothing, whatsappEs, copy);
  assert.deepEqual(
    items.map((i) => i.key),
    ["allowed", "credentials", "scheduler", "whatsapp"],
  );
  assert.ok(items.every((i) => i.done === false));
});

test("every row carries the text and the setting to change", () => {
  // The panel renders these directly; an empty one would be a blank bullet.
  for (const item of missingRequirements(nothing, whatsappEs, copy)) {
    assert.ok(item.label.trim(), `${item.key}: label`);
    assert.ok(item.how.trim(), `${item.key}: how`);
  }
});

test("only the sender for the channel on the form is listed", () => {
  const sms = missingRequirements(nothing, { ...whatsappEs, channel: "sms" }, copy);
  assert.equal(sms.at(-1)?.key, "sms");
  assert.match(sms.at(-1)!.how, /TWILIO_SMS_FROM/);
  const whatsapp = missingRequirements(nothing, whatsappEs, copy);
  assert.equal(whatsapp.at(-1)?.key, "whatsapp");
  assert.match(whatsapp.at(-1)!.how, /TWILIO_WHATSAPP_FROM/);
});

test("the sender follows the message language, not the app language", () => {
  // Spanish is configured, English is not: the same form must report the one
  // it would actually send with.
  const halfway: MessagingRequirements = {
    ...nothing,
    senders: { es: { whatsapp: true, sms: true }, en: { whatsapp: false, sms: true } },
  };
  assert.equal(missingRequirements(halfway, whatsappEs, copy).at(-1)?.done, true);
  assert.equal(
    missingRequirements(halfway, { ...whatsappEs, messageLocale: "en" }, copy).at(-1)?.done,
    false,
  );
});

test("what already holds is marked done rather than dropped", () => {
  // Dropping satisfied rows would make progress invisible half way through.
  const done = missingRequirements(
    { ...nothing, allowed: true, credentials: true },
    whatsappEs,
    copy,
  );
  assert.deepEqual(
    done.map((i) => i.done),
    [true, true, false, false],
  );
});

test("an unset message language is treated as Spanish, like the rest of the app", () => {
  const items = missingRequirements(
    {
      ...nothing,
      senders: { es: { whatsapp: true, sms: false }, en: { whatsapp: false, sms: false } },
    },
    { channel: "whatsapp" },
    copy,
  );
  assert.equal(items.at(-1)?.done, true);
});
