import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PASSWORD_RECOVERY_NOTICE, passwordRecoveryEmail, passwordRecoveryErrors, passwordRecoveryRequest,
  passwordRecoveryAcknowledged, passwordRecoveryRetrySeconds, passwordRecoveryConfirmationRetrySeconds, passwordRecoveryFailure,
} from './password-recovery-model.mjs';

const input = { email: ' MEMBER@EXAMPLE.TEST ', otp: '001234', password: ' Raw password with spaces ', confirmPassword: ' Raw password with spaces ' };

test('the same private recovery contract creates or replaces a password without an account-existence probe', () => {
  assert.deepEqual(passwordRecoveryRequest('request', input), { path: '/api/auth/email-otp/request-password-reset', body: { email: 'member@example.test' } });
  assert.deepEqual(passwordRecoveryRequest('confirm', input), { path: '/api/auth/email-otp/reset-password', body: {
    email: 'member@example.test', otp: '001234', password: ' Raw password with spaces ',
  } });
  assert.deepEqual(passwordRecoveryErrors(input), {});
  assert.doesNotMatch(JSON.stringify(passwordRecoveryRequest('confirm', { ...input, hasPassword: false, role: 'admin', person_id: 1 })), /hasPassword|person_id|admin|confirmPassword/);
  assert.match(PASSWORD_RECOVERY_NOTICE, /Si el correo corresponde a una cuenta habilitada/);
  assert.doesNotMatch(PASSWORD_RECOVERY_NOTICE, /Te enviamos|cuenta existe|no existe/);
});

test('recovery validates bounded email, six ASCII digits and the exact 12–128-character password twice', () => {
  for (const email of ['', 'invalid', 'member @example.test', null, `${'a'.repeat(243)}@example.test`]) {
    assert.equal(passwordRecoveryEmail(email), '');
    assert.throws(() => passwordRecoveryRequest('request', { email }));
  }
  for (const otp of ['12345', '1234567', ' 123456', '123 56', '１２３４５６', 123456]) {
    assert.ok(passwordRecoveryErrors({ ...input, otp }).otp);
  }
  for (const password of ['', 'a'.repeat(11), 'a'.repeat(129), null]) {
    assert.ok(passwordRecoveryErrors({ ...input, password, confirmPassword: password }).password);
  }
  for (const length of [12, 128]) assert.deepEqual(passwordRecoveryErrors({ ...input, password: 'a'.repeat(length), confirmPassword: 'a'.repeat(length) }), {});
  assert.ok(passwordRecoveryErrors({ ...input, confirmPassword: input.password.trim() }).confirmPassword);
  assert.throws(() => passwordRecoveryRequest('sign-in', input));
});

test('only the exact endpoint acknowledgement is accepted; metadata and URL hints cannot prove recovery', () => {
  assert.equal(passwordRecoveryAcknowledged({ ok: true }), true);
  for (const value of [null, [], {}, { ok: false }, { ok: 'true' }, { success: true }, { ok: true, token: 'private' },
    { ok: true, user: {} }, { ok: true, emailVerified: true }, { ok: true, changed: '1' }, { ok: true, code: 'RESET' },
    Object.create({ ok: true })]) assert.equal(passwordRecoveryAcknowledged(value), false);
});

test('resend waits never shorten the five-minute minimum and obey a longer bounded Retry-After', () => {
  for (const [value, expected] of [[null, 300], ['0', 300], ['5', 300], ['901', 901], ['Infinity', 300], ['100000', 86400], ['bad', 300]]) {
    assert.equal(passwordRecoveryRetrySeconds(new Response(null, { headers: value === null ? {} : { 'retry-after': value } })), expected);
  }
  assert.equal(passwordRecoveryRetrySeconds(new Response(), { retryAfter: 450 }), 450);
});

test('recovery failures are neutral and never echo private provider diagnostics', () => {
  assert.match(passwordRecoveryFailure(429), /Espera/);
  assert.match(passwordRecoveryFailure(503), /Prueba iniciar sesión/);
  assert.match(passwordRecoveryFailure(400), /Revisa el código y los datos/);
  assert.doesNotMatch(passwordRecoveryFailure(403), /suspendid|existe|contraseña anterior/);
});

test('code redemption honors its own bounded Retry-After rather than borrowing the five-minute send budget', () => {
  for (const [value, expected] of [[null, 60], ['30', 30], ['0.5', 1], ['600', 600], ['100000', 86400],
    ['0', 60], ['-1', 60], ['Infinity', 60], ['invalid', 60]]) {
    assert.equal(passwordRecoveryConfirmationRetrySeconds(new Response(null, { headers: value === null ? {} : { 'retry-after': value } })), expected);
  }
  assert.equal(passwordRecoveryConfirmationRetrySeconds(new Response(), { retryAfterSec: 45 }), 45);
  assert.equal(passwordRecoveryConfirmationRetrySeconds(new Response(null, { headers: { 'retry-after': '90' } }), { retryAfter: 10 }), 90);
  const now = Date.UTC(2026, 10, 3);
  assert.equal(passwordRecoveryConfirmationRetrySeconds(new Response(null, { headers: { 'retry-after': new Date(now + 120000).toUTCString() } }), {}, now), 120);
});
