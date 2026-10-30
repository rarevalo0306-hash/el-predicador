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

test("permission persists by account and use, can be revoked and fails safely", async () => {
  const { revokeAIConsent, AI_CONSENT_VERSION } = await import("./ai-consent.ts");
  const values = new Map<string, string>();
  let prompts = 0;
  let accepted = true;
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      confirm: () => {
        prompts++;
        return accepted;
      },
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  });
  try {
    assert.equal(requestAIConsent("es", "ask", "alice"), true);
    assert.equal(requestAIConsent("en", "ask", "alice"), true);
    assert.equal(prompts, 1, "language changes must not ask again");
    assert.equal(requestAIConsent("en", "ask", "bob"), true);
    assert.equal(prompts, 2, "another account needs its own permission");
    assert.equal(requestAIConsent("es", "compose", "alice"), true);
    assert.equal(prompts, 3, "personal drafting is a different disclosed use");
    assert.equal(revokeAIConsent("alice"), true);
    accepted = false;
    assert.equal(requestAIConsent("es", "ask", "alice"), false);
    assert.equal(requestAIConsent("es", "ask", "alice"), false);
    assert.equal(prompts, 5, "a refusal must never be remembered as consent");
    assert.equal(requestAIConsent("es", "ask", "bob"), true);
    assert.equal(requestAIConsent("es", "ask"), false);
    values.clear();
    values.set(`preacher-ai-consent:old:alice:ask`, "accepted");
    assert.equal(requestAIConsent("es", "ask", "alice"), false);
    assert.ok(AI_CONSENT_VERSION.includes("deepseek"));
    window.localStorage.getItem = () => {
      throw new Error("blocked");
    };
    window.localStorage.setItem = () => {
      throw new Error("blocked");
    };
    accepted = true;
    assert.equal(requestAIConsent("es", "ask", "alice"), true);
    const after = prompts;
    assert.equal(requestAIConsent("es", "ask", "alice"), true);
    assert.equal(prompts, after + 1);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
