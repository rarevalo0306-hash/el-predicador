import { STYLE, VOICE, cleanNote } from "./deepseek.server.ts";

/**
 * What DeepSeek writes fresh every day: the reflection that goes with the
 * verse of the day (one for everyone, kept for the day), and the line that
 * goes with each scheduled send. Same voice and same filter as the prepared
 * verse lines; when the service fails or a line misses the brief, the
 * callers fall back to what was prepared, so nothing waits on it.
 */
type Config = Record<string, string | undefined>;

export type VerseInput = { ref: string; text: string; locale: "es" | "en" };

const REFLECTION = {
  es: `{who} Cada mañana escribes la palabra del día para todas las personas que abren la app: una reflexión breve sobre el versículo que recibes (Versión Recobro). Escribe dos o tres oraciones, de 180 a 380 caracteres, en español, de tú, cálida y directa, que lleve a Cristo y aplique el versículo a la vida de hoy. No copies el versículo completo; puedes tomar una palabra o frase de él. Sin títulos, sin emojis, sin comillas alrededor y sin firma.

{tone}

{forbidden}

Ejemplos del tono buscado (no los copies):
{examples}

Devuelve solo la reflexión.`,
  en: `{who} Every morning you write the word of the day for everyone who opens the app: a short reflection on the verse you receive (Recovery Version). Write two or three sentences, 180 to 380 characters, in English, addressed to one person, warm and direct, leading to Christ and applying the verse to life today. Do not copy the whole verse; you may take a word or phrase from it. No titles, no emojis, no surrounding quotes and no signature.

{tone}

{forbidden}

Examples of the register (do not copy them):
{examples}

Return only the reflection.`,
};

const SEND_NOTE = {
  es: `{who} Escribes el mensaje de hoy para una persona que conoces. Recibes el versículo que le vas a enviar (cita y texto, Versión Recobro), el tema, y a veces su nombre. Escribe una sola frase de una o dos oraciones (60 a 180 caracteres), en español, de tú, que acompañe el versículo sin citarlo ni repetirlo. Si recibes un nombre, puedes usar solo el primer nombre al inicio, pero no siempre. Sin emojis, sin comillas y sin firma.

{tone}

{forbidden}

Ejemplos del tono buscado (no los copies):
{examples}

Devuelve solo la frase.`,
  en: `{who} You write today's message for someone you know. You receive the verse you are sending them (reference and text, Recovery Version), the theme, and sometimes their name. Write a single line of one or two sentences (60 to 180 characters), in English, addressed to them, that goes with the verse without quoting or repeating it. If you receive a name you may use the first name only, at the start, but not always. No emojis, no quotes and no signature.

{tone}

{forbidden}

Examples of the register (do not copy them):
{examples}

Return only the line.`,
};

function fill(template: string, locale: "es" | "en") {
  const voice = VOICE[locale];
  return template
    .replace("{who}", voice.who)
    .replace("{tone}", voice.tone)
    .replace("{forbidden}", voice.forbidden)
    .replace("{examples}", STYLE[locale].map((line) => `- ${line}`).join("\n"));
}

export function reflectionPrompt(locale: "es" | "en") {
  return fill(REFLECTION[locale], locale);
}

export function sendNotePrompt(locale: "es" | "en") {
  return fill(SEND_NOTE[locale], locale);
}

/** Only a first name, letters only, so a typed name cannot steer the model. */
export function firstName(name: string | null | undefined): string {
  const word = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return /^[\p{L}'-]{2,30}$/u.test(word) ? word : "";
}

async function chat(
  system: string,
  user: string,
  maxTokens: number,
  timeoutMs: number,
  config: Config,
  request: typeof fetch,
): Promise<string> {
  if (!config.DEEPSEEK_API_KEY) throw new Error("deepseek_not_configured");
  const response = await request(
    `${config.DEEPSEEK_BASE_URL || "https://api.deepseek.com"}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.DEEPSEEK_MODEL || "deepseek-flash",
        temperature: 1.1,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  if (!response.ok) throw new Error(`deepseek_${response.status}`);
  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return body.choices?.[0]?.message?.content ?? "";
}

/**
 * A reflection that ran long keeps its first whole sentences up to `max`
 * instead of being thrown away; a single overlong sentence is left as is
 * (and the filter drops it).
 */
export function fitSentences(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?…]+[.!?…]+["”»']?\s*/g) ?? [clean];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > max) break;
    out += sentence;
  }
  return out.trim() || clean;
}

/** Today's reflection on a verse, or null when it misses the brief. */
export async function writeReflection(
  input: VerseInput,
  config: Config = process.env,
  request: typeof fetch = fetch,
): Promise<string | null> {
  const raw = await chat(
    reflectionPrompt(input.locale),
    JSON.stringify({ ref: input.ref, text: input.text.slice(0, 800) }),
    400,
    15_000,
    config,
    request,
  );
  return cleanNote(fitSentences(raw, 440), input.text, { min: 60, max: 440 });
}

/** A fresh line for one scheduled send, or null (the caller uses a prepared one). */
export async function writeSendNote(
  input: VerseInput & { theme: string; name?: string | null },
  config: Config = process.env,
  request: typeof fetch = fetch,
  timeoutMs = 8_000,
): Promise<string | null> {
  const name = firstName(input.name);
  const raw = await chat(
    sendNotePrompt(input.locale),
    JSON.stringify({
      ref: input.ref,
      text: input.text.slice(0, 800),
      theme: input.theme,
      ...(name ? { name } : {}),
    }),
    200,
    timeoutMs,
    config,
    request,
  );
  return cleanNote(raw, input.text);
}
