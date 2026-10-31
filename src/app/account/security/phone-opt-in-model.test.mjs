import assert from 'node:assert/strict';
import test from 'node:test';
import { SMS_CONSENT_VERSION, optInPhone, phoneOptInStatus, phoneOptInRequest, phoneOptInAcknowledged, phoneOptInFailure, phoneOptInRetrySeconds, requestPhoneOptIn } from './phone-opt-in-model.mjs';

const status = { available: true, consentVersion: SMS_CONSENT_VERSION, optedIn: false, phoneNumber: null, phoneNumberVerified: false };

test('SMS opt-in accepts explicit international numbers, never invented country prefixes or extensions', () => {
  assert.equal(optInPhone('+57 (300) 123-4567'), '+573001234567');
  for (const value of ['3001234567', '+003001234567', '+57300x1234567', '+573001234567 ext 2', '+573001234567\n', '+573001234567.5', null]) assert.equal(optInPhone(value), '');
});

test('phone status requires explicit capabilities and never converts unknown data to an enabled or verified state', () => {
  assert.deepEqual(phoneOptInStatus(status), status);
  assert.equal(phoneOptInStatus({ ...status, available: false }).available, false);
  for (const value of [{}, null, [], { ...status, available: 'true' }, { ...status, optedIn: 1 }, { ...status, phoneNumberVerified: true }, { ...status, consentVersion: 'other' }, { ...status, phoneNumber: '+57 300 123 4567' }]) assert.throws(() => phoneOptInStatus(value));
});

test('sending requires a separate explicit SMS-auth consent and never accepts a marketing or URL boolean', () => {
  const input = { phoneNumber: '+573001234567', consent: true, consentVersion: SMS_CONSENT_VERSION, role: 'admin', email: 'other@example.test', marketing: true };
  assert.deepEqual(phoneOptInRequest('send', input), { path: '/api/auth/phone-number/send-otp', method: 'POST', body: { phoneNumber: input.phoneNumber, consent: true, consentVersion: SMS_CONSENT_VERSION } });
  for (const consent of [undefined, false, 'true', 1]) assert.throws(() => phoneOptInRequest('send', { ...input, consent }));
  assert.throws(() => phoneOptInRequest('send', { ...input, consentVersion: 'other' }));
});

test('verification is bound to the requested number and cannot create a sign-in session', () => {
  assert.deepEqual(phoneOptInRequest('verify', { phoneNumber: '+573001234567', code: '123456', disableSession: false }), {
    path: '/api/auth/phone-number/verify', method: 'POST', body: { phoneNumber: '+573001234567', code: '123456', updatePhoneNumber: true, disableSession: true },
  });
  for (const code of [123456, '12345', '1234567', '12 3456', 'abcdef']) assert.throws(() => phoneOptInRequest('verify', { phoneNumber: '+573001234567', code }));
  assert.deepEqual(phoneOptInRequest('revoke'), { path: '/api/auth/phone-number/revoke-consent', method: 'POST', body: {} });
});

test('empty, loosely typed or mismatched acknowledgements cannot show successful SMS verification', () => {
  for (const action of ['send', 'verify', 'revoke']) for (const payload of [{}, null, [], { ok: 'true' }, { ok: true }, { error: 'internal' }]) assert.equal(phoneOptInAcknowledged(action, payload), false);
  assert.equal(phoneOptInAcknowledged('send', { ok: true, resendAfter: 60 }), true);
  assert.equal(phoneOptInAcknowledged('send', { ok: true, resendAfter: 1 }), false);
  assert.equal(phoneOptInAcknowledged('verify', { ok: true, phoneNumberVerified: true, optedIn: true }), true);
  assert.equal(phoneOptInAcknowledged('revoke', { ok: true, optedIn: false }), true);
});

test('SMS cooldown cannot shorten the server security window and errors do not echo internal diagnostics', () => {
  assert.equal(phoneOptInRetrySeconds(new Response(), { resendAfter: 1 }), 60);
  assert.equal(phoneOptInRetrySeconds(new Response(null, { headers: { 'Retry-After': '300' } })), 300);
  assert.ok(phoneOptInFailure(401).includes('correo verificado'));
  assert.ok(phoneOptInFailure(503).includes('correo no cambia'));
});

test('SMS transport stays same-origin, bounded, abortable and never retries mutations', async () => {
  let calls = 0;
  const result = await requestPhoneOptIn('send', { phoneNumber: '+573001234567', consent: true, consentVersion: SMS_CONSENT_VERSION }, { fetchImpl: async (path, options) => {
    calls += 1;
    assert.equal(path, '/api/auth/phone-number/send-otp');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return Response.json({ ok: true, resendAfter: 60 });
  } });
  assert.equal(calls, 1);
  assert.equal(phoneOptInAcknowledged('send', result.payload), true);
  for (const response of [new Response('not json'), Response.json(null), Response.json([]), Response.json({ value: 'a'.repeat(8193) })]) {
    await assert.rejects(requestPhoneOptIn('status', {}, { fetchImpl: async () => response }));
  }
});

test('an already aborted or later canceled body cannot leave the SMS UI awaiting a stream', async () => {
  for (const alreadyAborted of [true, false]) {
    const controller = new AbortController();
    if (alreadyAborted) controller.abort();
    let canceled = false;
    const stream = new ReadableStream({ cancel() { canceled = true; } });
    const result = requestPhoneOptIn('status', {}, { signal: controller.signal, fetchImpl: async () => new Response(stream) });
    if (!alreadyAborted) setTimeout(() => controller.abort(), 5);
    await assert.rejects(result, /aborted/);
    assert.equal(canceled, true);
  }
});
