import type { KeyboardEvent } from "react";

/**
 * Arrow keys for a row of tabs (role="tablist"): Left and Right move to the
 * previous and next tab, wrapping round; Home and End go to the first and
 * last. The tab reached is also chosen, as a tap would. With each tab's
 * tabIndex set to 0 when chosen and -1 otherwise, Tab enters the row once
 * and leaves it on the next Tab.
 */
export function onTabListKeyDown(event: KeyboardEvent<HTMLElement>) {
  const { key } = event;
  if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") return;
  const tabs = [
    ...event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'),
  ];
  const at = tabs.indexOf(document.activeElement as HTMLElement);
  if (at < 0 || !tabs.length) return;
  const next =
    key === "Home"
      ? 0
      : key === "End"
        ? tabs.length - 1
        : (at + (key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[next]!.focus();
  tabs[next]!.click();
}
