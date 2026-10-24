/**
 * "Pregunta": a signed-in person asks about the Word and the app answers in
 * the same voice as the verse lines. Each answer is one DeepSeek call paid
 * from the owner's key, so a daily quota per person guards the balance.
 * Nothing about the questions is stored; only the day's count.
 */
import type { Sql } from "../db.ts";
import { VOICE } from "./deepseek.server.ts";

type Config = Record<string, string | undefined>;
export type Locale = "es" | "en";
export type AskTurn = { role: "user" | "assistant"; content: string };

export const ASK_DAILY_LIMIT = 20;
export const QUESTION_MAX = 500;
const HISTORY_TURNS = 8;
const TURN_MAX = 1200;

const TASK = {
  es: `Respondes preguntas sobre la Biblia, la fe y la vida cristiana dentro de una app. Responde en español, breve (unas 80 a 140 palabras) salvo que pidan más detalle, con formato ligero que se lea bien en un teléfono: párrafos cortos, negritas (**así**) para la idea clave, una lista con guiones cuando haya pasos o puntos, y cada versículo citado en su propia línea como cita (> «texto» seguido de la referencia en negrita). Sin títulos largos, sin tablas, sin enlaces. Apoya lo que digas en la Escritura y cita uno a tres versículos con su referencia. Si preguntan por una controversia doctrinal o por términos que tienes prohibidos, puedes nombrarlos solo para responder con los textos bíblicos, con humildad, sin etiquetas y sin atacar a nadie; no te encierres en ninguna doctrina. Si la pregunta no trata de la Biblia, la fe o la vida cristiana, di en una línea, con amabilidad, que estás para preguntas de la Palabra. Nunca inventes citas ni versículos; si no estás seguro de una referencia, di la idea sin la cita.`,
  en: `You answer questions about the Bible, the faith and the Christian life inside an app. Answer in English, briefly (about 80 to 140 words) unless more detail is asked for, with light formatting that reads well on a phone: short paragraphs, bold (**like this**) for the key idea, a dash list when there are steps or points, and each quoted verse on its own line as a quotation (> "text" followed by the reference in bold). No long headings, no tables, no links. Ground what you say in Scripture and cite one to three verses with their reference. If asked about a doctrinal controversy or about the terms you are forbidden to use, you may name them only to answer with the Bible texts, humbly, without labels and without attacking anyone; do not box yourself into any doctrine. If the question is not about the Bible, the faith or the Christian life, say kindly in one line that you are here for questions about the Word. Never invent quotations or verses; when unsure of a reference, give the idea without the citation.`,
};

export function askPrompt(locale: Locale) {
  const voice = VOICE[locale];
  return [voice.who, TASK[locale], voice.tone, voice.forbidden].join("\n\n");
}

/** The last few turns, each cut to a sane size, so a long chat stays cheap. */
export function trimHistory(history: AskTurn[], turns = HISTORY_TURNS): AskTurn[] {
  return history
    .filter(
      (turn) =>
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string" &&
        turn.content.trim().length > 0,
    )
    .slice(-turns)
    .map((turn) => ({ role: turn.role, content: turn.content.trim().slice(0, TURN_MAX) }));
}

/**
 * Counts one question for the person today and says whether it fits under
 * the limit. One statement, so two quick taps cannot both pass at the edge.
 */
export async function consumeAskQuota(
  sql: Sql,
  userId: string,
  limit = ASK_DAILY_LIMIT,
  day = new Date().toISOString().slice(0, 10),
): Promise<{ allowed: boolean; used: number }> {
  const rows = await sql<{ count: number }>`
    insert into ask_quota (user_id, day, count) values (${userId}, ${day}, 1)
    on conflict (user_id, day) do update set count = ask_quota.count + 1
    where ask_quota.count < ${limit}
    returning count`;
  if (rows.length === 0) return { allowed: false, used: limit };
  return { allowed: true, used: rows[0].count };
}

/** Gives a question back when the answer never came, so a failure costs nothing. */
export async function releaseAskQuota(
  sql: Sql,
  userId: string,
  day = new Date().toISOString().slice(0, 10),
): Promise<void> {
  await sql`update ask_quota set count = greatest(count - 1, 0)
    where user_id = ${userId} and day = ${day}`;
}

/** A short, stable code for what went wrong, safe to show on screen. */
export function failureCode(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return "timeout";
    if (/^deepseek_/.test(error.message)) return error.message;
    if (/fetch failed|ENOTFOUND|ECONN/i.test(error.message)) return "network";
  }
  return "unknown";
}

/**
 * The text pieces of a DeepSeek streamed reply (server-sent events, one JSON
 * per `data:` line, `[DONE]` at the end), in the order they were written.
 */
export async function* sseText(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = pending.split("\n");
      pending = done ? "" : (lines.pop() ?? "");
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const chunk = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {
          /* a partial or foreign line; the next one carries on */
        }
      }
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Asks and hands back the answer as it is written. The request itself is
 * awaited here, so a rejected key or a full queue fails before anything
 * streams; only the words come later.
 */
export async function streamAnswer(
  input: { question: string; history: AskTurn[]; locale: Locale },
  config: Config = process.env,
  request: typeof fetch = fetch,
): Promise<AsyncGenerator<string>> {
  if (!config.DEEPSEEK_API_KEY) throw new Error("deepseek_not_configured");
  const question = input.question.trim().slice(0, QUESTION_MAX);
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
        temperature: 0.7,
        max_tokens: 700,
        stream: true,
        messages: [
          { role: "system", content: askPrompt(input.locale) },
          ...trimHistory(input.history),
          { role: "user", content: question },
        ],
      }),
      signal: AbortSignal.timeout(55_000),
    },
  );
  if (!response.ok) throw new Error(`deepseek_${response.status}`);
  if (!response.body) throw new Error("deepseek_empty");
  return sseText(response.body);
}

export async function answerQuestion(
  input: { question: string; history: AskTurn[]; locale: Locale },
  config: Config = process.env,
  request: typeof fetch = fetch,
): Promise<string> {
  if (!config.DEEPSEEK_API_KEY) throw new Error("deepseek_not_configured");
  const question = input.question.trim().slice(0, QUESTION_MAX);
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
        temperature: 0.7,
        max_tokens: 700,
        messages: [
          { role: "system", content: askPrompt(input.locale) },
          ...trimHistory(input.history),
          { role: "user", content: question },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    },
  );
  if (!response.ok) throw new Error(`deepseek_${response.status}`);
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = (body.choices?.[0]?.message?.content ?? "").trim();
  if (!answer) throw new Error("deepseek_empty");
  return answer;
}
