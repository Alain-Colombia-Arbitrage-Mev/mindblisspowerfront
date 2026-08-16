import { test } from "node:test";
import assert from "node:assert/strict";

import { composePhone, isValidE164, formatLocalPhone } from "./phone.js";

test("composePhone une código + número quitando no-dígitos", () => {
  assert.equal(composePhone("+57", "300 123 4567"), "+573001234567");
  assert.equal(composePhone("+52", "55-1234-5678"), "+525512345678");
});

test("composePhone quita ceros iniciales del troncal nacional", () => {
  assert.equal(composePhone("+57", "0300 123 4567"), "+573001234567");
  assert.equal(composePhone("+34", "00612345678"), "+34612345678");
});

test("composePhone tolera vacío/undefined", () => {
  assert.equal(composePhone("+57", ""), "+57");
  assert.equal(composePhone("+57", undefined), "+57");
});

test("isValidE164 acepta números válidos", () => {
  assert.equal(isValidE164("+573001234567"), true);
  assert.equal(isValidE164("+18058635808"), true);
  assert.equal(isValidE164("+34612345678"), true);
});

test("isValidE164 rechaza inválidos", () => {
  assert.equal(isValidE164("573001234567"), false); // sin +
  assert.equal(isValidE164("+0573001234"), false); // empieza en 0
  assert.equal(isValidE164("+57300"), false); // muy corto
  assert.equal(isValidE164("+57 300 123 4567"), false); // con espacios
  assert.equal(isValidE164(""), false);
});

test("composePhone + isValidE164 producen un E.164 válido para Colombia", () => {
  assert.equal(isValidE164(composePhone("+57", "300 123 4567")), true);
});

test("formatLocalPhone agrupa en bloques de 3", () => {
  assert.equal(formatLocalPhone("3001234567"), "300 123 456 7");
  assert.equal(formatLocalPhone("300"), "300");
  assert.equal(formatLocalPhone("3001"), "300 1");
});

test("formatLocalPhone ignora no-dígitos y topa a 15", () => {
  assert.equal(formatLocalPhone("300-123-4567"), "300 123 456 7");
  assert.equal(formatLocalPhone("1234567890123456789"), "123 456 789 012 345");
});

test("formatLocalPhone tolera vacío", () => {
  assert.equal(formatLocalPhone(""), "");
  assert.equal(formatLocalPhone(undefined), "");
});
