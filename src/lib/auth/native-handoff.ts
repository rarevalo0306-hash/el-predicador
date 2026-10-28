import { createHash, randomBytes } from "node:crypto";
import type { Sql } from "../db";

const BASE64URL = /^[A-Za-z0-9_-]{43,128}$/;
export const hashCode = (value: string) => createHash("sha256").update(value).digest("hex");
export const challengeFor = (verifier: string) =>
  createHash("sha256").update(verifier).digest("base64url");
export function validNativeIntent(challenge: unknown, state: unknown): boolean {
  return (
    typeof challenge === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(challenge) &&
    typeof state === "string" &&
    BASE64URL.test(state)
  );
}

export async function issueNativeCode(
  sql: Sql,
  input: { userId: string; sessionId: string; challenge: string; ciphertext: string },
): Promise<string> {
  const code = randomBytes(32).toString("base64url");
  await sql.query("delete from native_auth_handoffs where expires_at <= now() or user_id = $1", [
    input.userId,
  ]);
  await sql.query(
    "insert into native_auth_handoffs (code_hash, challenge, cookie_ciphertext, session_id, user_id, expires_at) values ($1,$2,$3,$4,$5,now() + interval '2 minutes')",
    [hashCode(code), input.challenge, input.ciphertext, input.sessionId, input.userId],
  );
  return code;
}

/** A single atomic DELETE prevents replay, including simultaneous exchange attempts. */
export async function consumeNativeCode(
  sql: Sql,
  code: unknown,
  verifier: unknown,
): Promise<string | null> {
  if (
    typeof code !== "string" ||
    !BASE64URL.test(code) ||
    typeof verifier !== "string" ||
    !BASE64URL.test(verifier)
  )
    return null;
  const rows = await sql.query<{ cookie_ciphertext: string }>(
    `delete from native_auth_handoffs h where h.code_hash=$1 and h.challenge=$2 and h.expires_at>now()
     and exists (select 1 from session s where s.id=h.session_id and s."expiresAt">now())
     returning h.cookie_ciphertext`,
    [hashCode(code), challengeFor(verifier)],
  );
  return rows[0]?.cookie_ciphertext ?? null;
}
