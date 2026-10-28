import { test } from "node:test";
import assert from "node:assert/strict";
import { composeBrief, composePrompt, streamComposed, type ComposeInput } from "./compose.ts";

const input: ComposeInput = {
  caseTitle: "Idolatría",
  issue: "Dios no comparte su gloria.",
  approach: "No pelees por la estatuilla.",
  points: ["Un solo Dios.", "Un solo mediador."],
  verses: [{ ref: "1 Timoteo 2:5", text: "Hay un solo Dios, y un solo mediador…" }],
  details: "  Mi tía Rosa, tiene un altar en casa y está enferma  ",
  locale: "es",
};
const config = { DEEPSEEK_API_KEY: "sk-test" };

test("the brief carries the voice, the task and the rules that matter", () => {
  for (const locale of ["es", "en"] as const) {
    const prompt = composePrompt(locale);
    assert.match(prompt, /Watchman Nee/);
    assert.match(prompt, /WhatsApp/);
    assert.match(prompt, /100 (y|to) 170/);
    assert.match(prompt, /No inventes versículos|Do not invent verses/);
    assert.match(prompt, /prosperidad|prosperity/);
  }
});

test("the case and the person are laid out in full", () => {
  const brief = composeBrief(input);
  assert.match(brief, /Caso: Idolatría/);
  assert.match(brief, /- Un solo Dios\./);
  assert.match(brief, /- 1 Timoteo 2:5: Hay un solo Dios/);
  assert.match(brief, /Sobre la persona: Mi tía Rosa/);
  assert.match(composeBrief({ ...input, details: "" }), /\(sin detalles\)/);
});

test("LBLA edition blocks composing before sending passages to AI", async () => {
  let calls = 0;
  const request = (async () => {
    calls++;
    throw new Error("must not fetch");
  }) as typeof fetch;
  await assert.rejects(streamComposed(input, config, request), /licencia de LBLA/);
  assert.equal(calls, 0);
});


test("reference-only composition streams without fetching Bible text", async () => {
  const request = (async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    assert.ok(!JSON.stringify(body).includes(input.verses[0].text));
    return new Response('data: {"choices":[{"delta":{"content":"A personal message"}}]}\n\ndata: [DONE]\n\n');
  }) as typeof fetch;
  const stream = await streamComposed({ ...input, verses: [{ ref: "1 Timoteo 2:5", text: "" }] }, config, request);
  let output = "";
  for await (const chunk of stream) output += chunk;
  assert.equal(output, "A personal message");
});
