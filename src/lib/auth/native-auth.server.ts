import { symmetricEncrypt, symmetricDecrypt } from "better-auth/crypto";
import { auth, SESSION_TOKEN_COOKIE } from "./server";
import { getSql } from "../db";
import { consumeNativeCode, issueNativeCode, validNativeIntent } from "./native-handoff";
import { appleConfigured } from "./apple.server";

const INTENT_COOKIE = "__Host-preacher_native_intent";
const privateHeaders = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};
function cookie(request: Request, name: string): string | undefined {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(name + "="))
    ?.slice(name.length + 1);
  try {
    return value ? decodeURIComponent(value) : undefined;
  } catch {
    return undefined;
  }
}
function failure(status = 400) {
  return Response.json(
    { error: "No se pudo completar el acceso. Vuelve a intentarlo desde la app." },
    { status, headers: privateHeaders },
  );
}

/** Only fixed, first-party callback destinations. Provider secrets stay in Better Auth. */
export async function startNativeAuth(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const challenge = url.searchParams.get("challenge");
  const state = url.searchParams.get("state");
  const provider = url.searchParams.get("provider");
  if (!validNativeIntent(challenge, state) || !["google", "apple"].includes(provider ?? ""))
    return failure();
  if (provider === "apple" && !appleConfigured()) return failure(503);
  try {
    const context = await auth.$context;
    const intent = await symmetricEncrypt({
      key: context.secretConfig,
      data: JSON.stringify({ challenge, state, issued: Date.now() }),
    });
    const back = `${url.origin}/api/native-auth/complete`;
    const response = await auth.api.signInSocial({
      headers: request.headers,
      body: {
        provider: provider as "google" | "apple",
        callbackURL: back,
        errorCallbackURL: `${back}?error=1`,
      },
      asResponse: true,
    });
    if (!response.ok) return failure(503);
    const body = (await response.json()) as { url?: string };
    if (!body.url || new URL(body.url).protocol !== "https:") return failure(503);
    const headers = new Headers({ ...privateHeaders, location: body.url });
    for (const setCookie of response.headers.getSetCookie())
      headers.append("set-cookie", setCookie);
    headers.append(
      "set-cookie",
      `${INTENT_COOKIE}=${encodeURIComponent(intent)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`,
    );
    return new Response(null, { status: 302, headers });
  } catch {
    return failure(503);
  }
}

export async function completeNativeAuth(request: Request): Promise<Response> {
  try {
    const encryptedIntent = cookie(request, INTENT_COOKIE);
    if (!encryptedIntent) return failure();
    const context = await auth.$context;
    const intent = JSON.parse(
      await symmetricDecrypt({ key: context.secretConfig, data: encryptedIntent }),
    ) as { challenge?: string; state?: string; issued?: number };
    if (
      !validNativeIntent(intent.challenge, intent.state) ||
      typeof intent.issued !== "number" ||
      Date.now() - intent.issued > 600_000 ||
      intent.issued > Date.now()
    )
      return failure();
    const callback = new URL("thepreacher://auth");
    callback.searchParams.set("state", intent.state!);
    if (new URL(request.url).searchParams.has("error")) {
      callback.searchParams.set("error", "sign_in_failed");
    } else {
      const session = await auth.api.getSession({
        headers: request.headers,
        query: { disableCookieCache: true },
      });
      const signedCookie = cookie(request, SESSION_TOKEN_COOKIE);
      if (!session || !signedCookie) return failure(401);
      const encrypted = await symmetricEncrypt({ key: context.secretConfig, data: signedCookie });
      const code = await issueNativeCode(await getSql(), {
        userId: session.user.id,
        sessionId: session.session.id,
        challenge: intent.challenge!,
        ciphertext: encrypted,
      });
      callback.searchParams.set("code", code);
    }
    const headers = new Headers({ ...privateHeaders, location: callback.toString() });
    headers.append(
      "set-cookie",
      `${INTENT_COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
    return new Response(null, { status: 302, headers });
  } catch {
    return failure();
  }
}

export async function exchangeNativeAuth(request: Request): Promise<Response> {
  // Native URLSession sends no Origin; browser callers must be first-party.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return failure(403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return failure(415);
  if (Number(request.headers.get("content-length") || 0) > 2048) return failure(413);
  try {
    const text = await request.text();
    if (text.length > 2048) return failure(413);
    const { code, verifier } = JSON.parse(text) as { code?: unknown; verifier?: unknown };
    const encrypted = await consumeNativeCode(await getSql(), code, verifier);
    if (!encrypted) return failure(401);
    const context = await auth.$context;
    const signedCookie = await symmetricDecrypt({ key: context.secretConfig, data: encrypted });
    const headers = new Headers(privateHeaders);
    headers.append(
      "set-cookie",
      `${SESSION_TOKEN_COOKIE}=${encodeURIComponent(signedCookie)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${context.sessionConfig.expiresIn}`,
    );
    return Response.json({ ok: true }, { headers });
  } catch {
    return failure();
  }
}
