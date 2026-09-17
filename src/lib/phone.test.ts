import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, restorePhone, formatPhone, whatsAppUrl, smsUrl } from "./phone.ts";

test("US area codes and old digit-only contacts normalize without doubling +1", () => {
  for (const value of ["(201) 555-0123", "2015550123", "12015550123", "+1 201 555 0123"]) {
    assert.equal(normalizePhone(value), "+12015550123");
  }
});

test("international numbers retain calling codes and significant leading zeros", () => {
  for (const [value, expected] of [
    ["+52 55 1234 5678", "+525512345678"],
    ["+34 612 34 56 78", "+34612345678"],
    ["+57 321 1234567", "+573211234567"],
    ["+1 (809) 555-0123", "+18095550123"],
    ["+44 20 7946 0958", "+442079460958"],
    ["0044 20 7946 0958", "+442079460958"],
    ["+39 06 6982 0001", "+390669820001"],
    ["442079460958", "+442079460958"],
  ])
    assert.equal(normalizePhone(value), expected);
});

test("rejects incomplete, oversized, malformed and extended numbers", () => {
  for (const value of [
    "",
    "12345",
    "+1",
    "+52 55",
    "+999123456789",
    "+1+2015550123",
    "Call +12015550123",
    "+12015550123 ext 5",
    "+120155501234567890",
    "1234567",
  ]) {
    assert.equal(normalizePhone(value), null, value);
  }
});

test("saved contacts have readable international display and legacy data is preserved", () => {
  assert.equal(formatPhone("2015550123"), "+1 201 555 0123");
  assert.equal(formatPhone("+34612345678"), "+34 612 34 56 78");
  assert.equal(restorePhone("442079460958"), "+442079460958");
  assert.equal(restorePhone("555-0123"), "5550123");
  assert.equal(formatPhone("5550123"), "5550123");
});

test("WhatsApp receives country digits and SMS retains the international plus", () => {
  assert.equal(
    whatsAppUrl("Hola & paz", "+525512345678"),
    "https://wa.me/525512345678?text=Hola%20%26%20paz",
  );
  assert.equal(smsUrl("Hola", "+34612345678"), "sms:+34612345678?&body=Hola");
  assert.equal(whatsAppUrl("Hola", "2015550123"), "https://wa.me/12015550123?text=Hola");
  assert.equal(whatsAppUrl("Hola"), "https://wa.me/?text=Hola");
  assert.equal(smsUrl("Hola"), "sms:?&body=Hola");
  assert.throws(() => whatsAppUrl("Hola", "123"), /phone/);
  assert.throws(() => smsUrl("Hola", "123"), /phone/);
});
