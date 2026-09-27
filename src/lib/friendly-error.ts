/**
 * What to tell the reader when something could not load. The server's own
 * messages are already written for people; a browser's network wording
 * ("Failed to fetch", "Load failed", a timeout) is replaced by the plain
 * sentence given.
 */
export function friendlyError(error: unknown, plain: string): string {
  const message = error instanceof Error ? error.message.trim() : "";
  if (!message) return plain;
  if (/fetch|network|timeout|timed out|abort|load failed|ECONN|ENOTFOUND|\b5\d\d\b/i.test(message)) {
    return plain;
  }
  return message;
}
