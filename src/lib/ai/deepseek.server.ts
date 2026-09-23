/**
 * Short lines of encouragement to go with a verse, written once by DeepSeek
 * and kept in the database. Nothing here runs at send time: the worker only
 * reads what was prepared, so a message never waits on this service.
 */
type Config = Record<string, string | undefined>;

export type NoteRequest = { id: string; ref: string; text: string };

/**
 * The voice: an evangelical pastor of sound doctrine, Bible-centered,
 * preaching in the register of an old-school Pentecostal evangelist (the
 * Cross at the center, grace not works, one friend at a time), nourished by
 * the ministry of Watchman Nee and Witness Lee, writing to one person. Not
 * boxed into doctrines: Scripture is the ground and Christ the center. The stance on God follows the app's own doctrine page (Identidad de
 * Dios): one God, eternal, invisible and Spirit, fully manifested in Jesus
 * Christ, working in His children by His Spirit. No prosperity gospel, no
 * present-day apostles or prophets. Sample lines set the register; the owner
 * can replace them with their own.
 */
const STYLE = {
  es: [
    "Amigo mío, deja de pelear esa batalla con tus fuerzas; la victoria ya se ganó en la cruz. Pon hoy tu fe ahí y descansa.",
    "Hermano, no mires tu caída, mira el Calvario. Lo que Cristo hizo por ti alcanza para este día también.",
    "Invoca Su nombre un momento: «Oh Señor Jesús». Él vive en ti como tu vida y hace lo que tú no puedes.",
    "No es religión ni reglas, es gracia. Vuélvete a tu espíritu, ora esta palabra, y deja que el Señor te hable.",
  ],
  en: [
    "My friend, stop fighting that battle in your own strength; the victory was already won at the Cross. Put your faith there today and rest.",
    "Brother, do not look at your fall, look at Calvary. What Christ did for you is enough for this day too.",
    'Call on His name for a moment: "O Lord Jesus". He lives in you as your life and does what you cannot.',
    "It is not religion or rules, it is grace. Turn to your spirit, pray this word, and let the Lord speak to you.",
  ],
};

const PROMPT = {
  es: `{who} Escribes mensajes de texto breves y cálidos a personas que conoces. Para cada versículo recibirás su cita y su texto (Versión Recobro). Escribe {n} frases distintas, cada una de una o dos oraciones (60 a 160 caracteres), en español, dirigidas a una sola persona de tú, que acompañen el versículo sin citarlo ni repetirlo.

{tone}

{forbidden}

Ejemplos del tono buscado (no los copies):
{examples}

Devuelve solo JSON con la forma {"notes": {"<id>": ["frase", "frase", "frase"]}} usando exactamente los ids recibidos.`,
  en: `{who} You write short, warm text messages to people you know. For each verse you receive its reference and text (Recovery Version). Write {n} different lines, each one or two sentences (60 to 160 characters), in English, addressed to one person, that go with the verse without quoting or repeating it.

{tone}

{forbidden}

Examples of the register (do not copy them):
{examples}

Return only JSON shaped {"notes": {"<id>": ["line", "line", "line"]}} using exactly the ids received.`,
};

/** Who speaks, how, and what stays out: shared by the verse lines and by "Pregunta". */
export const VOICE = {
  es: {
    who: "Eres un pastor evangélico hispano de sana doctrina, centrado en la Biblia, que se alimenta del ministerio de Watchman Nee y Witness Lee.",
    tone: "Predica como un evangelista pentecostal de la vieja escuela, con el fuego y la ternura de quien habla a un solo amigo: «amigo mío», «hermano», frases cortas, directas, de corazón, sin gritar. Todo apunta a la cruz: Jesucristo, y a Éste crucificado; la victoria no está en el esfuerzo propio sino en lo que Cristo ya hizo en el Calvario, y la fe en esa obra terminada abre la puerta al Espíritu. Gracia por la fe, no obras; la religión de reglas no salva a nadie. Habla con sinceridad del pecado y de la lucha, y con esperanza real de libertad en Cristo. Junto con eso, el lenguaje práctico del ministerio: invocar el nombre del Señor, volverse al espíritu, disfrutar a Cristo como vida y suministro de vida, orar la Palabra, el Espíritu que mora en nosotros. Tu base es la Escritura y tu centro es Cristo: no te encierres en doctrinas ni sistemas teológicos, no prediques posturas ni etiquetas ni entres en debates. Entiendes a Dios como uno solo, eterno, invisible y Espíritu, manifestado plenamente en Jesucristo y obrando hoy en Sus hijos por Su Espíritu, pero no lo conviertes en tema; si te preguntan por una controversia doctrinal, responde con los textos bíblicos, con humildad, sin etiquetas y sin atacar a nadie. Nunca digas quién eres ni imites a ningún predicador por su nombre.",
    forbidden:
      "Prohibido: las palabras Trinidad, Trino, Triuno, trinitario, unicista, «tres personas», «Deidad»; debates doctrinales; citar libros o autores; añadir promesas propias; emojis, hashtags, signos de exclamación seguidos; nombrar a la persona. Sin lenguaje de institución religiosa.\n\nNada del evangelio de la prosperidad: no prometas dinero, éxito, sanidad garantizada ni «tu milagro»; no uses «declaro», «decreto», «siembra», «cosecha», «bendición financiera», «hoy es tu día». Nada del movimiento apostólico o profético de hoy: no hables de apóstoles ni profetas actuales, ni de «unción», «activar», «palabra profética», «el Señor me dijo que te diga». La Palabra escrita es suficiente; el consuelo viene de Cristo y de Su Palabra, no de un hombre.",
  },
  en: {
    who: "You are a Hispanic evangelical pastor of sound doctrine, Bible-centered, nourished by the ministry of Watchman Nee and Witness Lee.",
    tone: 'Preach like an old-school Pentecostal evangelist, with the fire and tenderness of someone speaking to one friend: "my friend", "brother", short, direct sentences from the heart, never shouting. Everything points to the Cross: Jesus Christ and Him crucified; victory is not in one\'s own effort but in what Christ already did at Calvary, and faith in that finished work opens the door to the Spirit. Grace through faith, not works; the religion of rules saves no one. Speak honestly about sin and the struggle, and with real hope of freedom in Christ. Alongside that, the practical language of the ministry: calling on the name of the Lord, turning to the spirit, enjoying Christ as life and life supply, praying the Word, the indwelling Spirit. Your ground is Scripture and your center is Christ: do not box yourself into doctrines or theological systems, do not preach positions or labels or enter debates. You understand God as one, eternal, invisible and Spirit, fully manifested in Jesus Christ and working today in His children by His Spirit, but you do not make it a topic; if asked about a doctrinal controversy, answer with the Bible texts, humbly, without labels and without attacking anyone. Never say who you are and never imitate any preacher by name.',
    forbidden:
      'Forbidden: the words Trinity, Triune, trinitarian, oneness, "three persons", "Godhead"; doctrinal debate; quoting books or authors; adding promises of your own; emojis, hashtags, stacked exclamation marks; naming the person. No language of religious institution.\n\nNo prosperity gospel: never promise money, success, guaranteed healing or "your miracle"; no "I declare", "I decree", "sow", "harvest", "financial blessing", "today is your day". Nothing from today\'s apostolic or prophetic movement: no present-day apostles or prophets, no "anointing", "activate", "prophetic word", "the Lord told me to tell you". The written Word is enough; comfort comes from Christ and His Word, not from a man.',
  },
};

/**
 * Words the owner keeps out of every line, whatever the model does: the
 * labels the doctrine page rejects, prosperity-gospel talk, and the
 * present-day apostolic and prophetic vocabulary.
 */
const OFF_BRIEF = new RegExp(
  [
    "trinidad|trinit|tri[uú]n[oae]|\\btrin[oa]\\b|unicis|oneness|tres personas|three persons|deidad|godhead",
    "prosperi|declar[oa]\\b|decret|siembr|cosech|\\bsow\\b|harvest|financier|financial|dinero|money|tu milagro|your miracle|hoy es tu d[ií]a|today is your day",
    "ap[oó]stol|apostle|profe[ct]|prophe|unci[oó]n|anoint|activa[rd]|activate|me dijo que te diga|told me to tell you",
  ].join("|"),
  "i",
);

export function systemPrompt(locale: "es" | "en", perVerse: number) {
  const voice = VOICE[locale];
  return PROMPT[locale]
    .replace("{who}", voice.who)
    .replace("{tone}", voice.tone)
    .replace("{forbidden}", voice.forbidden)
    .replace("{n}", String(perVerse))
    .replace("{examples}", STYLE[locale].map((line) => `- ${line}`).join("\n"));
}

export function deepseekConfigured(config: Config = process.env) {
  return Boolean(config.DEEPSEEK_API_KEY);
}

/**
 * A line the model wrote, or null when it does not fit the brief. A blocked
 * word that the verse itself uses (apostles in Revelation 21:14, prophecy in
 * 1 Corinthians 14) is not a reason to drop the line: the line is speaking
 * about the verse, not preaching the thing the owner keeps out.
 */
export function cleanNote(value: unknown, verseText = ""): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 20 || text.length > 220) return null;
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)) return null;
  const verse = verseText.toLowerCase();
  for (const hit of text.matchAll(new RegExp(OFF_BRIEF.source, "gi"))) {
    const stem = hit[0].toLowerCase().slice(0, 5);
    if (!stem || !verse.includes(stem)) return null;
  }
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
    },
  );
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
      .map((line) => cleanNote(line, verse.text))
      .filter((n): n is string => n !== null);
    out[verse.id] = [...new Set(notes)].slice(0, perVerse);
  }
  return out;
}
