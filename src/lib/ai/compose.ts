/**
 * A message written for one person, from a preaching case: the owner says
 * who the person is and what they are living, and the app writes the
 * message in its own voice, on the case's approach, quoting the case's
 * verses. Streamed like "Pregunta", paid from the same daily quota.
 */
import { VOICE } from "./deepseek.server.ts";
import { sseText, type Locale } from "./ask.ts";

type Config = Record<string, string | undefined>;

export const DETAILS_MAX = 400;

export type ComposeInput = {
  caseTitle: string;
  issue: string;
  approach: string;
  points: string[];
  verses: { ref: string; text: string }[];
  details: string;
  locale: Locale;
};

const TASK = {
  es: `Vas a escribir un mensaje personal para enviar por WhatsApp o SMS a una persona concreta. Recibirás el caso (a quién se le predica, el punto central, cómo abordarlo y los versículos disponibles con su texto) y lo que el remitente sabe de la persona. Escribe el mensaje en español, de tú, entre 100 y 170 palabras, en texto plano sin markdown ni títulos, listo para enviar tal cual. Sigue el enfoque y los puntos del caso, hablando de lo que esa persona está viviendo si se te dijo. Cita uno o dos de los versículos recibidos, con su texto exacto, cada uno en su propia línea así: «texto» y en la línea siguiente — referencia. No inventes versículos ni cambies su texto. Sin saludo con nombre inventado ni firma: el remitente añade la suya. Cálido, directo, sin atacar a la persona ni burlarte de lo que cree. Devuelve solo el mensaje.`,
  en: `You will write a personal message to send by WhatsApp or SMS to one specific person. You receive the case (who is being preached to, the central point, how to approach it and the verses available with their text) and what the sender knows about the person. Write the message in English, 100 to 170 words, in plain text without markdown or headings, ready to send as is. Follow the case's approach and points, speaking to what that person is living if told. Quote one or two of the verses received, with their exact text, each on its own line like this: "text" and on the next line — reference. Do not invent verses or change their text. No greeting with an invented name and no signature: the sender adds their own. Warm, direct, never attacking the person or mocking what they believe. Return only the message.`,
};

export function composePrompt(locale: Locale) {
  const voice = VOICE[locale];
  return [voice.who, TASK[locale], voice.tone, voice.forbidden].join("\n\n");
}

/** The case and the person, laid out for the model. */
export function composeBrief(input: ComposeInput) {
  const es = input.locale === "es";
  const lines = [
    `${es ? "Caso" : "Case"}: ${input.caseTitle}`,
    `${es ? "Punto central" : "Central point"}: ${input.issue}`,
    `${es ? "Cómo abordarlo" : "Approach"}: ${input.approach}`,
    `${es ? "Puntos" : "Points"}:`,
    ...input.points.map((p) => `- ${p}`),
    `${es ? "Versículos disponibles" : "Verses available"}:`,
    ...input.verses.map((v) => `- ${v.ref}: ${v.text}`),
    `${es ? "Sobre la persona" : "About the person"}: ${
      input.details.trim() || (es ? "(sin detalles)" : "(no details)")
    }`,
  ];
  return lines.join("\n");
}

export async function streamComposed(
  input: ComposeInput,
  config: Config = process.env,
  request: typeof fetch = fetch,
): Promise<AsyncGenerator<string>> {
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
        temperature: 0.8,
        max_tokens: 600,
        stream: true,
        messages: [
          { role: "system", content: composePrompt(input.locale) },
          {
            role: "user",
            content: composeBrief({ ...input, details: input.details.slice(0, DETAILS_MAX) }),
          },
        ],
      }),
      signal: AbortSignal.timeout(55_000),
    },
  );
  if (!response.ok) throw new Error(`deepseek_${response.status}`);
  if (!response.body) throw new Error("deepseek_empty");
  return sseText(response.body);
}
