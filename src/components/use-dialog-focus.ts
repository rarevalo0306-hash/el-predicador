import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

// Panels open right now, the newest last: only the top one keeps Tab, so a
// sheet opened over Pregunta is not undone by Pregunta's own trap.
const openPanels: HTMLElement[] = [];

function focusables(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute("inert") && el.getClientRects().length > 0,
  );
}

/**
 * For a panel drawn over the page (role="dialog"): while open, the keyboard
 * and a screen reader's cursor start inside it and Tab stays inside it; on
 * closing, they go back to whatever opened it. The first focus lands on
 * `initial` (a close button), not a text field, so a phone does not raise
 * its keyboard just because the panel opened.
 */
export function useDialogFocus(
  open: boolean,
  container: RefObject<HTMLElement | null>,
  initial?: RefObject<HTMLElement | null>,
) {
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = container.current;
    if (!panel) return;
    openPanels.push(panel);
    if (!panel.contains(document.activeElement)) {
      const first = initial?.current ?? focusables(panel)[0] ?? panel;
      first.focus({ preventScroll: true });
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || openPanels[openPanels.length - 1] !== panel) return;
      const items = focusables(panel);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      const at = openPanels.lastIndexOf(panel);
      if (at >= 0) openPanels.splice(at, 1);
      const back = opener.current;
      opener.current = null;
      // Only if nothing else took the focus meanwhile (another panel, a link).
      const stray = !document.activeElement || document.activeElement === document.body;
      if (back && back.isConnected && (stray || panel.contains(document.activeElement))) {
        back.focus({ preventScroll: true });
      }
    };
  }, [open, container, initial]);
}
