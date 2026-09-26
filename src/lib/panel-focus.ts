/**
 * For a panel's `onCloseAutoFocus`: put focus back on the button that opens
 * it (found by `selector`, since it may have been re-rendered), so keyboard
 * and screen-reader users land where they were. When another panel has
 * opened in its place, that panel keeps focus; when the button is gone, the
 * panel's own default applies.
 */
export function returnFocusTo(selector: string) {
  return (event: Event) => {
    if (document.querySelector('[role="dialog"]')) {
      event.preventDefault();
      return;
    }
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    event.preventDefault();
    target.focus({ preventScroll: true });
  };
}

/** Back to the Más button in the bottom bar (after Más, or Ajustes opened from it). */
export const focusMoreButton = returnFocusTo("[data-more-trigger]");

/** Back to Perfil in the header (or Entrar when signed out). */
export const focusProfileButton = returnFocusTo("[data-profile-trigger]");
