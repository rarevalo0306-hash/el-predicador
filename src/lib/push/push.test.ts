import assert from "node:assert/strict";
import { test } from "node:test";
import { exportPKCS8, generateKeyPair, jwtVerify } from "jose";
import type { Sql } from "../db.ts";
import { apnsProviderToken, isDeadToken, sendApns, type ApnsTransport } from "./apns.server.ts";
import {
  dailyPayload,
  dueDevices,
  localDayAndHour,
  parseDeviceInput,
  runDailyPush,
  type PushDevice,
} from "./daily.server.ts";

const TOKEN = "a".repeat(64);

async function apnsEnv() {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  return {
    publicKey,
    env: {
      APNS_KEY_ID: "KEYPUSH001",
      APNS_TEAM_ID: "TEAMTEST01",
      APNS_PRIVATE_KEY: (await exportPKCS8(privateKey)).replace(/\n/g, "\\n"),
    },
  };
}

test("The APNs provider token is ES256, signed by the team and reused for 50 minutes", async () => {
  const { env, publicKey } = await apnsEnv();
  const now = Date.UTC(2026, 9, 28, 12);
  const token = apnsProviderToken(env, now);
  const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
    issuer: "TEAMTEST01",
    currentDate: new Date(now),
  });
  assert.equal(protectedHeader.kid, "KEYPUSH001");
  assert.equal(payload.iat, now / 1000);
  assert.equal(apnsProviderToken(env, now + 49 * 60_000), token);
  assert.notEqual(apnsProviderToken(env, now + 51 * 60_000), token);
  assert.throws(() => apnsProviderToken({}), /APNS_NOT_CONFIGURED/);
});

test("Each push goes to the app's topic with an alert payload, and dead tokens are recognised", async () => {
  const { env } = await apnsEnv();
  const seen: {
    environment: string;
    token: string;
    headers: Record<string, string>;
    body: string;
  }[] = [];
  const transport: ApnsTransport = async (environment, token, headers, body) => {
    seen.push({ environment, token, headers, body });
    return token === TOKEN
      ? { status: 200, body: "" }
      : { status: 410, body: '{"reason":"Unregistered"}' };
  };
  const results = await sendApns(
    [
      { token: TOKEN, environment: "production" },
      { token: "b".repeat(64), environment: "sandbox" },
    ],
    dailyPayload("es", { ref: "Juan 3:16", url: "https://www.thepreacher.app/?leer=Juan+3:16" }),
    transport,
    env,
  );
  assert.equal(seen[0]!.headers["apns-topic"], "app.thepreacher.ios");
  assert.equal(seen[0]!.headers["apns-push-type"], "alert");
  assert.match(seen[0]!.headers.authorization!, /^bearer /);
  assert.equal(seen[1]!.environment, "sandbox");
  const body = JSON.parse(seen[0]!.body);
  assert.equal(body.aps.alert.title, "Tu palabra de hoy");
  assert.equal(body.aps.alert.body, "Juan 3:16 · Toca para leerlo");
  assert.equal(body.url, "https://www.thepreacher.app/?leer=Juan+3:16");
  assert.equal(isDeadToken(results[0]!), false);
  assert.equal(isDeadToken(results[1]!), true);
  assert.equal(isDeadToken({ token: "x", status: 400, reason: "BadDeviceToken" }), true);
  assert.equal(isDeadToken({ token: "x", status: 429, reason: "TooManyRequests" }), false);
});

test("Reminders follow each device's own time zone and go out once a day", () => {
  const now = new Date("2026-10-28T12:30:00Z"); // 08:30 in New York, 06:30 in Managua
  assert.deepEqual(localDayAndHour("America/New_York", now), { day: "2026-10-28", hour: 8 });
  assert.equal(localDayAndHour("Not/AZone", now), null);
  const device = (over: Partial<PushDevice>): PushDevice => ({
    token: TOKEN,
    environment: "production",
    hour: 8,
    locale: "es",
    time_zone: "America/New_York",
    last_sent_day: null,
    ...over,
  });
  assert.equal(dueDevices([device({})], now).length, 1);
  assert.equal(dueDevices([device({ time_zone: "America/Managua" })], now).length, 0);
  assert.equal(dueDevices([device({ last_sent_day: "2026-10-28" })], now).length, 0);
});

test("Only valid registrations are accepted", () => {
  const ok = {
    token: TOKEN,
    hour: 7,
    locale: "en",
    timeZone: "America/Managua",
    environment: "sandbox",
  };
  assert.deepEqual(parseDeviceInput(ok), {
    token: TOKEN,
    hour: 7,
    locale: "en",
    timeZone: "America/Managua",
    environment: "sandbox",
  });
  assert.equal(parseDeviceInput({ ...ok, token: "short" }), null);
  assert.equal(parseDeviceInput({ ...ok, hour: 24 }), null);
  assert.equal(parseDeviceInput({ ...ok, timeZone: "Mars/Base" }), null);
  assert.equal(parseDeviceInput(null), null);
});

test("A run sends to due devices, records the day and forgets dead tokens", async () => {
  const { env } = await apnsEnv();
  const dead = "c".repeat(64);
  const writes: { text: string; params: unknown[] }[] = [];
  const sql = {
    query: async (text: string, params: unknown[] = []) => {
      if (text.startsWith("select")) {
        return [TOKEN, dead].map((token) => ({
          token,
          environment: "production",
          hour: 8,
          locale: "es",
          time_zone: "America/New_York",
          last_sent_day: null,
        }));
      }
      writes.push({ text, params });
      return [];
    },
  } as unknown as Sql;
  const transport: ApnsTransport = async (_env, token) =>
    token === TOKEN
      ? { status: 200, body: "" }
      : { status: 410, body: '{"reason":"Unregistered"}' };
  const result = await runDailyPush(
    sql,
    new Date("2026-10-28T12:30:00Z"),
    (day) => ({ ref: `ref-${day}`, url: "https://www.thepreacher.app/" }),
    transport,
    env,
  );
  assert.deepEqual(result, { due: 2, sent: 1, removed: 1 });
  assert.deepEqual(writes[0]!.params, [TOKEN, "2026-10-28"]);
  assert.match(writes[1]!.text, /^delete/);
});
