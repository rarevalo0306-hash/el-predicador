/**
 * Short lines of encouragement to go with a verse, written once by DeepSeek
 * and kept in the database. Nothing here runs at send time: the worker only
 * reads what was prepared, so a message never waits on this service.
 */
type Config = Record<string, string | undefined>;

export type NoteRequest = { id: string; ref: string; text: string };

const PROMPT = {
  es: `Eres un pastor evangélico hispano que escribe mensajes de texto breves y cálidos a personas que conoce. Para cada versículo recibirás su cita y su texto. Escribe {n} frases distintas de ánimo, cada una de una o dos oraciones (60 a 160 caracteres), en español, dirigidas a una sola persona de tú, que acompañen el versículo sin citarlo ni repetirlo, sin añadir doctrina ni promesas propias, sin emojis, sin hashtags, sin signos de exclamación seguidos, y sin nombrar a la persona. Devuelve solo JSON con la forma {"notes": {"<id>": ["frase", "frase", "frase"]}} usando exactamente los ids recibidos.`,
  en: `You are a Hispanic evangelical pastor writing short, warm text messages to people you know. For each verse you receive its reference and text. Write {n} different lines of encouragement, each one or two sentences (60 to 160 characters), in English, addressed to one person, that go with the verse without quoting or repeating it, without adding doctrine or promises of your own, without emojis, hashtags or stacked exclamation marks, and without naming the person. Return only JSON shaped {"notes": {"<id>": ["line", "line", "line"]}} using exactly the ids received.`,
};

export function deepseekConfigured(config: Config = process.env) {
  return Boolean(config.DEEPSEEK_API_KEY);
}

/** A line the model wrote, or null when it does not fit the brief. */
export function cleanNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 20 || text.length > 220) return null;
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)) return null;
  return text;
}

export async function generateVerseNotes(
  verses: NoteRequest[],
  locale: "es" | "en",
  perVerse = 3,
  config: Config = process.env,
  request: typeof fetch = fetch,
): Promise<Record<string, string[]>> {
  if (!config.DEEPSEEK_API_KEY) throw new Error("deepseek_not_configured");
  const response = await request("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.DEEPSEEK_MODEL || "deepseek-flash",
      temperature: 1.1,
      max_tokens: 400 * verses.length + 200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PROMPT[locale].replace("{n}", String(perVerse)) },
        {
          role: "user",
          content: JSON.stringify(
            verses.map((v) => ({ id: v.id, ref: v.ref, text: v.text.slice(0, 600) })),
          ),
        },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`deepseek_${response.status}`);
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = body.choices?.[0]?.message?.content ?? "";
  let parsed: { notes?: Record<string, unknown> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("deepseek_bad_json");
  }
  const out: Record<string, string[]> = {};
  for (const verse of verses) {
    const list = parsed.notes?.[verse.id];
    const notes = (Array.isArray(list) ? list : [])
      .map(cleanNote)
      .filter((n): n is string => n !== null);
    out[verse.id] = [...new Set(notes)].slice(0, perVerse);
  }
  return out;
}
