import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const browser = await chromium.launch({ headless: true });
const base = process.argv[2] ?? "http://localhost:8080";
const build = base.includes("8081") ? "built" : "dev";
mkdirSync("screenshots/redesign", { recursive: true });
try {
  for (const lang of ["es", "en"])
    for (const width of [390, 320, 1280]) {
      const page = await browser.newPage({
        viewport: { width, height: 844 },
        locale: lang === "es" ? "es-ES" : "en-US",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page
        .getByRole("heading", { name: lang === "es" ? "Un momento para ti." : "A moment for you." })
        .waitFor({ timeout: 60000 });
      const nav = page.locator(".app-tab-bar");
      async function snap(name) {
        await page.waitForTimeout(500);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
          throw new Error(`overflow ${name} ${lang} ${width}`);
        await page.screenshot({
          path: `screenshots/redesign/${build}-${lang}-${name}-${width}.png`,
          fullPage: false,
        });
      }
      await nav
        .getByRole("button", { name: lang === "es" ? "Biblia" : "Bible", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: lang === "es" ? "Tu Biblia, a mano." : "Your Bible, close at hand.",
        })
        .waitFor();
      await snap("bible");
      await page
        .getByRole("tab", { name: lang === "es" ? /Nuevo Testamento/ : /New Testament/ })
        .click();
      await page
        .getByRole("button", {
          name: lang === "es" ? "Mateo 28 capítulos" : "Matthew 28 chapters",
          exact: true,
        })
        .click();
      await page.getByRole("button", { name: "1", exact: true }).click();
      await page.getByRole("heading", { name: lang === "es" ? /Mateo 1/ : /Matthew 1/ }).waitFor();
      await snap("reader");
      await nav
        .getByRole("button", { name: lang === "es" ? "Temas" : "Themes", exact: true })
        .click();
      await page
        .locator(".theme-feature > img")
        .first()
        .evaluate((img) => img.decode());
      await snap("themes");
      await page
        .getByRole("button", {
          name: lang === "es" ? "Ver todos los temas" : "View all themes",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: lang === "es" ? /^Amistad / : /^Friendship / })
        .click();
      await page
        .getByRole("heading", { name: lang === "es" ? "Amistad" : "Friendship", exact: true })
        .waitFor();
      await nav
        .getByRole("button", { name: lang === "es" ? "Gente" : "People", exact: true })
        .click();
      await snap("people");
      await page.locator("[data-person-new]").click();
      await page.getByRole("dialog").waitFor();
      await snap("person-form");
      await page
        .getByRole("button", { name: lang === "es" ? "Cerrar" : "Close", exact: true })
        .click();
      await nav.getByRole("button", { name: lang === "es" ? "Más" : "More", exact: true }).click();
      await snap("more");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: lang === "es" ? /^Guardados/ : /^Saved/ })
        .click();
      await page
        .getByRole("heading", {
          name: lang === "es" ? "Palabras para volver." : "Words to return to.",
        })
        .waitFor();
      await snap("saved");
      await nav.getByRole("button", { name: lang === "es" ? "Más" : "More", exact: true }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: lang === "es" ? /^Ajustes/ : /^Settings/ })
        .click();
      await snap("settings");
      await page
        .getByRole("button", { name: lang === "es" ? "English" : "Español", exact: true })
        .click();
      await page
        .getByRole("heading", { name: lang === "es" ? "Settings" : "Ajustes", exact: true })
        .waitFor();
      if (errors.length) throw new Error(errors.join("\n"));
      console.log(JSON.stringify({ build, lang, width, ok: true }));
      await page.close();
    }
} finally {
  await browser.close();
}
