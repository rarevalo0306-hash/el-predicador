import { test } from "node:test";
import assert from "node:assert/strict";
import { validTwilioSignature } from "./twilio-signature.ts";

// The worked example from Twilio's own security documentation.
const url = "https://mycompany.com/myapp.php?foo=1&bar=2";
const params = {
  CallSid: "CA1234567890ABCDE",
  Caller: "+12349013030",
  Digits: "1234",
  From: "+12349013030",
  To: "+18005551212",
};
const token = "12345";
const signature = "0/KCTR6DLpKmkAf8muzZqo1nDgQ=";

test("accepts the provider's documented example", () => {
  assert.equal(validTwilioSignature(url, params, token, signature), true);
});

test("rejects a changed field, a changed url, another token, and no signature", () => {
  assert.equal(validTwilioSignature(url, { ...params, Digits: "4321" }, token, signature), false);
  assert.equal(validTwilioSignature(url + "&x=1", params, token, signature), false);
  assert.equal(validTwilioSignature(url, params, "54321", signature), false);
  assert.equal(validTwilioSignature(url, params, token, null), false);
  assert.equal(validTwilioSignature(url, params, undefined, signature), false);
  // A signature of a different length must not throw, only fail.
  assert.equal(validTwilioSignature(url, params, token, "short"), false);
});
