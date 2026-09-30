/**
 * Which condition for reading LBLA / NASB 2020 failed, from the error the
 * API.Bible client threw, so the reader can be told what is missing instead
 * of a bare "not available". Never carries the key itself.
 */
export type ApiBibleProblem =
  | "missing-key"
  | "rejected-key"
  | "no-license-lbla"
  | "no-license-nasb20"
  | "limit"
  | "unavailable";

export function apiBibleProblem(error: unknown): ApiBibleProblem | null {
  const message = error instanceof Error ? error.message : "";
  if (!message.startsWith("api-bible-")) return null;
  if (message === "api-bible-missing") return "missing-key";
  if (message === "api-bible-license:lbla") return "no-license-lbla";
  if (message === "api-bible-license:nasb20") return "no-license-nasb20";
  const status = Number(/^api-bible-http:(\d+)$/.exec(message)?.[1]);
  if (status === 401 || status === 403) return "rejected-key";
  if (status === 429) return "limit";
  return "unavailable";
}
