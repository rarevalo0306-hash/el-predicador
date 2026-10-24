import assert from "node:assert/strict";
import { test } from "node:test";
import { aiSharingText, requestAIConsent } from "./ai-consent.ts";
test("AI disclosure names the recipient and the content in both languages", () => {
  for (const locale of ["es", "en"] as const)
    for (const kind of ["ask", "compose"] as const) {
      const message = aiSharingText(locale, kind);
      assert.match(message, /DeepSeek/);
      assert.match(message, locale === "es" ? /historial|detalles/ : /history|details/);
    }
  assert.equal(requestAIConsent("es", "ask"), false, "server-side code cannot grant consent");
});
