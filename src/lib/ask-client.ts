import { getBearerToken } from "@/lib/auth/client";

export type AskTurn = { role: "user" | "assistant"; content: string };

export class AskError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "AskError";
  }
}

/**
 * Sends a question and hands back the answer as it is written. Throws an
 * `AskError` before the first word when the server refuses: `unauthorized`,
 * `ask_quota`, `ask_unavailable`, `ask_failed:<code>`.
 */
export async function askStream(
  input: { question: string; history: AskTurn[]; locale: "es" | "en" },
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ remaining: number | null }> {
  return streamPost("/api/ask", input, onText, signal);
}

/** A message for one person from a preaching case, written as it streams. */
export async function composeStream(
  input: { caseId: string; details: string; locale: "es" | "en" },
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ remaining: number | null }> {
  return streamPost("/api/compose", input, onText, signal);
}

async function streamPost(
  path: string,
  input: unknown,
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ remaining: number | null }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getBearerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
    credentials: "same-origin",
    signal,
  });
  if (!response.ok) {
    let code = `http_${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) code = body.error;
    } catch {
      /* no JSON body */
    }
    throw new AskError(code, response.status);
  }
  const remainingHeader = response.headers.get("x-ask-remaining");
  const remaining = remainingHeader === null ? null : Number(remainingHeader);
  if (!response.body) return { remaining };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (value) onText(decoder.decode(value, { stream: !done }));
    if (done) break;
  }
  return { remaining };
}
