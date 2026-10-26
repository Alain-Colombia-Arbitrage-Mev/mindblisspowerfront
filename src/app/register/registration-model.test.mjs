import assert from 'node:assert/strict';
import test from 'node:test';
import { registrationEmail, registrationErrors, registrationHints, registrationRetrySeconds, registrationFailure, registrationLoginUrl } from './registration-model.mjs';

const valid = { fullName: 'Persona Prueba', email: ' test@example.test ', password: 'Synthetic Example 12', confirmPassword: 'Synthetic Example 12', acceptsPrivacy: true };

test('registration validates required identity, exact password and explicit consent', () => {
  assert.deepEqual(registrationErrors(valid), {});
  assert.equal(registrationEmail(valid.email), 'test@example.test');
  assert.equal(registrationEmail('bad@@example.test'), '');
  assert.equal(registrationEmail(`${'a'.repeat(250)}@example.test`), '');
  for (const password of ['short123', 'a'.repeat(129)]) assert.ok(registrationErrors({ ...valid, password, confirmPassword: password }).password);
  assert.ok(registrationErrors({ ...valid, fullName: ' ' }).fullName);
  assert.ok(registrationErrors({ ...valid, fullName: 'a'.repeat(121) }).fullName);
  assert.ok(registrationErrors({ ...valid, acceptsPrivacy: 'true' }).acceptsPrivacy);
  assert.ok(registrationErrors({ ...valid, confirmPassword: `${valid.password} ` }).confirmPassword);
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
  assert.equal(new URL(href, 'https://example.test').searchParams.get('mode'), 'password');
  assert.equal(new URL(href, 'https://example.test').searchParams.get('ref'), 'ref?role=admin');
  assert.ok(!href.includes('/onboarding'));
  assert.ok(registrationFailure(503).includes('no está disponible'));
  assert.ok(registrationFailure(400, 'confirm', 'internal_secret').includes('código'));
  assert.ok(!registrationFailure(400, 'register', 'internal_secret').includes('internal_secret'));
});
