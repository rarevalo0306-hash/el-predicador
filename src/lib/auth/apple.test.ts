import assert from "node:assert/strict";
import { test } from "node:test";
import { exportPKCS8, generateKeyPair, jwtVerify } from "jose";
import { appleClientSecret, appleConfigured, revokeAppleToken } from "./apple.server.ts";

test("Apple credentials remain server-side and the signed secret has the intended issuer and audience", async () => {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const env = {
    APPLE_CLIENT_ID: "app.test.web",
    APPLE_TEAM_ID: "TEAMTEST01",
    APPLE_KEY_ID: "KEYTEST001",
    APPLE_PRIVATE_KEY: await exportPKCS8(privateKey),
  };
  assert.equal(appleConfigured({}), false);
  const secret = await appleClientSecret(env);
  const { payload } = await jwtVerify(secret, publicKey, {
    issuer: env.APPLE_TEAM_ID,
    audience: "https://appleid.apple.com",
    subject: env.APPLE_CLIENT_ID,
  });
  assert.ok(payload.exp! - payload.iat! <= 300);
  let called = false;
  await revokeAppleToken("test-refresh-token", env, (async (url, init) => {
    called = true;
    assert.equal(url, "https://appleid.apple.com/auth/revoke");
    assert.equal(new URLSearchParams(String(init?.body)).get("token"), "test-refresh-token");
    return new Response(null, { status: 200 });
  }) as typeof fetch);
  assert.ok(called);
  await assert.rejects(
    revokeAppleToken(
      "test",
      env,
      (async () => new Response(null, { status: 503 })) as typeof fetch,
    ),
    /APPLE_REVOCATION_FAILED/,
  );
});
