// Preferences for this device; cloud hydration must not undo explicit choices.
export function readChoice(key: string): "es" | "en" | undefined {
  try {
    const value = window.localStorage.getItem(key);
    return value === "es" || value === "en" ? value : undefined;
  } catch {
    return undefined;
  }
}
export function saveChoice(key: string, value: "es" | "en") {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}
export const MESSAGE_LANGUAGE_KEY = "preacher-message-language";
export const RESUME_MS = 60_000;
export type VisitPosition = { at: number; tab: string; askOpen: boolean; userId: string };
export function validPosition(
  value: unknown,
  userId: string,
  now = Date.now(),
): value is VisitPosition {
  if (!value || typeof value !== "object") return false;
  const row = value as VisitPosition;
  return (
    row.userId === userId &&
    typeof row.at === "number" &&
    now >= row.at &&
    now - row.at <= RESUME_MS &&
    ["hoy", "biblia", "temas", "personas", "evangelio", "guardados", "admin"].includes(row.tab) &&
    typeof row.askOpen === "boolean"
  );
}
export function readPosition(userId: string): VisitPosition | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem("preacher-visit-position") ?? "null");
    return validPosition(value, userId) ? value : null;
  } catch {
    return null;
  }
}
export function savePosition(value: VisitPosition) {
  try {
    sessionStorage.setItem("preacher-visit-position", JSON.stringify(value));
  } catch {
    /* optional */
  }
}
