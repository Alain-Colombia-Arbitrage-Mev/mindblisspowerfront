import assert from 'node:assert/strict';
import test from 'node:test';
import { otpRequest, otpFailureMessage, otpTimeoutMs, OTP_SEND_NOTICE } from './email-otp-client.mjs';

test('Better Auth uses only the same-origin sign-in OTP contract', () => {
  assert.deepEqual(otpRequest('better-auth', 'send', ' Member+1@Example.test '), {
    path: '/api/auth/email-otp/send-verification-otp', body: { email: 'member+1@example.test', type: 'sign-in' },
  });
  assert.deepEqual(otpRequest('better-auth', 'confirm', 'member@example.test', '00 12-34'), {
    path: '/api/auth/sign-in/email-otp', body: { email: 'member@example.test', otp: '001234' },
  });
});

test('OTP validation rejects untrusted providers, malformed emails and non-six-digit codes', () => {
  for (const provider of ['disabled', 'https://evil.example.test', '', undefined]) {
    assert.throws(() => otpRequest(provider, 'send', 'member@example.test'));
  }
  for (const email of ['', 'a@b', 'member @example.test', `${'a'.repeat(255)}@example.test`]) {
    assert.throws(() => otpRequest('better-auth', 'send', email));
  }
  for (const otp of ['', '12345', '1234567', 'abc123']) {
    assert.throws(() => otpRequest('better-auth', 'confirm', 'member@example.test', otp));
  }
  assert.throws(() => otpRequest('better-auth', 'sign-up', 'member@example.test'));
});

test('legacy Cognito contract remains separate and bounded errors do not expose accounts', () => {
  assert.equal(otpRequest('cognito', 'send', 'member@example.test').path, '/api/auth/cognito/code-login/request');
  assert.deepEqual(otpRequest('cognito', 'confirm', 'member@example.test', '00123456').body, { email: 'member@example.test', code: '00123456' });
  assert.match(OTP_SEND_NOTICE, /Si tu cuenta está habilitada/);
  assert.match(otpFailureMessage(429, 'send'), /Demasiados/);
  assert.match(otpFailureMessage(503, 'confirm'), /no está disponible/);
  assert.match(otpFailureMessage(401, 'confirm'), /inválido o expirado/);
});

test('single email delivery attempt waits 30 seconds while received-code confirmation stays at 12 seconds', () => {
  assert.equal(otpTimeoutMs('send'), 30000);
  assert.equal(otpTimeoutMs('confirm'), 12000);
  for (const action of ['', undefined, 'reset', 'https://evil.example.test']) assert.throws(() => otpTimeoutMs(action));
});
