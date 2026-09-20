import { test } from "node:test";
import assert from "node:assert/strict";
import {
  messagingStatus,
  messagingRequirements,
  deliverMessage,
  providerReason,
} from "./provider.server.ts";
const config = {
  MESSAGING_ALLOWED_USER_IDS: "owner",
  MESSAGING_ENABLED: "true",
  CRON_SECRET: "test-secret",
  TWILIO_ACCOUNT_SID: "ACtest",
  TWILIO_AUTH_TOKEN: "fake",
  TWILIO_WHATSAPP_FROM: "+12015550123",
  TWILIO_WHATSAPP_CONTENT_SID: "HXtest",
  TWILIO_SMS_FROM: "+12015550123",
};
const data = {
  userId: "owner",
  channel: "whatsapp" as const,
  phone: "+34612345678",
  recipientName: "Prueba",
  message: "Primera línea\nSegunda línea",
};
test("English WhatsApp uses its own approved template and never falls back to Spanish", async () => {
  assert.equal(messagingStatus("owner", config, "en").whatsapp, false);
  const result = await deliverMessage(
    { ...data, messageLocale: "en", message: "Thinking of you today." },
    { ...config, TWILIO_WHATSAPP_CONTENT_SID_EN: "HXenglish" },
    async (_url, init) => {
      const body = new URLSearchParams(String(init?.body));
      assert.equal(body.get("ContentSid"), "HXenglish");
      assert.equal(JSON.parse(body.get("ContentVariables")!)["2"], "Thinking of you today.");
      return Response.json({ sid: "SMenglish", status: "queued" });
    },
  );
  assert.equal(result.status, "accepted");
});
test("an empty caller id never matches an unset or padded allow list", () => {
  // "".split(",") is [""], so an empty id would otherwise match an unset list.
  assert.deepEqual(messagingStatus("", { ...config, MESSAGING_ALLOWED_USER_IDS: "" }), {
    whatsapp: false,
    sms: false,
  });
  assert.deepEqual(messagingStatus("", { ...config, MESSAGING_ALLOWED_USER_IDS: "owner, " }), {
    whatsapp: false,
    sms: false,
  });
  assert.equal(
    messagingStatus("owner", { ...config, MESSAGING_ALLOWED_USER_IDS: "owner, " }).whatsapp,
    true,
  );
});
test("the requirements breakdown names each missing condition, and no values", () => {
  const none = messagingRequirements("owner", {});
  assert.deepEqual(none, {
    allowed: false,
    credentials: false,
    scheduler: false,
    senders: { es: { whatsapp: false, sms: false }, en: { whatsapp: false, sms: false } },
  });
  // Nothing that could carry a secret: every leaf is a boolean.
  const leaves = [
    none.allowed,
    none.credentials,
    none.scheduler,
    ...Object.values(none.senders).flatMap((byChannel) => Object.values(byChannel)),
  ];
  assert.ok(leaves.every((value) => typeof value === "boolean"));

  const full = messagingRequirements("owner", config);
  assert.equal(full.allowed, true);
  assert.equal(full.credentials, true);
  assert.equal(full.scheduler, true);
  // Spanish falls back to the legacy template; English never does.
  assert.equal(full.senders.es.whatsapp, true);
  assert.equal(full.senders.en.whatsapp, false);
  assert.equal(full.senders.es.sms, true);
});
test("each condition fails on its own, without dragging the others down", () => {
  assert.equal(messagingRequirements("other", config).allowed, false);
  assert.equal(messagingRequirements("other", config).credentials, true);
  assert.equal(
    messagingRequirements("owner", { ...config, TWILIO_AUTH_TOKEN: "" }).credentials,
    false,
  );
  assert.equal(
    messagingRequirements("owner", { ...config, MESSAGING_ENABLED: "yes" }).scheduler,
    false,
  );
  assert.equal(messagingRequirements("owner", { ...config, CRON_SECRET: "" }).scheduler, false);
  assert.equal(
    messagingRequirements("owner", { ...config, TWILIO_SMS_FROM: "" }).senders.es.sms,
    false,
  );
  assert.equal(
    messagingRequirements("owner", { ...config, TWILIO_SMS_FROM: "" }).senders.es.whatsapp,
    true,
  );
});
test("sending is closed until channel, scheduler and owner access are configured", async () => {
  assert.deepEqual(messagingStatus("owner", {}), { whatsapp: false, sms: false });
  assert.deepEqual(messagingStatus("other", config), { whatsapp: false, sms: false });
  assert.deepEqual(messagingStatus("owner", config), { whatsapp: true, sms: true });
  assert.equal(messagingStatus("owner", { ...config, CRON_SECRET: "" }).whatsapp, false);
  assert.equal(
    messagingStatus("owner", { ...config, TWILIO_WHATSAPP_CONTENT_SID: "" }).whatsapp,
    false,
  );
  const result = await deliverMessage({ ...data, userId: "other" }, config, async () => {
    throw new Error("must not call provider");
  });
  assert.equal(result.status, "failed");
});
test("uses approved WhatsApp template with international recipient and encoded variables", async () => {
  const result = await deliverMessage(data, config, async (_url, init) => {
    const body = new URLSearchParams(String(init?.body));
    assert.equal(body.get("To"), "whatsapp:+34612345678");
    assert.equal(body.get("ContentSid"), "HXtest");
    assert.deepEqual(JSON.parse(body.get("ContentVariables")!), {
      "1": "Prueba",
      "2": "Primera línea Segunda línea",
    });
    assert.equal(body.has("Body"), false);
    return Response.json({ sid: "SMtest", status: "queued" });
  });
  assert.deepEqual(result, { status: "accepted", providerId: "SMtest" });
});
test("SMS keeps its plus, and a rejection is reported once with its reason", async () => {
  let calls = 0;
  const rejected = await deliverMessage({ ...data, channel: "sms" }, config, async (_url, init) => {
    calls++;
    const body = new URLSearchParams(String(init?.body));
    assert.equal(body.get("To"), "+34612345678");
    // Carriers want the sender named and a way out in the text itself.
    assert.equal(
      body.get("Body"),
      "Primera línea\nSegunda línea\n\nThe Preacher App · Responde STOP para cancelar",
    );
    return Response.json({ code: 21610, message: "Unsubscribed recipient" }, { status: 400 });
  });
  // The code alone is not always in the public dictionary, so the sentence
  // beside it is what tells the owner what to change.
  assert.deepEqual(rejected, {
    status: "failed",
    errorCode: "21610",
    errorMessage: "Unsubscribed recipient",
  });
  assert.equal(calls, 1);
  const unknown = await deliverMessage(data, config, async () => {
    calls++;
    throw new Error("timeout");
  });
  assert.equal(unknown.status, "unknown");
  assert.equal(calls, 2);
  const failed = await deliverMessage(data, config, async () =>
    Response.json({ sid: "SMfailed", status: "failed", error_code: 30003 }),
  );
  assert.deepEqual(failed, { status: "failed", providerId: "SMfailed", errorCode: "30003" });
});
test("the SMS footer follows the message language, and WhatsApp keeps its template text", async () => {
  await deliverMessage(
    { ...data, channel: "sms", messageLocale: "en", message: "Thinking of you.  " },
    config,
    async (_url, init) => {
      assert.equal(
        new URLSearchParams(String(init?.body)).get("Body"),
        "Thinking of you.\n\nThe Preacher App · Reply STOP to opt out",
      );
      return Response.json({ sid: "SMen", status: "queued" });
    },
  );
  // The WhatsApp wording is an approved template; the variable must stay the
  // message alone, or the template no longer matches what was approved.
  await deliverMessage(data, config, async (_url, init) => {
    const vars = JSON.parse(new URLSearchParams(String(init?.body)).get("ContentVariables")!);
    assert.equal(vars["2"], "Primera línea Segunda línea");
    return Response.json({ sid: "SMwa", status: "queued" });
  });
});
test("the stored reason drops the account identifier and stays short", () => {
  const sid = `AC${"0123456789abcdef".repeat(2)}`;
  const hidden = providerReason(
    `The requested resource /2010-04-01/Accounts/${sid}/Messages.json was not found`,
  );
  assert.ok(hidden);
  assert.equal(hidden.includes(sid), false, "the account id belongs to the deployment");
  assert.match(hidden, /was not found/);
  // A provider could answer with anything; the column is not a log file.
  assert.equal(providerReason("x".repeat(900))?.length, 300);
  for (const empty of [undefined, null, 572002, "", "   "]) {
    assert.equal(providerReason(empty), undefined, String(empty));
  }
});
