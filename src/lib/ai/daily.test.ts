import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blessingPrompt,
  completeSentences,
  endsComplete,
  firstName,
  proposeThemeRefs,
  readRefs,
  reflectionPrompt,
  sendNotePrompt,
  writeReflection,
  writeBlessing,
  writeSendNote,
} from "./daily.server.ts";

const config = { DEEPSEEK_API_KEY: "test", DEEPSEEK_BASE_URL: "http://fake" };

function fakeFetch(content: string, seen: { body?: unknown }[] = []) {
  return (async (_url: unknown, init?: RequestInit) => {
    seen.push({ body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  }) as typeof fetch;
}

test("the daily prompts carry the app's voice and limits", () => {
  const es = reflectionPrompt("es");
  assert.match(es, /180 a 380 caracteres/);
  assert.doesNotMatch(es, /\{who\}|\{tone\}|\{forbidden\}|\{examples\}/);
  assert.match(sendNotePrompt("en"), /60 to 180 characters/);
});

test("sentence helpers", () => {
  assert.equal(endsComplete("…la obra ya está terminada por ti."), true);
  assert.equal(endsComplete('…and let His Word be enough for today."'), true);
  assert.equal(endsComplete("¿Lo crees?"), true);
  assert.equal(endsComplete("Vuélvete a tu espíritu"), false);
  assert.equal(completeSentences("Uno. Dos tres", 100), "Uno.");
  assert.equal(completeSentences("Sin punto final", 100), "");
});

test("references are still read from a fenced, listed or cut-off answer", () => {
  assert.deepEqual(readRefs('```json\n{"refs": ["Salmos 119:9", "1 Timoteo 4:12"]}\n```'), [
    "Salmos 119:9",
    "1 Timoteo 4:12",
  ]);
  assert.deepEqual(readRefs('{"refs": ["Salmos 119:9", "1 Timoteo 4:'), ["Salmos 119:9"]);
  assert.deepEqual(readRefs("1. Salmos 119:9\n2. 2 Timoteo 2:22\n3. Proverbios 3:5-6"), [
    "Salmos 119:9",
    "2 Timoteo 2:22",
    "Proverbios 3:5-6",
  ]);
  assert.deepEqual(readRefs("Juan 3.16 y Romanos 8: 28"), ["Juan 3:16", "Romanos 8:28"]);
  assert.deepEqual(readRefs("No tengo citas."), []);
});

test("automatic AI sends references only, never supplied Scripture text", async () => {
  const bodies: string[] = [];
  const request = (async (_url, init) => {
    bodies.push(String(init?.body));
    return new Response(JSON.stringify({ choices: [{ message: { content: "Que la paz del Señor acompañe cada paso que des hoy." }, finish_reason: "stop" }] }));
  }) as typeof fetch;
  await writeReflection({ ref: "Juan 3:16", text: "RESTRICTED_SCRIPTURE_FIXTURE", locale: "es" }, config, request);
  await writeSendNote({ ref: "Juan 3:16", text: "RESTRICTED_SCRIPTURE_FIXTURE", locale: "es", theme: "Paz" }, config, request);
  await writeBlessing({ day: "2026-10-24", locale: "es" }, config, request);
  assert.equal(bodies.length, 3);
  for (const body of bodies) {
    assert.equal(body.includes("RESTRICTED_SCRIPTURE_FIXTURE"), false);
    assert.equal(JSON.parse(body).thinking.type, "disabled");
  }
  assert.ok(bodies[0].includes("Juan 3:16"));
});
