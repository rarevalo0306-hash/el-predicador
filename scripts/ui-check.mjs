#!/usr/bin/env node
/**
 * Layout and panel checks in a real browser, at the phone and desktop widths
 * the app has to hold: 320, 375, 390, 430, 768 and 1280.
 *
 *   node scripts/ui-check.mjs [--url http://127.0.0.1:8081] [--shots]
 *
 * Run against a built preview with auth off (`VITE_AUTH_ENABLED=false npm run
 * build && npm run preview:restart`), where the preview's own user is signed
 * in. It uses no real people or messages. For each width it checks:
 *  - no sideways scrolling;
 *  - "Pregunta" sits in the header, at least 44×44, and opens its panel;
 *  - "Enviar este verso" is not covered by anything when it sits just above
 *    the bottom bar (the old floating button used to cover it);
 *  - "Palabra para hoy", when shown, ends on a finished sentence;
 *  - the Perfil panel has a visible 44×44 close button, keeps focus inside,
 *    scrolls to its last control, and closes by X, Escape, the backdrop and a
 *    swipe down, each time giving focus back to the Perfil button and leaving
 *    the page scrollable;
 *  - nothing is logged as an error in the console.
 * Exits 1 on any failure. Screenshots (with --shots) go to screenshots/ui-check/.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const urlAt = args.indexOf("--url");
const BASE = urlAt >= 0 ? args[urlAt + 1] : "http://127.0.0.1:8081";
const SHOTS = args.includes("--shots");
const WIDTHS = [
  { width: 320, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

const failures = [];
const fail = (width, what) => failures.push(`${width}px: ${what}`);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

/** Whether whatever is on top at each of a few points inside `box` belongs to `locator`. */
async function uncovered(page, locator) {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    // Inset enough to stay inside rounded corners.
    const dx = Math.min(box.width / 4, 16);
    const dy = box.height / 4;
    const points = [
      [box.left + box.width / 2, box.top + box.height / 2],
      [box.left + dx, box.top + dy],
      [box.right - dx, box.top + dy],
      [box.left + dx, box.bottom - dy],
      [box.right - dx, box.bottom - dy],
    ];
    return points.every(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit !== null && (hit === element || element.contains(hit));
    });
  });
}

async function pageState(page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    return {
      focusOnTrigger: Boolean(active?.hasAttribute("data-profile-trigger")),
      bodyPointer: getComputedStyle(document.body).pointerEvents,
      bodyOverflow: getComputedStyle(document.body).overflow,
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      scrollLocked: document.body.hasAttribute("data-scroll-locked"),
      dialogs: document.querySelectorAll("[role=dialog]").length,
    };
  });
}

async function checkClosed(page, width, how) {
  await page.waitForFunction(() => !document.querySelector("[data-vaul-drawer]"), null, {
    timeout: 3000,
  }).catch(() => undefined);
  await page.waitForTimeout(150);
  const state = await pageState(page);
  if (state.dialogs) fail(width, `Perfil panel still open after ${how}`);
  if (!state.focusOnTrigger) fail(width, `focus did not return to Perfil after ${how}`);
  if (state.bodyPointer === "none") fail(width, `page left unclickable after ${how}`);
  if (state.scrollLocked || state.bodyOverflow === "hidden" || state.htmlOverflow === "hidden") {
    fail(width, `page scroll still locked after ${how}`);
  }
  const scrolls = await page.evaluate(() => {
    if (document.documentElement.scrollHeight <= innerHeight + 4) return true;
    window.scrollTo(0, 120);
    const moved = window.scrollY > 0;
    window.scrollTo(0, 0);
    return moved;
  });
  if (!scrolls) fail(width, `page does not scroll after ${how}`);
}

async function openProfile(page) {
  await page.getByRole("button", { name: "Perfil", exact: true }).click();
  const dialog = page.locator("[data-vaul-drawer]");
  await dialog.waitFor({ state: "visible", timeout: 3000 });
  await page.waitForTimeout(550); // the slide-up animation
  return dialog;
}

for (const size of WIDTHS) {
  const { width } = size;
  const context = await browser.newContext({
    viewport: size,
    locale: "es-ES",
    hasTouch: width < 768,
    isMobile: width < 768,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const from = message.location()?.url ?? "";
    // Outside services the sandbox cannot reach are not the app's errors.
    if (from && !from.startsWith(BASE)) return;
    errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  const send = page.getByRole("button", { name: "Enviar este verso" }).first();
  await send.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(800);

  // No sideways scroll.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) fail(width, `page scrolls sideways by ${overflow}px`);

  // Pregunta: in the header, 44×44 at least, not covered.
  const ask = page.getByRole("button", { name: "Pregunta", exact: true });
  const askBox = await ask.boundingBox();
  if (!askBox) fail(width, "Pregunta button not found");
  else {
    if (askBox.width < 44 || askBox.height < 44) {
      fail(width, `Pregunta is ${Math.round(askBox.width)}×${Math.round(askBox.height)}`);
    }
    if (askBox.x < 0 || askBox.x + askBox.width > width) fail(width, "Pregunta is off screen");
    if (!(await ask.evaluate((el) => Boolean(el.closest("header"))))) {
      fail(width, "Pregunta is not in the header");
    }
    if (!(await uncovered(page, ask))) fail(width, "Pregunta is covered");
  }

  // "Enviar este verso" just above the bottom bar: nothing may sit on it.
  const navTop = await page.evaluate(() => {
    const nav = document.querySelector("nav");
    return nav ? nav.getBoundingClientRect().top : innerHeight;
  });
  await send.evaluate((el, bottom) => {
    const box = el.getBoundingClientRect();
    window.scrollBy(0, box.bottom - (bottom - 6));
  }, navTop);
  await page.waitForTimeout(100);
  if (!(await uncovered(page, send))) fail(width, '"Enviar este verso" is covered');
  const sendBox = await send.boundingBox();
  if (sendBox && sendBox.height < 44) {
    fail(width, `"Enviar este verso" is only ${Math.round(sendBox.height)}px tall`);
  }
  const floating = await page.evaluate(() =>
    [...document.querySelectorAll("body *")].filter((el) => {
      const style = getComputedStyle(el);
      if (style.position !== "fixed" || style.display === "none") return false;
      if (el.closest("header, nav, [data-sonner-toaster], [data-grok]")) return false;
      if (el.id?.startsWith("grok") || el.shadowRoot) return false;
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.bottom > 80 && box.top < innerHeight - 80;
    }).length,
  );
  if (floating) fail(width, `${floating} floating element(s) over the page content`);
  if (SHOTS) {
    mkdirSync("screenshots/ui-check", { recursive: true });
    await page.screenshot({ path: `screenshots/ui-check/${width}-send.png` });
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  // "Palabra para hoy", when there, ends on a finished sentence.
  const word = await page.evaluate(() => {
    const label = [...document.querySelectorAll("p")].find(
      (p) => p.textContent?.trim().toLowerCase() === "palabra para hoy",
    );
    return label?.nextElementSibling?.textContent?.trim() ?? null;
  });
  if (word !== null && !/[.!?…]["”»')\]]*$/.test(word)) {
    fail(width, `"Palabra para hoy" ends mid-sentence: "…${word.slice(-30)}"`);
  }

  // Pregunta opens its panel, and its own X closes it.
  if (askBox) {
    await ask.click();
    const askPanel = page.getByRole("dialog", { name: "Pregunta a la Palabra" });
    if (!(await askPanel.isVisible().catch(() => false))) fail(width, "Pregunta panel did not open");
    else {
      await askPanel.getByRole("button", { name: "Cerrar" }).click();
      await page.waitForTimeout(150);
    }
  }

  // Perfil panel.
  let dialog = await openProfile(page);
  const close = dialog.getByRole("button", { name: "Cerrar" });
  const closeBox = await close.boundingBox();
  if (!closeBox) fail(width, "Perfil panel has no close button");
  else {
    if (closeBox.width < 44 || closeBox.height < 44) {
      fail(width, `close button is ${Math.round(closeBox.width)}×${Math.round(closeBox.height)}`);
    }
    if (closeBox.y < 0 || closeBox.x + closeBox.width > width) fail(width, "close button off screen");
  }
  if (!(await dialog.evaluate((el) => el.contains(document.activeElement)))) {
    fail(width, "focus did not move into the Perfil panel");
  }
  for (let i = 0; i < 25; i += 1) await page.keyboard.press("Tab");
  if (!(await dialog.evaluate((el) => el.contains(document.activeElement)))) {
    fail(width, "Tab leaves the Perfil panel");
  }
  const reach = await dialog.evaluate((el) => {
    const panel = el.getBoundingClientRect();
    const controls = [...el.querySelectorAll("button, input, textarea, select, a[href]")].filter(
      (node) => node.getBoundingClientRect().height > 0,
    );
    const last = controls.at(-1);
    if (!last) return { fits: true, reachable: true };
    last.scrollIntoView({ block: "end" });
    const box = last.getBoundingClientRect();
    return {
      fits: panel.top >= 0 && panel.bottom <= innerHeight + 1,
      reachable: box.bottom <= innerHeight + 1 && box.top >= 0,
    };
  });
  if (!reach.fits) fail(width, "Perfil panel is taller than the screen");
  if (!reach.reachable) fail(width, "last control in Perfil panel cannot be reached");
  if (SHOTS) await page.screenshot({ path: `screenshots/ui-check/${width}-perfil.png` });

  await page.keyboard.press("Escape");
  await checkClosed(page, width, "Escape");

  dialog = await openProfile(page);
  await dialog.getByRole("button", { name: "Cerrar" }).click();
  await checkClosed(page, width, "the X");

  dialog = await openProfile(page);
  await page.mouse.click(Math.round(width / 2), 30);
  await checkClosed(page, width, "a tap on the backdrop");

  dialog = await openProfile(page);
  const top = (await dialog.boundingBox())?.y ?? 0;
  await page.mouse.move(Math.round(width / 2), top + 12);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(Math.round(width / 2), top + 12 + step * 40);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await checkClosed(page, width, "a swipe down");

  for (const error of errors) fail(width, `console: ${error.slice(0, 160)}`);
  await context.close();
  console.log(`${width}px checked`);
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`\nAll checks passed at ${WIDTHS.map((w) => w.width).join(", ")} px.`);
