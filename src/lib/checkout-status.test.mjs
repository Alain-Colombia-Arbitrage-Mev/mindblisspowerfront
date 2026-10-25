import assert from "node:assert/strict";
import test from "node:test";
import { checkoutErrorStatus, checkoutResultStatus, checkoutStatusCopy, initialCheckoutStatus } from "./checkout-status.mjs";

test("a paid redirect starts unconfirmed and never claims a payment succeeded", () => {
  const state = initialCheckoutStatus(true);
  assert.equal(state.active, false);
  assert.equal(state.positioned, false);
  assert.equal(state.summary, null);
  assert.equal(state.checking, true);
  assert.equal(checkoutStatusCopy(state).title, "Verificando tu compra");
});

test("membership and placement are independent backend observations", () => {
  const active = checkoutResultStatus({ summary: { active_packages: 1 }, active: true, positioned: false }, { exhausted: false });
  assert.equal(active.checking, true);
  assert.equal(checkoutStatusCopy(active).title, "Membresía activa");
  const ready = checkoutResultStatus({ ...active, positioned: true }, { exhausted: false });
  assert.equal(ready.done, true);
  assert.equal(ready.checking, false);
  assert.equal(checkoutStatusCopy(ready).title, "Membresía activa y posición lista");
  assert.doesNotMatch(checkoutStatusCopy(ready).title, /pago completado|pago recibido/i);
});

test("exhaustion is pending rather than a fabricated successful payment", () => {
  const pending = checkoutResultStatus({ summary: { active_packages: 0 }, active: false, positioned: false }, { exhausted: true });
  assert.equal(pending.done, true);
  assert.equal(checkoutStatusCopy(pending).title, "Confirmación pendiente");
  assert.match(checkoutStatusCopy(pending).description, /antes de intentar otro cargo/);
});

test("temporary failures preserve observations but deadline ends checking", () => {
  const observed = checkoutResultStatus({ summary: { active_packages: 1 }, active: true, positioned: false }, { exhausted: false });
  assert.equal(checkoutErrorStatus(observed, { status: 503 }, { exhausted: false }).summary, observed.summary);
  const ended = checkoutErrorStatus(observed, { status: 504 }, { exhausted: true });
  assert.equal(ended.checking, false);
  assert.equal(ended.done, true);
});

test("authorization failures clear previously displayed private data", () => {
  const observed = checkoutResultStatus({ summary: { payments: [{ id: "private" }] }, active: true, positioned: true }, { exhausted: false });
  for (const status of [401, 403]) {
    const denied = checkoutErrorStatus(observed, { status }, { exhausted: true });
    assert.equal(denied.summary, null);
    assert.equal(denied.active, false);
    assert.equal(denied.positioned, false);
    assert.equal(denied.checking, false);
    assert.match(checkoutStatusCopy(denied).description, /iniciar sesión/);
  }
});
