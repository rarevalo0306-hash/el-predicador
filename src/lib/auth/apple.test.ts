import assert from "node:assert/strict";
import { test } from "node:test";
import { exportPKCS8, generateKeyPair, jwtVerify } from "jose";
import {
  appleClientSecret,
  appleConfigured,
  currentAppleClientSecret,
  revokeAppleToken,
} from "./apple.server.ts";

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

test("The token-exchange secret stays valid on a long-lived server instance", async () => {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const env = {
    APPLE_CLIENT_ID: "app.test.web",
    APPLE_TEAM_ID: "TEAMTEST01",
    APPLE_KEY_ID: "KEYTEST001",
    // Vercel values may hold escaped newlines.
    APPLE_PRIVATE_KEY: (await exportPKCS8(privateKey)).replace(/\n/g, "\\n"),
  };
  const start = Date.UTC(2026, 9, 27, 12, 0, 0);
  const first = currentAppleClientSecret(env, start);
  const { payload, protectedHeader } = await jwtVerify(first, publicKey, {
    issuer: env.APPLE_TEAM_ID,
    audience: "https://appleid.apple.com",
    subject: env.APPLE_CLIENT_ID,
    currentDate: new Date(start),
  });
  assert.equal(protectedHeader.alg, "ES256");
  assert.equal(protectedHeader.kid, env.APPLE_KEY_ID);
  assert.equal(payload.exp! - payload.iat!, 3600);
  // Reused while comfortably valid, renewed before Apple would reject it.
  assert.equal(currentAppleClientSecret(env, start + 30 * 60_000), first);
  const later = start + 56 * 60_000;
  const renewed = currentAppleClientSecret(env, later);
  assert.notEqual(renewed, first);
  await jwtVerify(renewed, publicKey, { currentDate: new Date(later + 50 * 60_000) });
});
