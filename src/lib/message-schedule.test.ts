import { test } from "node:test";
import assert from "node:assert/strict";
import { nextMessageOccurrence, validateSchedule, type ScheduleInput } from "./message-schedule.ts";
const valid: ScheduleInput = {
  recipientName: "Prueba",
  phone: "+12015550123",
  message: "Mensaje de prueba",
  channel: "whatsapp",
  days: [1, 3, 5],
  time: "09:15",
  timeZone: "America/New_York",
  consent: true,
};
test("schedules selected weekdays and precise minutes in the chosen zone", () => {
  assert.equal(
    nextMessageOccurrence(valid, new Date("2026-09-17T12:00:00Z")),
    "2026-09-18T13:15:00Z",
  );
  assert.equal(
    nextMessageOccurrence(valid, new Date("2026-09-18T13:15:00Z")),
    "2026-09-21T13:15:00Z",
  );
  assert.equal(
    nextMessageOccurrence(
      { ...valid, days: [4], timeZone: "Asia/Kolkata" },
      new Date("2026-09-17T03:00:00Z"),
    ),
    "2026-09-17T03:45:00Z",
  );
});
test("handles DST gaps, repeated hours, and weekly rollover without duplicate occurrence", () => {
  const schedule = { ...valid, days: [0], time: "02:30" };
  assert.equal(
    nextMessageOccurrence(schedule, new Date("2026-03-08T06:00:00Z")),
    "2026-03-08T07:30:00Z",
  );
  assert.equal(
    nextMessageOccurrence({ ...schedule, time: "01:30" }, new Date("2026-11-01T04:00:00Z")),
    "2026-11-01T05:30:00Z",
  );
  assert.equal(
    nextMessageOccurrence({ ...schedule, time: "01:30" }, new Date("2026-11-01T05:31:00Z")),
    "2026-11-08T06:30:00Z",
  );
});
test("validates country numbers, deduplicates days, and rejects invalid schedules", () => {
  assert.deepEqual(
    validateSchedule({ ...valid, phone: "2015550123", days: [3, 1, 3] }).days,
    [1, 3],
  );
  assert.equal(validateSchedule({ ...valid, phone: "2015550123" }).phone, "+12015550123");
  for (const change of [
    { days: [] },
    { days: [1.5] },
    { days: [7] },
    { time: "25:00" },
    { time: "09:70" },
    { timeZone: "wrong/zone" },
    { message: "" },
    { message: "x".repeat(1001) },
    { phone: "123" },
    { channel: "email" },
    { id: "../someone" },
  ]) {
    assert.throws(() => validateSchedule({ ...valid, ...change } as ScheduleInput));
  }
});
