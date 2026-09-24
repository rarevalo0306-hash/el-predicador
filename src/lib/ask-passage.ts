/** The most a question sent to Pregunta may hold (the server's own limit). */
export const PASSAGE_QUESTION_MAX = 500;

/**
 * A question about a passage the reader picked: the reference, its text in
 * quotes, then the question. The text is shortened first when it would not
 * fit, so the reference and the question always arrive whole.
 */
export function passageQuestion(ref: string, text: string, question: string): string {
  const head = ref.trim();
  const ask = question.trim();
  const body = text.replace(/\s+/g, " ").trim();
  const room = PASSAGE_QUESTION_MAX - head.length - ask.length - 6;
  if (room < 20) return `${head}\n\n${ask}`.slice(0, PASSAGE_QUESTION_MAX);
  const quoted = body.length > room ? `${body.slice(0, room - 1).trimEnd()}…` : body;
  return `${head}\n«${quoted}»\n\n${ask}`;
}
