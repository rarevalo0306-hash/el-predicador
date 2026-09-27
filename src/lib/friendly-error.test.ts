import { test } from "node:test";
import assert from "node:assert/strict";
import { friendlyError } from "./friendly-error.ts";

const PLAIN = "No se pudo abrir este capítulo";

test("network wording becomes the plain sentence", () => {
  for (const message of ["Failed to fetch", "fetch failed", "Load failed", "The operation timed out", "NetworkError when attempting to fetch resource.", "HTTP 503"]) {
    assert.equal(friendlyError(new Error(message), PLAIN), PLAIN, message);
  }
  assert.equal(friendlyError(new Error("  "), PLAIN), PLAIN);
  assert.equal(friendlyError("not an error", PLAIN), PLAIN);
});

test("a message the server wrote for people is kept", () => {
  assert.equal(friendlyError(new Error("Capítulo no encontrado"), PLAIN), "Capítulo no encontrado");
});
