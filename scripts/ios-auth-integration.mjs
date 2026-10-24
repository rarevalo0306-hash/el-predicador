#!/usr/bin/env node
// Runs only against an isolated, in-memory PGLite database. Never real accounts.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "vite";
import { exportPKCS8, generateKeyPair } from "jose";
import { symmetricEncrypt } from "better-auth/crypto";
if (process.env.DATABASE_URL?.trim())
  throw new Error("Refusing integration test with DATABASE_URL configured");
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const originalFetch = globalThis.fetch;
try {
  const { auth, SESSION_TOKEN_COOKIE } = await server.ssrLoadModule("/src/lib/auth/server.ts");
  const { getSql } = await server.ssrLoadModule("/src/lib/db.ts");
  const { completeNativeAuth, exchangeNativeAuth } = await server.ssrLoadModule(
    "/src/lib/auth/native-auth.server.ts",
  );
  const { challengeFor } = await server.ssrLoadModule("/src/lib/auth/native-handoff.ts");
  const sql = await getSql();
  const password = "Local-test-only-" + randomUUID();
  const make = async (name) => {
    const response = await auth.api.signUpEmail({
      body: { name, email: `${name}-${randomUUID()}@example.invalid`, password },
      headers: new Headers({ origin: "http://localhost:8080" }),
      asResponse: true,
    });
    assert.equal(response.status, 200, await response.clone().text());
    const tokenCookie = response.headers
      .getSetCookie()
      .find((x) => x.startsWith(SESSION_TOKEN_COOKIE + "="))
      ?.split(";")[0];
    assert.ok(tokenCookie);
    const headers = new Headers({ origin: "http://localhost:8080", cookie: tokenCookie });
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
    assert.ok(session?.user.id);
    return { headers, session, tokenCookie };
  };
  const owner = await make("ios-owner");
  const other = await make("ios-other");
  for (const user of [owner, other]) {
    await sql.query("insert into preacher_state(user_id,payload) values ($1,'{}')", [
      user.session.user.id,
    ]);
  }
  const context = await auth.$context;
  const verifier = "v".repeat(43),
    state = "s".repeat(43);
  const intent = await symmetricEncrypt({
    key: context.secretConfig,
    data: JSON.stringify({ challenge: challengeFor(verifier), state, issued: Date.now() }),
  });
  const complete = await completeNativeAuth(
    new Request("http://localhost:8080/api/native-auth/complete", {
      headers: {
        cookie: `${owner.tokenCookie}; __Host-preacher_native_intent=${encodeURIComponent(intent)}`,
      },
    }),
  );
  assert.equal(complete.status, 302);
  const callback = new URL(complete.headers.get("location"));
  assert.equal(callback.protocol, "thepreacher:");
  assert.equal(callback.searchParams.get("state"), state);
  assert.ok(callback.searchParams.get("code"));
  assert.ok(!callback.toString().includes(owner.session.session.token));
  const exchange = (proof, origin) =>
    exchangeNativeAuth(
      new Request("http://localhost:8080/api/native-auth/exchange", {
        method: "POST",
        headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
        body: JSON.stringify({ code: callback.searchParams.get("code"), verifier: proof }),
      }),
    );
  assert.equal((await exchange(verifier, "https://attacker.example")).status, 403);
  assert.equal((await exchange("wrong".repeat(12))).status, 401);
  const accepted = await exchange(verifier);
  assert.equal(accepted.status, 200);
  const installed = accepted.headers.get("set-cookie").split(";")[0];
  assert.equal(
    (
      await auth.api.getSession({
        headers: new Headers({ cookie: installed }),
        query: { disableCookieCache: true },
      })
    ).user.id,
    owner.session.user.id,
  );
  assert.equal((await exchange(verifier)).status, 401);
  const deleteRequest = (headers, body) => auth.api.deleteUser({ headers, body, asResponse: true });
  assert.notEqual((await deleteRequest(new Headers(), {})).status, 200);
  assert.notEqual((await deleteRequest(owner.headers, { password: "wrong-password" })).status, 200);
  await sql.query('update session set "createdAt"=now()-interval \'1 hour\' where "userId"=$1', [
    owner.session.user.id,
  ]);
  assert.notEqual((await deleteRequest(owner.headers, {})).status, 200);
  // An Apple-linked account cannot disappear while token revocation fails.
  const { privateKey } = await generateKeyPair("ES256", { extractable: true });
  Object.assign(process.env, {
    APPLE_CLIENT_ID: "local.test",
    APPLE_TEAM_ID: "TESTTEAM01",
    APPLE_KEY_ID: "TESTKEY001",
    APPLE_PRIVATE_KEY: await exportPKCS8(privateKey),
  });
  const encryptedToken = await symmetricEncrypt({
    key: context.secretConfig,
    data: "test-refresh-token",
  });
  await sql.query(
    'insert into account(id,"accountId","providerId","userId","refreshToken","updatedAt") values ($1,$1,\'apple\',$2,$3,now())',
    [randomUUID(), owner.session.user.id, encryptedToken],
  );
  let revokeOk = false,
    revokeCalled = false;
  globalThis.fetch = async (url, options) => {
    if (String(url) !== "https://appleid.apple.com/auth/revoke") return originalFetch(url, options);
    revokeCalled = true;
    assert.equal(new URLSearchParams(String(options.body)).get("token"), "test-refresh-token");
    return new Response(null, { status: revokeOk ? 200 : 503 });
  };
  await assert.rejects(deleteRequest(owner.headers, { password }), /APPLE_REVOCATION_FAILED/);
  assert.ok(revokeCalled);
  assert.equal(
    (await sql.query('select id from "user" where id=$1', [owner.session.user.id])).length,
    1,
  );
  revokeOk = true;
  assert.equal((await deleteRequest(owner.headers, { password })).status, 200);
  assert.equal(
    (await sql.query('select id from "user" where id=$1', [owner.session.user.id])).length,
    0,
  );
  assert.equal(
    (await sql.query("select * from preacher_state where user_id=$1", [owner.session.user.id]))
      .length,
    0,
  );
  assert.equal(
    await auth.api.getSession({ headers: owner.headers, query: { disableCookieCache: true } }),
    null,
  );
  assert.equal(
    (await sql.query("select * from preacher_state where user_id=$1", [other.session.user.id]))
      .length,
    1,
  );
  assert.equal((await deleteRequest(other.headers, { password })).status, 200);
  console.log(
    "PASS: real email session, PKCE callback/exchange, CSRF/replay rejection, password/fresh-session checks, Apple revocation failure/retry, data deletion and account isolation",
  );
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
