/**
 * Day (Pergamino) or night (Noche) colours, chosen per device. "system"
 * follows the phone's own light/dark setting. The choice lives in
 * localStorage and is applied as the `dark` class on <html>, before the
 * first paint by THEME_BOOT_SCRIPT and afterwards by applyColorTheme.
 */
export type ColorTheme = "system" | "light" | "dark";

export const COLOR_THEMES: ColorTheme[] = ["light", "dark", "system"];

export const THEME_STORAGE_KEY = "preacher-color-theme";

/** Browser bar colour for each look: the page background. */
export const THEME_COLOR = { light: "#f4ead6", dark: "#17120e" } as const;

export function isColorTheme(value: unknown): value is ColorTheme {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveColorTheme(theme: ColorTheme, systemDark: boolean): "light" | "dark" {
  if (theme === "system") return systemDark ? "dark" : "light";
  return theme;
}

export function readColorTheme(): ColorTheme {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isColorTheme(saved)) return saved;
  } catch {
    /* private mode */
  }
  return "system";
}

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function applyColorTheme(theme: ColorTheme) {
  if (typeof document === "undefined") return;
  const look = resolveColorTheme(theme, systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", look === "dark");
  root.style.colorScheme = look;
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute("content", THEME_COLOR[look]);
  }
}

const listeners = new Set<() => void>();
let current: ColorTheme | null = null;

export function setColorTheme(theme: ColorTheme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode: still applies for this visit */
  }
  current = theme;
  applyColorTheme(theme);
  for (const listener of listeners) listener();
}

export function getColorTheme(): ColorTheme {
  if (current === null) current = readColorTheme();
  return current;
}

/** For useSyncExternalStore; also re-applies "system" when the phone flips. */
export function subscribeColorTheme(listener: () => void) {
  listeners.add(listener);
  const media =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  const onSystemChange = () => {
    if (getColorTheme() === "system") applyColorTheme("system");
    listener();
  };
  media?.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener("change", onSystemChange);
  };
}

/**
 * Runs in <head> before the page paints, so a night reader never sees a
 * flash of parchment. Kept in step with applyColorTheme by hand.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;if(d)r.classList.add("dark");r.style.colorScheme=d?"dark":"light";var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute("content",d?${JSON.stringify(
  THEME_COLOR.dark,
)}:${JSON.stringify(THEME_COLOR.light)});}catch(e){}})();`;
