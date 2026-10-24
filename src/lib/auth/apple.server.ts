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
