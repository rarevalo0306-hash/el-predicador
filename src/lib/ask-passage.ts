/** The most a question sent to Pregunta may hold (the server's own limit). */
export const PASSAGE_QUESTION_MAX = 500;

/**
 * A question about a passage the reader picked: its reference, then the
 * question. The Bible text itself never goes along: the editions do not
 * allow sending it to the AI or keeping it in the chat history, and the
 * reference is enough for the answer.
 */
export function passageQuestion(ref: string, question: string): string {
  return `${ref.trim()}\n\n${question.trim()}`.slice(0, PASSAGE_QUESTION_MAX);
}
