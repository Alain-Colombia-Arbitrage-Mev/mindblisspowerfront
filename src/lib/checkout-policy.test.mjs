import assert from 'node:assert/strict';
import test from 'node:test';
import { checkoutErrorMessage, checkoutProvider, hostedCheckoutURL } from './checkout-policy.mjs';

test('provider omission preserves Stripe; explicit invalid provider never silently falls back', () => {
  assert.equal(checkoutProvider(undefined), 'stripe');
  for (const provider of ['stripe', 'nowpayments']) assert.equal(checkoutProvider(provider), provider);
  for (const provider of [null, false, {}, [], 'Stripe', ' NOWPAYMENTS ', 'wallet', 'stripe,nowpayments']) assert.equal(checkoutProvider(provider), null);
});

test('hosted checkout whitelist accepts exact payment pages and preserves Stripe opaque fragment', () => {
  assert.equal(hostedCheckoutURL('https://checkout.stripe.com/c/pay/cs_live_Synthetic123#opaqueState', 'stripe'),
    'https://checkout.stripe.com/c/pay/cs_live_Synthetic123#opaqueState');
  assert.equal(hostedCheckoutURL('https://nowpayments.io/payment/?iid=12345', 'nowpayments'), 'https://nowpayments.io/payment/?iid=12345');
  assert.equal(hostedCheckoutURL('https://nowpayments.io/payment?iid=12345&source=synthetic-test', 'nowpayments'),
    'https://nowpayments.io/payment?iid=12345&source=synthetic-test');
  assert.equal(hostedCheckoutURL('https://sandbox.nowpayments.io/payment/?iid=12345', 'nowpayments'), null);
  assert.ok(hostedCheckoutURL('https://sandbox.nowpayments.io/payment/?iid=12345', 'nowpayments', 'sandbox'));
  assert.equal(hostedCheckoutURL('https://nowpayments.io/payment/?iid=12345', 'nowpayments', 'sandbox'), null);
});

test('malicious redirects, lookalike domains, cross-provider URLs and ambiguous invoice IDs are rejected', () => {
  for (const url of ['javascript:alert(1)', '//nowpayments.io/payment/?iid=1', 'http://nowpayments.io/payment/?iid=1',
    'https://nowpayments.io.attacker.test/payment/?iid=1', 'https://attacker.test@nowpayments.io/payment/?iid=1',
    'https://nowpayments.io:8443/payment/?iid=1', 'https://nowpayments.io/payment/?iid=1#redirect',
    'https://nowpayments.io/payment/?iid=1&iid=2', 'https://nowpayments.io/payment/?iid=01',
    'https://nowpayments.io/payment/?iid=1&success_url=https://attacker.test', 'https://nowpayments.io/payment/?iid=1&source=bad%20source',
    'https://nowpayments.io/login?iid=1', 'https://nowpayments.io/payment/?iid=1\\evil', ' https://nowpayments.io/payment/?iid=1',
    'https://checkout.stripe.com/c/pay/cs_live_Synthetic123']) assert.equal(hostedCheckoutURL(url, 'nowpayments'), null, url);
  for (const url of ['https://checkout.stripe.com/redirect?url=https://attacker.test',
    'https://checkout.stripe.com/c/pay/cs_live_Synthetic123?redirect=other', 'https://checkout.stripe.com/c/pay/bad',
    'https://checkout.stripe.com.attacker.test/c/pay/cs_live_Synthetic123', 'https://nowpayments.io/payment/?iid=1']) {
    assert.equal(hostedCheckoutURL(url, 'stripe'), null, url);
  }
});

test('copy never treats a redirect or unavailable provider as activation or invites blind duplicate payment', () => {
  assert.match(checkoutErrorMessage('nowpayments-unavailable', 'nowpayments'), /aún no están habilitados/);
  assert.match(checkoutErrorMessage('checkout_pending_review', 'nowpayments'), /No vuelvas a pagar/);
  assert.match(checkoutErrorMessage('membership_payment_pending_review', 'nowpayments'), /No vuelvas a pagar/);
  assert.doesNotMatch(checkoutErrorMessage('membership_payment_pending_review', 'nowpayments'), /No se ha iniciado un cobro/);
  for (const code of ['core_not_ready', 'financial_review_required', 'membership_eligibility_unavailable', 'stripe_unavailable']) {
    assert.match(checkoutErrorMessage(code), /no están habilitados temporalmente/);
  }
  assert.match(checkoutErrorMessage('private upstream diagnostic', 'nowpayments'), /historial.*antes de volver/);
  assert.doesNotMatch(checkoutErrorMessage('private upstream diagnostic'), /private upstream/);
});
