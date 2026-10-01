import { useSyncExternalStore } from "react";
import {
  getColorTheme,
  resolveColorTheme,
  subscribeColorTheme,
  type ColorTheme,
} from "@/lib/color-theme";

/** The reader's choice: day, night or follow the phone. */
export function useColorThemeChoice(): ColorTheme {
  return useSyncExternalStore(subscribeColorTheme, getColorTheme, () => "system");
}

function systemDark() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** What is on screen now: "light" or "dark". */
export function useColorTheme(): "light" | "dark" {
  return useSyncExternalStore(
    subscribeColorTheme,
    () => resolveColorTheme(getColorTheme(), systemDark()),
    () => "light",
  );
}
