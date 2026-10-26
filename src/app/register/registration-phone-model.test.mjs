import assert from 'node:assert/strict';
import test from 'node:test';
import { REGISTRATION_PHONE_CONSENT, registrationPhone, registrationPhoneRequest, registrationPhoneAcknowledged,
  registrationPhoneRetrySeconds, requestRegistrationPhone } from './registration-phone-model.mjs';

const contact = { email: 'member@example.test', phoneNumber: '+573001234567' };
const send = { ...contact, consent: true, consentVersion: REGISTRATION_PHONE_CONSENT };
const flowId = 'synthetic-registration-flow-001';

test('registration SMS requires explicit scoped consent and never accepts invented prefixes or sign-in actions', () => {
  assert.equal(registrationPhone(' +57 (300) 123-4567 '), contact.phoneNumber);
  for (const value of ['3001234567', '+003001234567', '+573001234567 ext 2', '+57.3001234567', 'a'.repeat(50)]) assert.equal(registrationPhone(value), '');
  assert.deepEqual(registrationPhoneRequest('send', { ...send, email: ' MEMBER@EXAMPLE.TEST ', role: 'admin', phoneNumberVerified: true }), {
    path: '/api/auth/register/phone/send', body: send,
  });
  for (const input of [{ ...send, consent: 'true' }, { ...send, consentVersion: 'sms-auth-v1' }, { ...send, email: 'bad' }]) assert.throws(() => registrationPhoneRequest('send', input));
  assert.throws(() => registrationPhoneRequest('sign-in', send));
  assert.deepEqual(registrationPhoneRequest('verify', { ...contact, flowId, code: '001234', personId: 'untrusted', proof: 'never-forward' }), {
    path: '/api/auth/register/phone/verify', body: { ...contact, flowId, code: '001234' },
  });
});

test('only exact registration-purpose, contact-bound acknowledgements advance the phone flow', () => {
  const sent = { ok: true, flowId, resendAfter: 60, expiresIn: 300 };
  assert.equal(registrationPhoneAcknowledged('send', sent), true);
  for (const change of [{ ok: 'true' }, { flowId: '' }, { flowId: '../untrusted' }, { resendAfter: 59 }, { expiresIn: 600 }, { error: 'failed' }]) {
    assert.equal(registrationPhoneAcknowledged('send', { ...sent, ...change }), false);
  }
  const verified = { ok: true, verified: true, purpose: 'registration', ...contact };
  assert.equal(registrationPhoneAcknowledged('verify', verified, contact), true);
  for (const change of [{ verified: 'true' }, { purpose: 'sign-in' }, { phoneNumber: '+573009999999' }, { email: 'other@example.test' }, { code: 'PRIVATE_ERROR' }]) {
    assert.equal(registrationPhoneAcknowledged('verify', { ...verified, ...change }, contact), false);
  }
  for (const payload of [{}, null, [], { ok: true }]) assert.equal(registrationPhoneAcknowledged('verify', payload, contact), false);
});

test('SMS cooldown is distinct from email and cannot shorten the server minimum', () => {
  for (const value of ['1', 'invalid', '0']) assert.equal(registrationPhoneRetrySeconds(new Response(null, { headers: { 'retry-after': value } })), 60);
  assert.equal(registrationPhoneRetrySeconds(new Response(null, { headers: { 'retry-after': '180' } })), 180);
  assert.equal(registrationPhoneRetrySeconds(new Response(), { resendAfter: 90 }), 90);
});

test('registration SMS transport is bounded, same-origin, cancellable and never retries messages', async () => {
  let calls = 0;
  await requestRegistrationPhone('send', send, { fetchImpl: async (path, options) => {
    calls++; assert.equal(path, '/api/auth/register/phone/send');
    assert.equal(options.credentials, 'same-origin'); assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), send); assert.ok(options.signal);
    return Response.json({ ok: true, flowId, resendAfter: 60, expiresIn: 300 });
  } });
  assert.equal(calls, 1);
  await assert.rejects(requestRegistrationPhone('send', send, { fetchImpl: async () => new Response('x'.repeat(8193)) }));
  await assert.rejects(requestRegistrationPhone('send', send, { fetchImpl: async () => Response.json([]) }));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(requestRegistrationPhone('send', send, { signal: controller.signal, fetchImpl: () => assert.fail('aborted send contacted transport') }), { name: 'AbortError' });
  let cancelled = false;
  const later = new AbortController();
  const stalled = requestRegistrationPhone('send', send, { signal: later.signal, fetchImpl: async () => new Response(new ReadableStream({ cancel() { cancelled = true; } })) });
  await new Promise(resolve => setImmediate(resolve)); later.abort();
  await assert.rejects(stalled, { name: 'AbortError' }); assert.equal(cancelled, true);
});
