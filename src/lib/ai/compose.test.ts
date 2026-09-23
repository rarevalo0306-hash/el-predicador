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

test("a composed message streams, with the details trimmed to their limit", async () => {
  let body: Record<string, unknown> = {};
  const gen = await streamComposed(
    { ...input, details: "x".repeat(1000) },
    config,
    async (_url, init) => {
      body = JSON.parse(String(init!.body));
      const text = [
        "data: ",
        JSON.stringify({ choices: [{ delta: { content: "Hola" } }] }),
        "\n\ndata: [DONE]\n\n",
      ].join("");
      return new Response(text, { headers: { "Content-Type": "text/event-stream" } });
    },
  );
  let out = "";
  for await (const piece of gen) out += piece;
  assert.equal(out, "Hola");
  assert.equal(body.stream, true);
  const user = (body.messages as { content: string }[])[1].content;
  assert.ok(user.length < 1000, "details were cut");
  await assert.rejects(streamComposed(input, {}), /deepseek_not_configured/);
});
