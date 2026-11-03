import assert from 'node:assert/strict';
import test from 'node:test';
import { otpRequest, otpFailureMessage, otpTimeoutMs, OTP_SEND_NOTICE, OTP_SEND_UNCONFIRMED_NOTICE } from './email-otp-client.mjs';

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

test('OTP send guidance stays neutral, private and manual without promising delivery or importing daily recovery quotas', () => {
  assert.match(OTP_SEND_NOTICE, /^Si tu cuenta está habilitada, busca el código de acceso/);
  assert.match(OTP_SEND_UNCONFIRMED_NOTICE, /^No pudimos confirmar el envío/);
  assert.match(OTP_SEND_UNCONFIRMED_NOTICE, /No enviaremos otro automáticamente/);
  for (const notice of [OTP_SEND_NOTICE, OTP_SEND_UNCONFIRMED_NOTICE]) {
    assert.match(notice, /spam/);
    assert.match(notice, /espera.*contador/i);
    assert.match(notice, /no lo compartas/i);
    assert.doesNotMatch(notice, /recibirás|Te enviamos|correo verificado|cuenta existe|te quedan|24 horas|5 solicitudes|10 intentos/);
  }
});

test('login limit messages require manual waiting without fabricated times or remaining attempts', () => {
  const limited = otpFailureMessage(429, 'confirm');
  assert.match(limited, /Espera antes de volver a intentarlo/);
  assert.match(limited, /Si aparece un contador, deja que termine/);
  for (const status of [400, 401, 403, 429, 503]) {
    assert.doesNotMatch(otpFailureMessage(status, 'confirm'), /te quedan|intentos restantes|24 horas|5 solicitudes|10 intentos|correo verificado|cuenta bloqueada/);
  }
  assert.match(otpFailureMessage(400, 'confirm'), /código de acceso más reciente/);
});
