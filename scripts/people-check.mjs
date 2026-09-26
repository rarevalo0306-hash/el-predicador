#!/usr/bin/env node
/**
 * Gente in a real browser: the list first, search, filters, "Mostrar más",
 * the "Nueva persona" / "Editar" panel, and removing with a confirmation.
 *
 *   node scripts/people-check.mjs [--url http://127.0.0.1:8081] [--shots]
 *
 * Run against a FRESHLY started built preview with auth off
 * (`VITE_AUTH_ENABLED=false npm run build && npm run preview:restart`): it
 * seeds 57 made-up contacts (555 numbers, invented names) before the first
 * visit, and the preview keeps them in memory for the next widths. It adds,
 * edits and removes contacts there, never anywhere real.
 * Exits 1 on any failure. Screenshots (with --shots) go to screenshots/people-check/.
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

const THEMES = ["amor", "fe", "paz", "esperanza"];
const SEED = Array.from({ length: 57 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `seed-${n}`,
    name: i === 4 ? "José Prueba" : i === 9 ? "Lucía Ejemplo" : `Persona ${n}`,
    phone: `+1201555${String(100 + i).padStart(4, "0")}`,
    at: 1_700_000_000_000 - i,
    themeIds: [THEMES[i % THEMES.length]],
    channel: i % 5 === 0 ? "sms" : "whatsapp",
    dailyEnabled: i % 7 === 0,
    cultoEnabled: i % 11 === 0,
    notes: i === 12 ? "La conocí en el parque" : undefined,
  };
});
const SMS = SEED.filter((row) => row.channel === "sms").length;
const CULTO = SEED.filter((row) => row.cultoEnabled).length;

const failures = [];
const fail = (width, what) => failures.push(`${width}px: ${what}`);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

let seeded = false;
for (const size of WIDTHS) {
  const { width } = size;
  const context = await browser.newContext({
    viewport: size,
    locale: "es-ES",
    hasTouch: width < 768,
    isMobile: width < 768,
  });
  if (!seeded) {
    // Only the first visit: the preview's account starts empty and takes
    // these from the browser, then keeps them for the widths that follow.
    await context.addInitScript((payload) => {
      localStorage.setItem("preacher-guest-state", JSON.stringify({ recipients: payload }));
    }, SEED);
    seeded = true;
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const from = message.location()?.url ?? "";
    if (from && !from.startsWith(BASE)) return;
    errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page
    .getByRole("navigation", { name: "Secciones" })
    .getByRole("button", { name: "Gente" })
    .click();
  const list = page.locator("section[aria-labelledby=people-list-title]");
  await list.waitFor({ timeout: 15000 });
  const cards = list.locator("ul > li");
  const status = list.locator("[aria-live=polite]").first();
  const newPerson = page.locator("[data-person-new]");
  await page.waitForTimeout(400);
  const total = await cards.count().then(async (shown) => {
    const text = (await status.textContent()) ?? "";
    return { shown, text };
  });

  // The list comes first: no form fields on the page, 20 people, a count.
  if (await page.locator("main #p-name").count())
    fail(width, "the person form is on the page, not in a panel");
  if (!/^\d+ personas$/.test(total.text.trim())) fail(width, `count reads "${total.text}"`);
  const everyone = Number(total.text.match(/\d+/)?.[0] ?? 0);
  if (total.shown !== Math.min(20, everyone)) fail(width, `${total.shown} cards shown at first`);
  const listTop = (await list.boundingBox())?.y ?? 0;
  const alertsTop =
    (await page.getByRole("button", { name: "Activar avisos en el teléfono" }).boundingBox())?.y ??
    0;
  if (alertsTop && alertsTop < listTop)
    fail(width, "the phone-alerts button comes before the list");
  const newBox = await newPerson.boundingBox();
  if (!newBox || newBox.height < 44)
    fail(width, `"Nueva persona" is ${Math.round(newBox?.height ?? 0)}px tall`);
  if (SHOTS) {
    mkdirSync("screenshots/people-check", { recursive: true });
    await page.screenshot({ path: `screenshots/people-check/${width}-list.png` });
  }

  // "Mostrar más" adds 20 at a time, then goes away.
  let rounds = 0;
  while (await list.getByRole("button", { name: /^Mostrar \d+ más$/ }).count()) {
    await list.getByRole("button", { name: /^Mostrar \d+ más$/ }).click();
    rounds += 1;
    if (rounds > 5) break;
  }
  if ((await cards.count()) !== everyone)
    fail(width, `after "Mostrar más": ${await cards.count()} of ${everyone}`);

  // Search: accents and case ignored, phone digits, and a clear way back.
  const search = list.getByRole("searchbox", { name: "Buscar contactos" });
  await search.fill("jose");
  if (
    (await cards.count()) !== 1 ||
    !(await cards.first().textContent())?.includes("José Prueba")
  ) {
    fail(width, 'searching "jose" does not find José Prueba');
  }
  if (!/^1 de \d+$/.test(((await status.textContent()) ?? "").trim()))
    fail(width, "no result count while searching");
  await search.fill("parque");
  if ((await cards.count()) !== 1) fail(width, "search does not look in notes");
  await search.fill("555-0105");
  if ((await cards.count()) !== 1) fail(width, "search does not find phone digits");
  await search.fill("zzzz");
  if (!(await list.getByText("Nadie coincide con la búsqueda.").isVisible()))
    fail(width, "no empty-search message");
  await list.getByRole("button", { name: "Quitar filtros" }).click();
  if ((await search.inputValue()) !== "" || (await cards.count()) !== 20)
    fail(width, '"Quitar filtros" does not reset');

  // Filters.
  const filters = list.getByRole("group", { name: "Mostrar" });
  const chip = (name) => filters.getByRole("button", { name: new RegExp(`^${name}`) });
  await chip("SMS").click();
  if ((await chip("SMS").getAttribute("aria-pressed")) !== "true")
    fail(width, "SMS filter not marked on");
  if (width === WIDTHS[0].width && (await cards.count()) !== Math.min(20, SMS)) {
    fail(width, `SMS filter shows ${await cards.count()}, expected ${SMS}`);
  }
  const smsCards = await cards.allTextContents();
  if (!smsCards.every((text) => text.includes("SMS")))
    fail(width, "SMS filter shows someone on WhatsApp");
  await chip("Culto").click();
  if (width === WIDTHS[0].width && (await cards.count()) !== CULTO)
    fail(width, `culto filter shows ${await cards.count()}`);
  await chip("Todas").click();
  const themeSelect = list.getByLabel("Tema");
  if (await themeSelect.count()) {
    await themeSelect.selectOption("paz");
    const pazCards = await cards.allTextContents();
    if (!pazCards.length || !pazCards.every((text) => text.includes("Paz")))
      fail(width, "theme filter shows other themes");
    await themeSelect.selectOption("all");
  } else fail(width, "no theme filter");
  for (const box of await filters
    .getByRole("button")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
    if (box < 40) fail(width, `a filter chip is ${Math.round(box)}px tall`);
  }

  // Nueva persona in its panel; closing keeps what was typed.
  await newPerson.click();
  let panel = page.getByRole("dialog", { name: "Nueva persona" });
  await panel.waitFor({ timeout: 3000 });
  await page.waitForTimeout(550);
  const saveBox = await panel.getByRole("button", { name: "Guardar persona" }).boundingBox();
  if (!saveBox || saveBox.y + saveBox.height > size.height)
    fail(width, "Guardar persona is below the screen");
  if (SHOTS) await page.screenshot({ path: `screenshots/people-check/${width}-new.png` });
  const name = `Prueba ${width}`;
  await panel.locator("#p-name").fill(name);
  await page.keyboard.press("Escape");
  await page
    .waitForFunction(() => !document.querySelector("[data-vaul-drawer]"), null, { timeout: 3000 })
    .catch(() => {});
  if (!(await page.evaluate(() => document.activeElement?.hasAttribute("data-person-new")))) {
    fail(width, "focus did not return to Nueva persona");
  }
  await newPerson.click();
  panel = page.getByRole("dialog", { name: "Nueva persona" });
  await panel.waitFor({ timeout: 3000 });
  await page.waitForTimeout(550);
  if ((await panel.locator("#p-name").inputValue()) !== name)
    fail(width, "closing the panel lost what was typed");
  await panel.locator("#p-phone").fill(`201555${String(9000 + width).slice(-4)}`);
  await panel.getByRole("button", { name: "Guardar persona" }).click();
  await page
    .waitForFunction(() => !document.querySelector("[data-vaul-drawer]"), null, { timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(200);
  if (!(await cards.first().textContent())?.includes(name))
    fail(width, "the new person is not first in the list");
  const afterAdd = Number(((await status.textContent()) ?? "").match(/\d+/)?.[0] ?? 0);
  if (afterAdd !== everyone + 1)
    fail(width, `count after adding is ${afterAdd}, expected ${everyone + 1}`);

  // Editar opens the panel filled in; focus comes back to that Editar.
  const firstEdit = cards.first().getByRole("button", { name: "Editar" });
  const editId = await firstEdit.getAttribute("data-person-edit");
  await firstEdit.click();
  panel = page.getByRole("dialog", { name: "Editar persona" });
  await panel.waitFor({ timeout: 3000 });
  await page.waitForTimeout(550);
  if ((await panel.locator("#p-name").inputValue()) !== name)
    fail(width, "Editar does not fill in the person");
  await panel.locator("#p-notes").fill("Nota de prueba");
  await panel.getByRole("button", { name: "Actualizar" }).click();
  await page
    .waitForFunction(() => !document.querySelector("[data-vaul-drawer]"), null, { timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(200);
  if (!(await cards.first().textContent())?.includes("Nota de prueba"))
    fail(width, "the edit was not saved");
  if (
    (await page.evaluate(() => document.activeElement?.getAttribute("data-person-edit"))) !== editId
  ) {
    fail(width, "focus did not return to Editar");
  }

  // Quitar asks first; Cancelar keeps them; Sí, quitar removes; Deshacer brings them back.
  const trash = cards.first().getByRole("button", { name: `Quitar a ${name}` });
  await trash.click();
  let confirm = page.getByRole("alertdialog", { name: `¿Quitar a ${name}?` });
  await confirm.waitFor({ timeout: 3000 });
  if (
    !(await confirm.evaluate(
      (el) =>
        el.contains(document.activeElement) && document.activeElement?.textContent === "Cancelar",
    ))
  ) {
    fail(width, "the confirmation does not start on Cancelar");
  }
  if (SHOTS) await page.screenshot({ path: `screenshots/people-check/${width}-remove.png` });
  await confirm.getByRole("button", { name: "Cancelar" }).click();
  await page.waitForTimeout(250);
  if (!(await cards.first().textContent())?.includes(name))
    fail(width, "Cancelar removed the person");
  if (
    !(await page.evaluate(
      (label) => document.activeElement?.getAttribute("aria-label") === label,
      `Quitar a ${name}`,
    ))
  ) {
    fail(width, "focus did not return to Quitar after Cancelar");
  }
  await trash.click();
  confirm = page.getByRole("alertdialog", { name: `¿Quitar a ${name}?` });
  await confirm.getByRole("button", { name: "Sí, quitar" }).click();
  await page.waitForTimeout(300);
  if ((await cards.first().textContent())?.includes(name))
    fail(width, "Sí, quitar did not remove the person");
  if (!(await page.evaluate(() => document.activeElement?.id === "people-list-title"))) {
    fail(width, "focus is lost after removing");
  }
  const undo = page.getByRole("button", { name: "Deshacer" });
  await undo.waitFor({ timeout: 3000 }).catch(() => {});
  if (!(await undo.count())) fail(width, "no Deshacer after removing");
  else {
    await undo.click();
    await page.waitForTimeout(300);
    if (!(await cards.first().textContent())?.includes(name))
      fail(width, "Deshacer did not bring the person back");
    // Leave the preview as it was for the next width.
    await cards
      .first()
      .getByRole("button", { name: `Quitar a ${name}` })
      .click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Sí, quitar" }).click();
    await page.waitForTimeout(300);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) fail(width, `page scrolls sideways by ${overflow}px`);
  for (const error of errors) fail(width, `console: ${error.slice(0, 160)}`);
  // Let the last change reach the preview's account before the next width.
  await page.waitForTimeout(700);
  await context.close();
  console.log(`${width}px checked`);
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`\nAll Gente checks passed at ${WIDTHS.map((w) => w.width).join(", ")} px.`);
