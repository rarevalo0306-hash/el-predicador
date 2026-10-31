import type { Sql } from "./db";
import type { ThemeId } from "./verses";

type DailyPick = (offset: number, date: Date) => { theme: ThemeId; verse: { ref: string } };

/** English mood words for the picture; no Scripture text is ever sent. */
const THEME_SCENES: Record<ThemeId, string> = {
  paz: "a calm lake at dawn, still water, soft mist",
  fortaleza: "a mountain ridge in strong morning light",
  esperanza: "first sunlight breaking over hills after rain",
  familia: "a warm countryside home with lit windows at dusk",
  jovenes: "an open path through a bright meadow",
  matrimonios: "two old trees with branches intertwined in golden light",
  amistad: "two benches under a large shade tree in a park",
  oracion: "a quiet chapel-like forest clearing with rays of light",
  amor: "a field of wildflowers in warm evening light",
  fe: "a lighthouse on a rocky coast under a clearing sky",
  gratitud: "a harvest field with sheaves of wheat at sunset",
  bendicion: "gentle rain falling on a green valley with sunlight",
  consuelo: "a sheltered cove with gentle waves and soft clouds",
  sabiduria: "an ancient olive grove in calm morning light",
  perdon: "a river flowing clear after a storm, sky opening",
  evangelio: "a road leading toward a sunrise over the horizon",
};

export function dailyPhotoPrompt(theme: ThemeId) {
  return [
    `A serene, photorealistic landscape photograph: ${THEME_SCENES[theme]}.`,
    "Natural colors, soft light, peaceful and reverent mood, vertical composition",
    "with calm empty space in the lower half for text.",
    "No people, no faces, no religious figures or symbols, no text, no letters, no watermark.",
  ].join(" ");
}

type GeneratedImage = { mime: string; data: Buffer };

/** Pulls the first base64 image out of the response shapes Gemini uses. */
export function imageFromResponse(body: unknown): GeneratedImage | null {
  const seen = new Set<unknown>();
  const stack: unknown[] = [body];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    const item = node as Record<string, unknown>;
    const inline = (item.inlineData ?? item.inline_data) as Record<string, unknown> | undefined;
    const candidate = inline ?? item;
    const data = candidate.data;
    const mime = candidate.mimeType ?? candidate.mime_type;
    if (typeof data === "string" && typeof mime === "string" && mime.startsWith("image/")) {
      return { mime, data: Buffer.from(data, "base64") };
    }
    for (const value of Object.values(item))
      if (value && typeof value === "object") stack.push(value);
  }
  return null;
}

/** Google's key under either common name. */
function geminiKey(env: NodeJS.ProcessEnv | Record<string, string | undefined>) {
  return env.GEMINI_API_KEY?.trim() || env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || "";
}

const DEFAULT_MODEL = "gemini-3.1-flash-lite-image";

/** Google's own explanation of a rejected request; never includes the key. */
async function providerReason(response: Response) {
  try {
    const body = (await response.json()) as { error?: { message?: string; status?: string } };
    return [body.error?.status, body.error?.message].filter(Boolean).join(": ").slice(0, 300);
  } catch {
    return "";
  }
}

export async function generateDailyImage(
  prompt: string,
  env = process.env,
  send: typeof fetch = fetch,
): Promise<GeneratedImage> {
  const key = geminiKey(env);
  if (!key) throw new Error("DAILY_PHOTO_NOT_CONFIGURED");
  const model = env.DAILY_PHOTO_MODEL?.trim() || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const request = (generationConfig: Record<string, unknown>) =>
    send(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
      signal: AbortSignal.timeout(60_000),
    });
  let response = await request({
    responseModalities: ["IMAGE"],
    imageConfig: { aspectRatio: env.DAILY_PHOTO_ASPECT?.trim() || "3:4", imageSize: "1K" },
  });
  // Some models refuse image-only output or the size options: retry once plainly.
  if (response.status === 400) {
    console.warn("[daily-photo] provider rejected options, retrying", {
      reason: await providerReason(response),
    });
    response = await request({ responseModalities: ["TEXT", "IMAGE"] });
  }
  if (!response.ok) {
    const reason = await providerReason(response);
    throw new Error(`DAILY_PHOTO_PROVIDER_${response.status}${reason ? ` ${reason}` : ""}`);
  }
  const image = imageFromResponse(await response.json());
  if (!image) throw new Error("DAILY_PHOTO_NO_IMAGE");
  return image;
}

export function dailyPhotoEnabled(env = process.env) {
  return env.DAILY_PHOTO_ENABLED === "true" && Boolean(geminiKey(env));
}

/** Day keys to prepare: today and tomorrow in UTC cover every user's local day. */
export function dayKeysAround(now = new Date()) {
  const key = (date: Date) => date.toISOString().slice(0, 10);
  return [key(now), key(new Date(now.getTime() + 86_400_000))];
}

function localDate(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 12);
}

/** Generates and stores the pictures still missing. One provider call per day at most. */
export async function ensureDailyPhotos(
  sql: Sql,
  days: string[],
  pick: DailyPick,
  generate: (prompt: string) => Promise<GeneratedImage> = (prompt) => generateDailyImage(prompt),
) {
  const done: string[] = [];
  for (const day of days) {
    const existing = await sql.query("select 1 from daily_photos where day = $1", [day]);
    if (existing.length) continue;
    const { theme, verse } = pick(0, localDate(day));
    const image = await generate(dailyPhotoPrompt(theme));
    await sql.query(
      "insert into daily_photos (day, theme, ref, mime, data) values ($1, $2, $3, $4, $5) on conflict (day) do nothing",
      [day, theme, verse.ref, image.mime, image.data],
    );
    done.push(day);
  }
  // Keep a short history only.
  await sql.query("delete from daily_photos where created_at < now() - interval '14 days'");
  return done;
}
