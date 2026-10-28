import { createPrivateKey, sign } from "node:crypto";
import { importPKCS8, SignJWT } from "jose";

export function appleConfigured(env = process.env): boolean {
  return [env.APPLE_CLIENT_ID, env.APPLE_TEAM_ID, env.APPLE_KEY_ID, env.APPLE_PRIVATE_KEY].every(
    (value) => Boolean(value?.trim()),
  );
}

/** Five-minute client secrets are generated only on the server, never shipped to iOS. */
export async function appleClientSecret(env = process.env): Promise<string> {
  if (!appleConfigured(env)) throw new Error("APPLE_NOT_CONFIGURED");
  const key = await importPKCS8(env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"), "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.APPLE_KEY_ID! })
    .setIssuer(env.APPLE_TEAM_ID!)
    .setSubject(env.APPLE_CLIENT_ID!)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

const SECRET_LIFETIME_SECONDS = 60 * 60;
const SECRET_RENEW_MARGIN_SECONDS = 5 * 60;
let cachedSecret: { key: string; value: string; expiresAt: number } | null = null;

function base64url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

/**
 * Better Auth resolves provider options once per server instance, so a fixed
 * string secret goes stale and Apple answers `invalid_client`. Reading this on
 * every token request (via a getter) keeps a valid one-hour secret, renewed
 * five minutes before it expires. Synchronous because getters cannot await.
 */
export function currentAppleClientSecret(env = process.env, now = Date.now()): string {
  if (!appleConfigured(env)) throw new Error("APPLE_NOT_CONFIGURED");
  const nowSeconds = Math.floor(now / 1000);
  const cacheKey = [env.APPLE_CLIENT_ID, env.APPLE_TEAM_ID, env.APPLE_KEY_ID].join("|");
  if (
    cachedSecret &&
    cachedSecret.key === cacheKey &&
    cachedSecret.expiresAt - SECRET_RENEW_MARGIN_SECONDS > nowSeconds
  ) {
    return cachedSecret.value;
  }
  const expiresAt = nowSeconds + SECRET_LIFETIME_SECONDS;
  const header = base64url(JSON.stringify({ alg: "ES256", kid: env.APPLE_KEY_ID }));
  const payload = base64url(
    JSON.stringify({
      iss: env.APPLE_TEAM_ID,
      iat: nowSeconds,
      exp: expiresAt,
      aud: "https://appleid.apple.com",
      sub: env.APPLE_CLIENT_ID,
    }),
  );
  const key = createPrivateKey(env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  const signature = sign("sha256", Buffer.from(`${header}.${payload}`), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  const value = `${header}.${payload}.${base64url(signature)}`;
  cachedSecret = { key: cacheKey, value, expiresAt };
  return value;
}

export async function revokeAppleToken(
  token: string,
  env = process.env,
  send = fetch,
): Promise<void> {
  const response = await send("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.APPLE_CLIENT_ID!,
      client_secret: await appleClientSecret(env),
      token,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  // Fail closed: retain the account and allow retry when Apple cannot revoke it.
  if (!response.ok) throw new Error("APPLE_REVOCATION_FAILED");
}
