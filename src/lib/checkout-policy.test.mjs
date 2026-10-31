import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { checkoutErrorMessage, checkoutErrorNotice, checkoutProvider, hostedCheckoutURL, stripeCheckoutEnabled, nowpaymentsMembershipsEnabled } from './checkout-policy.mjs';

test('only the exact server-owned runtime Stripe flag enables new charges', () => {
  assert.equal(stripeCheckoutEnabled({ STRIPE_CHECKOUT_ENABLED: 'true' }), true);
  for (const flag of [undefined, 'false', false, true, 'TRUE', ' true ', 1, '1', '']) {
    assert.equal(stripeCheckoutEnabled({ STRIPE_CHECKOUT_ENABLED: flag, NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED: 'true' }), false);
  }
  assert.equal(stripeCheckoutEnabled(undefined), false);
  assert.match(checkoutErrorMessage('stripe_checkout_disabled'), /Stripe están suspendidos temporalmente/);
});

test('NOWPayments membership admission has an independent literal server flag and no public override', () => {
  assert.equal(nowpaymentsMembershipsEnabled({ NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true', STRIPE_CHECKOUT_ENABLED: 'false' }), true);
  for (const flag of [undefined, 'false', false, true, 'TRUE', ' true ', 1, '1', '']) {
    assert.equal(nowpaymentsMembershipsEnabled({ NOWPAYMENTS_MEMBERSHIPS_ENABLED: flag, NEXT_PUBLIC_NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true', STRIPE_CHECKOUT_ENABLED: 'true' }), false);
  }
  assert.equal(nowpaymentsMembershipsEnabled(undefined), false);
  assert.match(checkoutErrorMessage('nowpayments_checkout_disabled', 'nowpayments'), /aún no están habilitadas/);
});

test('every portal deployment scope explicitly pauses Stripe and the page passes only a runtime boolean', () => {
  const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'));
  for (const scope of [config, config.env.staging, config.env.production]) {
    assert.equal(scope.vars.STRIPE_CHECKOUT_ENABLED, 'false');
    assert.equal(scope.vars.NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED, undefined);
  }
  const page = readFileSync(new URL('../app/dashboard/packages/page.jsx', import.meta.url), 'utf8');
  assert.match(page, /stripeCheckoutEnabled\(runtimeEnvironment\(\)\)/);
  assert.match(page, /stripeEnabled=\{stripeEnabled\}/);
  assert.match(page, /nowpaymentsMembershipsEnabled\(runtimeEnvironment\(\)\)/);
  assert.match(page, /nowpaymentsEnabled=\{nowpaymentsEnabled\}/);
  assert.doesNotMatch(page, /NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED/);
  assert.doesNotMatch(page, /NEXT_PUBLIC_NOWPAYMENTS_MEMBERSHIPS_ENABLED/);
  for (const scope of [config, config.env.staging]) {
    assert.equal(scope.vars.NOWPAYMENTS_MEMBERSHIPS_ENABLED, 'false');
    assert.equal(scope.vars.NOWPAYMENTS_WEBHOOK_ENABLED, 'false');
  }
  for (const flag of ['NOWPAYMENTS_MEMBERSHIPS_ENABLED', 'NOWPAYMENTS_WEBHOOK_ENABLED']) {
    assert.ok(['true', 'false'].includes(config.env.production.vars[flag]), `${flag} must be explicitly configured`);
  }
});

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
  assert.match(checkoutErrorMessage('membership_payment_pending_review', 'nowpayments'), /esta misma factura/);
  assert.match(checkoutErrorMessage('membership_payment_pending_review', 'nowpayments'), /factura anterior se conserva/);
  assert.match(checkoutErrorNotice('purchase_request_conflict', 'nowpayments'), /otra compra.*Referencia: purchase_request_conflict/);
  for (const code of ['core_not_ready', 'financial_review_required', 'membership_eligibility_unavailable', 'stripe_unavailable']) {
    assert.match(checkoutErrorMessage(code), /no están habilitados temporalmente/);
  }
  assert.match(checkoutErrorMessage('private upstream diagnostic', 'nowpayments'), /historial.*antes de volver/);
  assert.doesNotMatch(checkoutErrorMessage('private upstream diagnostic'), /private upstream/);
});

test('checkout failures distinguish session outage, pre-creation refusal and uncertain outcomes', () => {
  const session = checkoutErrorMessage('authentication-unavailable', 'nowpayments');
  assert.match(session, /comprobar tu sesión.*servicio de acceso no está disponible/);
  assert.doesNotMatch(session, /pagos.*habilitados|pago completado/);
  const refused = checkoutErrorMessage('nowpayments_checkout_unavailable', 'nowpayments');
  assert.match(refused, /servicio de pagos no está disponible/i);
  assert.match(refused, /No se ha iniciado un cobro/);
  for (const code of ['payments-unreachable', 'invalid-checkout-response', 'upstream_unavailable']) {
    const message = checkoutErrorMessage(code, 'nowpayments');
    assert.match(message, /No vuelvas a pagar todavía.*historial/);
    assert.doesNotMatch(message, /No se ha iniciado un cobro|no están habilitados|pago completado/);
    assert.match(checkoutErrorNotice(code, 'nowpayments'), new RegExp(`Referencia: ${code}\\.$`));
  }
});

test('technical checkout references never reflect arbitrary error data or private identifiers', () => {
  for (const code of ['private postgres://operator:password@host', 'guard@example.test', '<script>alert(1)</script>',
    { error: 'secret', toString() { throw new Error('must not stringify'); } }, null, undefined, 'upstream_unavailable\nsecret']) {
    const notice = checkoutErrorNotice(code, 'nowpayments');
    assert.match(notice, /Referencia: checkout_unknown\.$/);
    assert.doesNotMatch(notice, /private|postgres:|password|guard@|script|secret/);
  }
});
