import { createPrivateKey, sign } from "node:crypto";
import { connect, type ClientHttp2Session } from "node:http2";

export type ApnsEnvironment = "production" | "sandbox";
export type ApnsPayload = Record<string, unknown>;
export type ApnsResult = { token: string; status: number; reason?: string };
type Env = Record<string, string | undefined>;

const TOPIC = "app.thepreacher.ios";
const HOSTS: Record<ApnsEnvironment, string> = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
};

export function apnsConfigured(env: Env = process.env) {
  return Boolean(
    env.APNS_KEY_ID?.trim() && env.APNS_TEAM_ID?.trim() && env.APNS_PRIVATE_KEY?.trim(),
  );
}

let cachedToken: { key: string; value: string; issuedAt: number } | null = null;

/** Provider token for APNs: ES256, reused for 50 minutes (Apple allows up to 60). */
export function apnsProviderToken(env: Env = process.env, now = Date.now()): string {
  if (!apnsConfigured(env)) throw new Error("APNS_NOT_CONFIGURED");
  const issuedAt = Math.floor(now / 1000);
  const cacheKey = `${env.APNS_TEAM_ID}|${env.APNS_KEY_ID}`;
  if (cachedToken && cachedToken.key === cacheKey && issuedAt - cachedToken.issuedAt < 50 * 60) {
    return cachedToken.value;
  }
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "ES256", kid: env.APNS_KEY_ID })}.${encode({ iss: env.APNS_TEAM_ID, iat: issuedAt })}`;
  const key = createPrivateKey(env.APNS_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  const signature = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" });
  const value = `${unsigned}.${signature.toString("base64url")}`;
  cachedToken = { key: cacheKey, value, issuedAt };
  return value;
}

/** Sends over the HTTP/2 connection APNs requires; one session per environment. */
export type ApnsTransport = (
  environment: ApnsEnvironment,
  token: string,
  headers: Record<string, string>,
  body: string,
) => Promise<{ status: number; body: string }>;

export function http2Transport(): ApnsTransport & { close: () => void } {
  const sessions = new Map<ApnsEnvironment, ClientHttp2Session>();
  const send: ApnsTransport = (environment, token, headers, body) =>
    new Promise((resolve, reject) => {
      let session = sessions.get(environment);
      if (!session || session.closed || session.destroyed) {
        session = connect(HOSTS[environment]);
        session.on("error", () => sessions.delete(environment));
        sessions.set(environment, session);
      }
      const request = session.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        "content-type": "application/json",
        ...headers,
      });
      let status = 0;
      let data = "";
      request.setTimeout(10_000, () => request.close());
      request.on("response", (h) => (status = Number(h[":status"] ?? 0)));
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => (data += chunk));
      request.on("end", () => resolve({ status, body: data }));
      request.on("error", reject);
      request.end(body);
    });
  return Object.assign(send, {
    close: () => {
      for (const session of sessions.values()) session.close();
      sessions.clear();
    },
  });
}

export async function sendApns(
  devices: { token: string; environment: ApnsEnvironment }[],
  payload: ApnsPayload,
  transport: ApnsTransport,
  env: Env = process.env,
): Promise<ApnsResult[]> {
  const headers = {
    authorization: `bearer ${apnsProviderToken(env)}`,
    "apns-topic": TOPIC,
    "apns-push-type": "alert",
    "apns-priority": "10",
  };
  const body = JSON.stringify(payload);
  const results: ApnsResult[] = [];
  for (const device of devices) {
    try {
      const response = await transport(device.environment, device.token, headers, body);
      let reason: string | undefined;
      try {
        reason = response.body
          ? (JSON.parse(response.body) as { reason?: string }).reason
          : undefined;
      } catch {
        reason = undefined;
      }
      results.push({ token: device.token, status: response.status, reason });
    } catch {
      results.push({ token: device.token, status: 0, reason: "network" });
    }
  }
  return results;
}

/** Apple says the token will never work again: forget the device. */
export function isDeadToken(result: ApnsResult) {
  return (
    result.status === 410 ||
    (result.status === 400 &&
      ["BadDeviceToken", "DeviceTokenNotForTopic"].includes(result.reason ?? ""))
  );
}
