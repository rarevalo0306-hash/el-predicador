import { test } from "node:test";
import assert from "node:assert/strict";
import { createCloudSaver } from "./cloud-saver.ts";

/** Timers run by hand, so each step of a save can be checked. */
function clock() {
  const pending: { run: () => void; ms: number }[] = [];
  return {
    pending,
    setTimer: (run: () => void, ms: number) => {
      const entry = { run, ms };
      pending.push(entry);
      return entry;
    },
    clearTimer: (entry: unknown) => {
      const at = pending.indexOf(entry as (typeof pending)[number]);
      if (at >= 0) pending.splice(at, 1);
    },
    next() {
      const entry = pending.shift();
      entry?.run();
      return entry?.ms;
    },
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("several quick changes make one save", async () => {
  const time = clock();
  let saves = 0;
  const saver = createCloudSaver({ save: async () => void saves++, onFailing: () => {}, ...time });
  saver.changed();
  saver.changed();
  saver.changed();
  assert.equal(time.pending.length, 1);
  assert.equal(time.next(), 400);
  await settle();
  assert.equal(saves, 1);
});

test("only one save at a time; a change made meanwhile is saved right after", async () => {
  const time = clock();
  const resolvers: (() => void)[] = [];
  let started = 0;
  const saver = createCloudSaver({
    save: () => {
      started += 1;
      return new Promise<void>((resolve) => resolvers.push(resolve));
    },
    onFailing: () => {},
    ...time,
  });
  saver.changed();
  time.next();
  assert.equal(started, 1);
  saver.changed();
  time.next();
  assert.equal(started, 1, "no second request while the first is out");
  resolvers[0]();
  await settle();
  assert.equal(started, 2, "the newer state follows the older one");
  resolvers[1]();
  await settle();
  assert.equal(started, 2);
});

test("a failed save is retried, then reported, and saving resumes on retry", async () => {
  const time = clock();
  let fail = true;
  let saves = 0;
  const reports: boolean[] = [];
  const saver = createCloudSaver({
    save: async () => {
      saves += 1;
      if (fail) throw new Error("offline");
    },
    onFailing: (failing) => reports.push(failing),
    retryDelaysMs: [2_000, 5_000],
    ...time,
  });
  saver.changed();
  time.next();
  await settle();
  assert.equal(time.next(), 2_000);
  await settle();
  assert.equal(time.next(), 5_000);
  await settle();
  assert.equal(saves, 3);
  assert.deepEqual(reports, [true], "reported once, after the last retry");
  // New changes wait for the person's retry instead of hammering the server.
  saver.changed();
  assert.equal(time.pending.length, 0);
  fail = false;
  saver.retry();
  await settle();
  assert.equal(saves, 4);
  assert.deepEqual(reports, [true, false]);
});

test("leaving the page saves what is pending at once", async () => {
  const time = clock();
  let saves = 0;
  const saver = createCloudSaver({ save: async () => void saves++, onFailing: () => {}, ...time });
  saver.flush();
  await settle();
  assert.equal(saves, 0, "nothing pending, nothing sent");
  saver.changed();
  saver.flush();
  await settle();
  assert.equal(saves, 1);
  assert.equal(time.pending.length, 0);
});

test("a stopped saver sends nothing more", async () => {
  const time = clock();
  let saves = 0;
  const saver = createCloudSaver({ save: async () => void saves++, onFailing: () => {}, ...time });
  saver.changed();
  saver.stop();
  saver.flush();
  saver.retry();
  await settle();
  assert.equal(saves, 0);
  assert.equal(time.pending.length, 0);
});
