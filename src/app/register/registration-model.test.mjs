import assert from 'node:assert/strict';
import test from 'node:test';
import { registrationEmail, registrationErrors, registrationHints, registrationRetrySeconds, registrationFailure, registrationLoginUrl, registrationAcknowledged, registrationUrl, registrationPendingDelivery, registrationRequired, registrationRedirect, consumeRegistrationPrefill } from './registration-model.mjs';

const valid = { fullName: 'Persona Prueba', email: ' test@example.test ', password: 'Synthetic Example 12', confirmPassword: 'Synthetic Example 12', acceptsPrivacy: true };

test('registration validates required identity, exact password and explicit consent', () => {
  assert.deepEqual(registrationErrors(valid), {});
  assert.equal(registrationEmail(valid.email), 'test@example.test');
  assert.equal(registrationEmail('bad@@example.test'), '');
  assert.equal(registrationEmail(`${'a'.repeat(250)}@example.test`), '');
  for (const password of ['short123', 'a'.repeat(129)]) assert.ok(registrationErrors({ ...valid, password, confirmPassword: password }).password);
  assert.ok(registrationErrors({ ...valid, fullName: ' ' }).fullName);
  assert.ok(registrationErrors({ ...valid, fullName: 'a'.repeat(121) }).fullName);
  assert.ok(registrationErrors({ ...valid, fullName: 'Persona\nPrueba' }).fullName);
  assert.ok(registrationErrors({ ...valid, acceptsPrivacy: 'true' }).acceptsPrivacy);
  assert.ok(registrationErrors({ ...valid, confirmPassword: `${valid.password} ` }).confirmPassword);
});

test('a successful HTTP response never verifies registration without the exact purpose-specific acknowledgement', () => {
  const signup = { ok: true, mode: 'better-auth', email: 'test@example.test', userConfirmed: false, requiresConfirmation: true };
  assert.equal(registrationAcknowledged('register', signup, valid.email), true);
  assert.equal(registrationAcknowledged('register', { ...signup, email: 'other@example.test' }, valid.email), false);
  assert.equal(registrationAcknowledged('register', { ...signup, userConfirmed: true }, valid.email), false);
  assert.equal(registrationAcknowledged('confirm', { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: true }), true);
  assert.equal(registrationAcknowledged('resend', { ok: true, mode: 'better-auth', resendAfter: 300 }), true);
  for (const action of ['register', 'confirm', 'resend']) for (const payload of [null, [], {}, { ok: true }, { ok: 'true', mode: 'better-auth' }]) assert.equal(registrationAcknowledged(action, payload, valid.email), false);
});

test('pending delivery recovery requires the exact 503 acknowledgement and the registration email, never HTTP success or a generic failure', () => {
  const pending = { code: 'EMAIL_DELIVERY_UNAVAILABLE', registrationPending: true, email: 'test@example.test', requiresConfirmation: true };
  assert.equal(registrationPendingDelivery(503, pending, valid.email), true);
  for (const status of [200, 201, 400, 429, 500, 502, 504]) assert.equal(registrationPendingDelivery(status, pending, valid.email), false);
  for (const body of [null, [], {}, { ...pending, email: 'other@example.test' }, { ...pending, email: undefined },
    { ...pending, registrationPending: 'true' }, { ...pending, requiresConfirmation: false }, { ...pending, code: 'AUTH_EMAIL_DELIVERY_UNAVAILABLE' }]) {
    assert.equal(registrationPendingDelivery(503, body, valid.email), false);
  }
  assert.equal(registrationPendingDelivery(503, pending, 'invalid'), false);
  assert.equal(registrationAcknowledged('register', pending, valid.email), false);
  assert.equal(registrationAcknowledged('confirm', pending), false);
});

test('URL prefills are bounded hints only and never provide password, consent or identity binding', () => {
  assert.deepEqual(registrationHints('?email=TEST%40EXAMPLE.TEST&ref=person&side=r&resume=1&role=admin&password=bad&acceptsPrivacy=true'), {
    email: 'test@example.test', referralCode: 'person', preferredSide: 'R', resume: true,
  });
  assert.equal(registrationHints('?side=L').preferredSide, '');
  assert.equal(registrationHints(`?ref=${'a'.repeat(80)}&side=admin`).referralCode.length, 64);
  assert.equal(registrationHints('?ref=ref&side=admin').preferredSide, '');
});

test('OTP resend cooldown cannot be shortened below the 300-second security budget', () => {
  for (const value of [undefined, 'invalid', '0', '-1', '45']) {
    assert.equal(registrationRetrySeconds(new Response(null, { headers: value ? { 'retry-after': value } : {} })), 300);
  }
  assert.equal(registrationRetrySeconds(new Response(null, { headers: { 'retry-after': '600' } })), 600);
  assert.equal(registrationRetrySeconds(new Response(), { retryAfterSec: 480 }), 480);
});

test('verification never implies network onboarding or session, and safe errors never echo provider details', () => {
  const href = registrationLoginUrl(' TEST@EXAMPLE.TEST ', 'ref?role=admin', 'R');
  assert.equal(new URL(href, 'https://example.test').pathname, '/login');
  assert.equal(new URL(href, 'https://example.test').searchParams.get('mode'), 'code');
  assert.equal(new URL(href, 'https://example.test').searchParams.get('email'), 'test@example.test');
  assert.equal(new URL(href, 'https://example.test').searchParams.get('ref'), 'ref?role=admin');
  assert.equal(new URL(href, 'https://example.test').searchParams.get('side'), 'R');
  assert.ok(!href.includes('/onboarding'));
  assert.ok(registrationFailure(503).includes('no está disponible'));
  assert.ok(registrationFailure(400, 'confirm', 'internal_secret').includes('código'));
  assert.ok(!registrationFailure(400, 'register', 'internal_secret').includes('internal_secret'));
});

test('registration links preserve bounded email, referral and binary-side hints without accepting redirects or privileges', () => {
  const href = registrationUrl(' MEMBER@EXAMPLE.TEST ', 'MP-REFERRED', 'R', true);
  assert.equal(href, '/register?email=member%40example.test&ref=MP-REFERRED&side=R&resume=1');
  assert.equal(registrationUrl('bad', '', 'L'), '/register');
  assert.equal(registrationUrl('', 'bad ref', 'R'), '/register');
  const malicious = new URL(registrationUrl('', 'ref?role=admin', 'L'), 'https://example.test');
  assert.equal(malicious.pathname, '/register');
  assert.equal(malicious.searchParams.get('role'), null);
  assert.equal(malicious.searchParams.get('ref'), 'ref?role=admin');
});

test('only the explicit missing-account contract requests registration, never permissions, throttling or an outage', () => {
  assert.equal(registrationRequired(400, { error: 'authentication_failed', code: 'REGISTRATION_REQUIRED' }), true);
  for (const status of [200, 201, 401, 403, 404, 409, 429, 500, 502, 503, 504]) {
    assert.equal(registrationRequired(status, { code: 'REGISTRATION_REQUIRED' }), false);
  }
  for (const payload of [null, [], {}, { needsRegister: true }, { code: 'USER_NOT_FOUND' },
    { code: 'INVALID_EMAIL_OR_PASSWORD' }, { code: 'REGISTRATION_REQUIRED', ok: true }]) {
    assert.equal(registrationRequired(400, payload), false);
  }
});

function temporaryBrowser() {
  const data = new Map();
  return { data, sessionStorage: { getItem: key => data.get(key) ?? null,
    removeItem: key => data.delete(key), setItem: (key, value) => data.set(key, value) } };
}

test('missing-account continuation keeps email out of URLs and stores only a five-minute one-shot hint', () => {
  const browser = temporaryBrowser(), now = 1800000000000;
  const href = registrationRedirect(' MEMBER@EXAMPLE.TEST ', 'MP-REFERRED', 'R', browser, now);
  assert.equal(href, '/register?ref=MP-REFERRED&side=R&reason=registration-required');
  assert.equal(new URL(href, 'https://example.test').searchParams.get('email'), null);
  assert.equal(new URL(href, 'https://example.test').searchParams.get('resume'), null);
  assert.deepEqual(JSON.parse([...browser.data.values()][0]), { email: 'member@example.test', createdAt: now });
  assert.equal(consumeRegistrationPrefill(browser, now + 299999), 'member@example.test');
  assert.equal(browser.data.size, 0);
  assert.equal(consumeRegistrationPrefill(browser, now + 299999), '');
});

test('expired, future-dated, invalid and oversized hints are erased without becoming registration authority', () => {
  const browser = temporaryBrowser(), now = 1800000000000;
  for (const age of [300001, -1]) {
    registrationRedirect('member@example.test', '', '', browser, now - age);
    assert.equal(consumeRegistrationPrefill(browser, now), '');
    assert.equal(browser.data.size, 0);
  }
  for (const raw of ['not-json', 'null', '[]', JSON.stringify({ email: 'invalid', createdAt: now }),
    JSON.stringify({ email: 'member@example.test', createdAt: String(now) }), 'a'.repeat(1025)]) {
    browser.data.set('mindbliss.registration-prefill.v1', raw);
    assert.equal(consumeRegistrationPrefill(browser, now), '');
    assert.equal(browser.data.size, 0);
  }
});

test('blocked browser storage still navigates to a fixed registration path without email or privilege hints', () => {
  const browser = { get sessionStorage() { throw new Error('synthetic storage denial'); } };
  const destination = registrationRedirect('member@example.test', 'ref?role=admin&next=https://attacker.test', 'L', browser);
  const url = new URL(destination, 'https://example.test');
  assert.equal(url.pathname, '/register');
  assert.equal(url.searchParams.get('email'), null);
  assert.equal(url.searchParams.get('role'), null);
  assert.equal(url.searchParams.get('next'), null);
  assert.equal(url.searchParams.get('side'), 'L');
  assert.equal(consumeRegistrationPrefill(browser), '');
  assert.equal(registrationRedirect('invalid', 'invalid ref', 'R'), '/register?reason=registration-required');
});
