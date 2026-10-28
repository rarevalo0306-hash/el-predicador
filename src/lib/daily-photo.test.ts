import assert from "node:assert/strict";
import { test } from "node:test";
import type { Sql } from "./db.ts";
import {
  dailyPhotoPrompt,
  dayKeysAround,
  ensureDailyPhotos,
  generateDailyImage,
  imageFromResponse,
} from "./daily-photo.server.ts";

const PNG = Buffer.from("fake-image").toString("base64");

test("The picture prompt carries only the theme scene, never Scripture text", () => {
  const prompt = dailyPhotoPrompt("paz");
  assert.match(prompt, /calm lake/);
  assert.match(prompt, /No people/);
  assert.ok(!/LBLA|Señor|Jehová/.test(prompt));
});

test("Images are found in the Interactions and generateContent response shapes", () => {
  const interactions = { output_image: { data: PNG, mime_type: "image/jpeg" } };
  const steps = {
    steps: [
      { type: "model_output", content: [{ type: "image", data: PNG, mime_type: "image/png" }] },
    ],
  };
  const legacy = {
    candidates: [
      {
        content: { parts: [{ text: "x" }, { inlineData: { data: PNG, mimeType: "image/jpeg" } }] },
      },
    ],
  };
  for (const body of [interactions, steps, legacy]) {
    const image = imageFromResponse(body);
    assert.ok(image);
    assert.equal(image.data.toString(), "fake-image");
  }
  assert.equal(imageFromResponse({ output_text: "no image" }), null);
});

test("The provider call sends the key in a header and asks for one vertical JPEG", async () => {
  let sent: { url: string; init: RequestInit } | null = null;
  const image = await generateDailyImage("prompt", { GEMINI_API_KEY: "test-key" }, (async (
    url: string,
    init: RequestInit,
  ) => {
    sent = { url, init };
    return Response.json({ output_image: { data: PNG, mime_type: "image/jpeg" } });
  }) as unknown as typeof fetch);
  assert.equal(image.mime, "image/jpeg");
  assert.ok(sent);
  const { url, init } = sent as { url: string; init: RequestInit };
  assert.ok(!url.includes("test-key"));
  assert.equal((init.headers as Record<string, string>)["x-goog-api-key"], "test-key");
  const body = JSON.parse(String(init.body));
  assert.equal(body.response_format.aspect_ratio, "3:4");
  await assert.rejects(generateDailyImage("p", {}), /DAILY_PHOTO_NOT_CONFIGURED/);
  await generateDailyImage("p", { GOOGLE_GENERATIVE_AI_API_KEY: "other-name" }, (async (
    _url: string,
    init: RequestInit,
  ) => {
    assert.equal((init.headers as Record<string, string>)["x-goog-api-key"], "other-name");
    return Response.json({ output_image: { data: PNG, mime_type: "image/jpeg" } });
  }) as unknown as typeof fetch);
  await assert.rejects(
    generateDailyImage(
      "p",
      { GEMINI_API_KEY: "k" },
      (async () => new Response("", { status: 429 })) as typeof fetch,
    ),
    /DAILY_PHOTO_PROVIDER_429/,
  );
});

test("Each day is generated once and kept", async () => {
  const stored = new Map<string, unknown[]>();
  const sql = {
    query: async (text: string, params: unknown[] = []) => {
      if (text.startsWith("select")) return stored.has(params[0] as string) ? [{}] : [];
      if (text.startsWith("insert")) stored.set(params[0] as string, params);
      return [];
    },
  } as unknown as Sql;
  const pick = () => ({ theme: "paz" as const, verse: { ref: "Salmos 23:1" } });
  let calls = 0;
  const generate = async () => {
    calls++;
    return { mime: "image/jpeg", data: Buffer.from("x") };
  };
  const days = dayKeysAround(new Date("2026-10-28T04:07:00Z"));
  assert.deepEqual(days, ["2026-10-28", "2026-10-29"]);
  assert.deepEqual(await ensureDailyPhotos(sql, days, pick, generate), days);
  assert.deepEqual(await ensureDailyPhotos(sql, days, pick, generate), []);
  assert.equal(calls, 2);
  const row = stored.get("2026-10-28")!;
  assert.equal(row[1], "paz");
  assert.equal(row[2], "Salmos 23:1");
});
