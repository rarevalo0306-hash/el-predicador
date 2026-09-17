import { test } from "node:test";
import assert from "node:assert/strict";
import { messagingStatus, deliverMessage } from "./provider.server.ts";
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
test("SMS keeps its plus and provider failures never leak response details or retry", async () => {
  let calls = 0;
  const rejected = await deliverMessage({ ...data, channel: "sms" }, config, async (_url, init) => {
    calls++;
    assert.equal(new URLSearchParams(String(init?.body)).get("To"), "+34612345678");
    return Response.json({ code: 21610, message: "Private contact details" }, { status: 400 });
  });
  assert.deepEqual(rejected, { status: "failed", errorCode: "21610" });
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
