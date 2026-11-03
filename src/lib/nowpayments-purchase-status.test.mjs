import test from 'node:test';
import assert from 'node:assert/strict';
import { nowpaymentsPurchaseCheck, nowpaymentsPurchaseCheckError } from './nowpayments-purchase-check.mjs';

const orderId = 'a02f5a55-5fa3-4239-845b-ac6b699110ee';
const pending = { provider: 'nowpayments', order_id: orderId, state: 'pending', payment_confirmed: false,
  signature_validated: false, provider_verified: false, persisted: false, fulfillment_status: 'awaiting_payment' };
const confirmed = { ...pending, state: 'completed', payment_confirmed: true, signature_validated: true, provider_verified: true, persisted: true };

test('purchase query presentation distinguishes pending, verified receipt, actual membership activation and security review without a provider-live claim', () => {
  const cases = [
    [pending, 'Pendiente de confirmación', false, false],
    [confirmed, 'Pago confirmado · activación pendiente', true, false],
    [{ ...confirmed, fulfillment_status: 'not_activated' }, 'Pago confirmado · activación pendiente', true, false],
    [{ ...confirmed, fulfillment_status: 'review_required' }, 'Pago confirmado · activación pendiente', true, false],
    [{ ...confirmed, fulfillment_status: 'activated' }, 'Membresía activada', true, true],
    [{ ...pending, state: 'under_review', fulfillment_status: 'risk_review' }, 'Compra en revisión', true, false],
    [{ ...pending, state: 'under_review', fulfillment_status: 'security_blocked' }, 'Compra en revisión', true, false],
  ];
  for (const [value, title, blockPayment, activated] of cases) {
    const result = nowpaymentsPurchaseCheck(value, orderId);
    assert.equal(result.title, title); assert.equal(result.blockPayment, blockPayment); assert.equal(result.activated, activated);
    assert.equal(typeof result.description, 'string'); assert.equal(typeof result.tone, 'string');
    assert.doesNotMatch(result.description, /hemos consultado a NOWPayments|consultado en vivo|pago no realizado|no has pagado/i);
    assert.deepEqual(Object.keys(result).sort(), ['title', 'tone', 'description', 'blockPayment', 'activated'].sort());
  }
  assert.match(nowpaymentsPurchaseCheck(pending, orderId).description, /Si ya enviaste los fondos, no vuelvas a pagar/);
  assert.match(nowpaymentsPurchaseCheck({ ...confirmed, fulfillment_status: 'activated' }, orderId).description, /No es una confirmación de rendimientos cobrados ni retiros/);
});

test('the inline presenter revalidates exact owner, persistence, provider verification and signature proof instead of trusting checkout returns or partial states', () => {
  for (const value of [null, {}, { state: 'completed', fulfillment_status: 'activated' },
    { ...confirmed, persisted: false }, { ...confirmed, signature_validated: false },
    { ...confirmed, provider_verified: false }, { ...confirmed, payment_confirmed: false },
    { ...confirmed, payment_confirmed: 'true' }, { ...confirmed, provider: 'stripe' },
    { ...confirmed, order_id: 'a02f5a55-5fa3-4239-845b-ac6b699110ef' },
    { ...pending, fulfillment_status: 'activated' }, { ...confirmed, fulfillment_status: 'security_blocked' },
    { received: true, mode: 'capture_only', state: 'captured', fulfillment_status: 'not_activated' },
    { ...confirmed, error: 'private diagnostic' }]) assert.equal(nowpaymentsPurchaseCheck(value, orderId), null);
  for (const invalidId of ['', orderId.toUpperCase(), '00000000-0000-0000-0000-000000000000']) {
    assert.equal(nowpaymentsPurchaseCheck(confirmed, invalidId), null);
  }
});

test('query errors use safe specific copy from status or timeout enums, never raw diagnostics or statements that funds were not paid', () => {
  const cases = [
    [{ status: 401 }, 'Sesión no disponible'], [{ status: 403 }, 'Sesión no disponible'],
    [{ status: 404 }, 'No pudimos consultar esta compra'], [{ status: 429 }, 'Demasiadas consultas'],
    [{ name: 'TimeoutError' }, 'La consulta tardó demasiado'], [{ name: 'AbortError' }, 'La consulta tardó demasiado'],
    [{ status: 503 }, 'Estado temporalmente no disponible'], [{ status: 502 }, 'Estado temporalmente no disponible'],
    [{}, 'Estado temporalmente no disponible'],
  ];
  for (const [metadata, title] of cases) {
    const result = nowpaymentsPurchaseCheckError(Object.assign(new Error('private@example.test postgres://secret@host must-not-leak'), metadata));
    assert.equal(result.title, title);
    assert.deepEqual(Object.keys(result).sort(), ['description', 'title']);
    assert.doesNotMatch(JSON.stringify(result), /private@|postgres:|secret@|must-not-leak|pago fallido|no has pagado|no se realizó el pago/i);
  }
  assert.match(nowpaymentsPurchaseCheckError({ status: 404 }).description, /Esto no confirma si el pago se realizó/);
  assert.match(nowpaymentsPurchaseCheckError({ status: 429 }).description, /este límite no indica el estado del pago/);
});
