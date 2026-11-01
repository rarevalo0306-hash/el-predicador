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
// Kept in localStorage (not sessionStorage): iOS can restart the web view's
// process while the app is in the background, which loses session storage.
const POSITION_KEY = "preacher-visit-position";
const ASK_DRAFT_KEY = "preacher-ask-draft";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Read once: the saved position is always removed, and only returned when valid. */
export function readPosition(userId: string, now = Date.now()): VisitPosition | null {
  const store = storage();
  try {
    const value: unknown = JSON.parse(store?.getItem(POSITION_KEY) ?? "null");
    store?.removeItem(POSITION_KEY);
    return validPosition(value, userId, now) ? value : null;
  } catch {
    return null;
  }
}

export function savePosition(value: VisitPosition) {
  try {
    storage()?.setItem(POSITION_KEY, JSON.stringify(value));
  } catch {
    /* optional */
  }
}

export type AskDraft = { at: number; text: string; userId: string };

/**
 * The unsent AI question, back for a minute after leaving the app. Removed as
 * soon as it is read, so it never lingers or reaches another account.
 */
export function takeAskDraft(userId: string, now = Date.now()): string {
  const store = storage();
  try {
    const value = JSON.parse(store?.getItem(ASK_DRAFT_KEY) ?? "null") as AskDraft | null;
    store?.removeItem(ASK_DRAFT_KEY);
    return value &&
      value.userId === userId &&
      typeof value.text === "string" &&
      typeof value.at === "number" &&
      now >= value.at &&
      now - value.at <= RESUME_MS
      ? value.text
      : "";
  } catch {
    return "";
  }
}

export function saveAskDraft(userId: string, text: string, now = Date.now()) {
  try {
    if (!text.trim()) storage()?.removeItem(ASK_DRAFT_KEY);
    else storage()?.setItem(ASK_DRAFT_KEY, JSON.stringify({ at: now, text, userId }));
  } catch {
    /* optional */
  }
}

/** Opening from a shared passage, a notification or a quick action wins over restoring. */
export function arrivedWithDestination(search: string) {
  const params = new URLSearchParams(search);
  return ["leer", "abrir", "bienvenido"].some((key) => params.has(key));
}
