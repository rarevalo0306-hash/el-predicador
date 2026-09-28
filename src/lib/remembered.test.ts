import assert from "node:assert/strict";
import { test } from "node:test";
import { createRemembered } from "./remembered.ts";

function setup() {
  let clock = 1_000;
  const remembered = createRemembered<string | null>({
    keepEmptyMs: 60_000,
    isEmpty: (value) => value === null,
    now: () => clock,
  });
  return {
    remembered,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

test("an answer is asked for once and kept", async () => {
  const { remembered } = setup();
  let calls = 0;
  const fetch = async () => {
    calls += 1;
    return "palabra";
  };
  assert.equal(await remembered.load("2026-09-27:es", fetch), "palabra");
  assert.equal(await remembered.load("2026-09-27:es", fetch), "palabra");
  assert.equal(remembered.peek("2026-09-27:es"), "palabra");
  assert.equal(calls, 1);
});

test("two visits at once share the same request", async () => {
  const { remembered } = setup();
  let calls = 0;
  let finish: (value: string) => void = () => undefined;
  const fetch = () => {
    calls += 1;
    return new Promise<string>((resolve) => {
      finish = resolve;
    });
  };
  const first = remembered.load("k", fetch);
  const second = remembered.load("k", fetch);
  finish("uno");
  assert.deepEqual(await Promise.all([first, second]), ["uno", "uno"]);
  assert.equal(calls, 1);
});

test("each key is kept on its own", async () => {
  const { remembered } = setup();
  await remembered.load("2026-09-27:es", async () => "es");
  await remembered.load("2026-09-27:en", async () => "en");
  assert.equal(remembered.peek("2026-09-27:es"), "es");
  assert.equal(remembered.peek("2026-09-27:en"), "en");
  assert.equal(remembered.peek("2026-09-28:es"), undefined);
});

test("a failure is not kept, so the next visit tries again", async () => {
  const { remembered } = setup();
  await assert.rejects(
    remembered.load("k", async () => {
      throw new Error("fetch failed");
    }),
  );
  assert.equal(remembered.peek("k"), undefined);
  assert.equal(await remembered.load("k", async () => "otra vez"), "otra vez");
});

test("an empty answer is kept only for a while", async () => {
  const { remembered, advance } = setup();
  let calls = 0;
  const fetch = async () => {
    calls += 1;
    return calls === 1 ? null : "ya escrita";
  };
  assert.equal(await remembered.load("k", fetch), null);
  assert.equal(await remembered.load("k", fetch), null);
  assert.equal(calls, 1);
  advance(60_001);
  assert.equal(remembered.peek("k"), undefined);
  assert.equal(await remembered.load("k", fetch), "ya escrita");
  advance(24 * 60 * 60 * 1000);
  assert.equal(remembered.peek("k"), "ya escrita");
});
