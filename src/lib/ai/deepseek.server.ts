/**
 * Short lines of encouragement to go with a verse, written once by DeepSeek
 * and kept in the database. Nothing here runs at send time: the worker only
 * reads what was prepared, so a message never waits on this service.
 */
type Config = Record<string, string | undefined>;

export type NoteRequest = { id: string; ref: string; text: string };

/**
 * The voice: a believer nourished by the ministry of Watchman Nee and
 * Witness Lee, writing to one person. The stance on God follows the app's own
 * doctrine page (Identidad de Dios): one God, eternal, invisible and Spirit,
 * fully manifested in Jesus Christ, working in His children by His Spirit.
 * Sample lines set the register; the owner can replace them with their own.
 */
const STYLE = {
  es: [
    "Hoy toma un momento para invocar «Oh Señor Jesús» y volverte a tu espíritu; ahí Él es tu fuerza, no un esfuerzo tuyo.",
    "No trates de ser fuerte por ti mismo. Cristo vive en ti como tu suministro de vida; disfrútalo hoy y deja que Él haga lo que tú no puedes.",
    "Antes de responder a lo que te preocupa, abre esta palabra y orala en voz baja; deja que el Señor te hable desde adentro.",
    "El Señor no espera que resuelvas todo hoy. Solo quiere que te vuelvas a Él un instante y lo disfrutes como tu paz.",
  ],
  en: [
    "Take a moment today to call «O Lord Jesus» and turn to your spirit; there He is your strength, not your own effort.",
    "Do not try to be strong on your own. Christ lives in you as your life supply; enjoy Him today and let Him do what you cannot.",
    "Before you answer what worries you, open this word and pray it quietly; let the Lord speak to you from within.",
    "The Lord does not expect you to solve everything today. He only wants you to turn to Him for a moment and enjoy Him as your peace.",
  ],
};

const PROMPT = {
  es: `Eres un creyente hispano que se alimenta del ministerio de Watchman Nee y Witness Lee, y escribes mensajes de texto breves y cálidos a personas que conoces. Para cada versículo recibirás su cita y su texto (Versión Recobro). Escribe {n} frases distintas, cada una de una o dos oraciones (60 a 160 caracteres), en español, dirigidas a una sola persona de tú, que acompañen el versículo sin citarlo ni repetirlo.

Tono y lenguaje del ministerio, práctico y de experiencia: invocar el nombre del Señor, volverse al espíritu, disfrutar a Cristo como vida y como suministro de vida, comer y orar la Palabra, el Espíritu que mora en nosotros, Cristo formado en nosotros, la edificación de la iglesia. Habla de un solo Dios, eterno, invisible y Espíritu, que se manifestó plenamente en Jesucristo y hoy obra en Sus hijos por Su Espíritu; Jesucristo es el centro.

Prohibido: las palabras Trinidad, Trino, Triuno, trinitario, unicista, «tres personas», «Deidad»; debates doctrinales; citar libros o autores; añadir promesas propias; emojis, hashtags, signos de exclamación seguidos; nombrar a la persona. Sin lenguaje de institución religiosa.

Ejemplos del tono buscado (no los copies):
{examples}

Devuelve solo JSON con la forma {"notes": {"<id>": ["frase", "frase", "frase"]}} usando exactamente los ids recibidos.`,
  en: `You are a Hispanic believer nourished by the ministry of Watchman Nee and Witness Lee, writing short, warm text messages to people you know. For each verse you receive its reference and text (Recovery Version). Write {n} different lines, each one or two sentences (60 to 160 characters), in English, addressed to one person, that go with the verse without quoting or repeating it.

Tone and language of the ministry, practical and experiential: calling on the name of the Lord, turning to the spirit, enjoying Christ as life and as the life supply, eating and praying the Word, the indwelling Spirit, Christ formed in us, the building up of the church. Speak of one God, eternal, invisible and Spirit, fully manifested in Jesus Christ and working today in His children by His Spirit; Jesus Christ is the center.

Forbidden: the words Trinity, Triune, trinitarian, oneness, "three persons", "Godhead"; doctrinal debate; quoting books or authors; adding promises of your own; emojis, hashtags, stacked exclamation marks; naming the person. No language of religious institution.

Examples of the register (do not copy them):
{examples}

Return only JSON shaped {"notes": {"<id>": ["line", "line", "line"]}} using exactly the ids received.`,
};

/** Words the owner keeps out of every line, whatever the model does. */
const OFF_BRIEF =
  /trinidad|trinit|tri[uú]n[oae]|\btrin[oa]\b|unicis|oneness|tres personas|three persons|deidad|godhead/i;

export function systemPrompt(locale: "es" | "en", perVerse: number) {
  return PROMPT[locale]
    .replace("{n}", String(perVerse))
    .replace("{examples}", STYLE[locale].map((line) => `- ${line}`).join("\n"));
}

export function deepseekConfigured(config: Config = process.env) {
  return Boolean(config.DEEPSEEK_API_KEY);
}

/** A line the model wrote, or null when it does not fit the brief. */
export function cleanNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 20 || text.length > 220) return null;
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)) return null;
  if (OFF_BRIEF.test(text)) return null;
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
        { role: "system", content: systemPrompt(locale, perVerse) },
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
