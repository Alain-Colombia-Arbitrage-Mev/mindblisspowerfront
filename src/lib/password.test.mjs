import { test } from "node:test";
import assert from "node:assert/strict";

import { checkPassword, isValidPassword, PASSWORD_RULES } from "./password.js";

test("contraseña que cumple toda la política es válida", () => {
  assert.equal(isValidPassword("Abcdef1!"), true);
  assert.equal(isValidPassword("MiClave2026#"), true);
});

test("rechaza por corta", () => {
  const r = checkPassword("Ab1!");
  assert.equal(r.valid, false);
  assert.equal(r.results.find((x) => x.key === "length").met, false);
});

test("rechaza sin mayúscula", () => {
  const r = checkPassword("abcdef1!");
  assert.equal(r.valid, false);
  assert.equal(r.results.find((x) => x.key === "upper").met, false);
});

test("rechaza sin minúscula", () => {
  assert.equal(checkPassword("ABCDEF1!").results.find((x) => x.key === "lower").met, false);
});

test("rechaza sin número", () => {
  assert.equal(checkPassword("Abcdefg!").results.find((x) => x.key === "number").met, false);
});

test("rechaza sin símbolo", () => {
  const r = checkPassword("Abcdef12");
  assert.equal(r.valid, false);
  assert.equal(r.results.find((x) => x.key === "symbol").met, false);
});

test("cada regla se evalúa de forma independiente", () => {
  const r = checkPassword("");
  assert.equal(r.results.length, PASSWORD_RULES.length);
  assert.ok(r.results.every((x) => x.met === false));
});

test("tolera undefined/null", () => {
  assert.equal(isValidPassword(undefined), false);
  assert.equal(isValidPassword(null), false);
});
