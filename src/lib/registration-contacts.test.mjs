import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, createHash } from 'node:crypto';
import { registrationContact } from './registration-contacts.mjs';
import { handleRegistration } from './registration-auth.mjs';
import { proxyBetterAuth } from './better-auth-bridge.mjs';

const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-proxy-signature-secret-longer-than-32',
  BETTER_AUTH_REGISTRATION_SMS_REQUIRED: 'true', SENTDM_API_KEY: 'synthetic-stale-key' };
const form = { fullName: 'Synthetic Contact', email: 'contact@example.test', password: 'synthetic password 123', acceptsPrivacy: true };
const request = (body, cookie = '') => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/register`, {
  method: 'POST', headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'cf-connecting-ip': '192.0.2.10', 'content-type': 'application/json', cookie }, body: JSON.stringify(body),
});

test('contacts are optional canonical possible E164 numbers, not authentication proof', () => {
  for (const value of [undefined, '']) assert.equal(registrationContact(value), '');
  for (const value of ['+573001234567', '+390212345678', '+6838888', '+12025550123']) assert.equal(registrationContact(value), value);
  for (const value of [null, true, 573001234567, '+57 3001234567', '3001234567', 'tel:+573001234567', '+573001234567 ext 4',
    'https://wa.me/573001234567', ' +573001234567', '+00012345', '+123', '+573001234567999999', {}, []]) {
    assert.throws(() => registrationContact(value), /invalid_contact_number/);
  }
});

test('bad contact input fails before any upstream email, signup or provider request', async () => {
  for (const field of ['contactPhone', 'contactWhatsapp']) for (const value of [null, {}, '3001234567', '+57 3001234567', '+123']) {
    const response = await handleRegistration(request({ ...form, [field]: value }), 'register', { env, fetchImpl() { assert.fail('invalid contact reached auth'); } });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).field, field);
  }
});

test('email-only signup saves only declared contacts through signed transport; stale SMS flags and proof cookies do nothing', async () => {
  for (const contacts of [{}, { contactPhone: '+573001234567' }, { contactWhatsapp: '+390212345678' },
    { contactPhone: '+6838888', contactWhatsapp: '+6838888' }]) {
    let calls = 0;
    const response = await handleRegistration(request({ ...form, ...contacts, phoneNumberVerified: true, whatsappVerified: true,
      smsConsent: true, role: 'super_admin', personId: 'not-authority' }, '__Secure-vp_registration_phone=stale; vp_registration_phone_expected=+12025550123'),
    'register', { env, fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, `${env.BETTER_AUTH_BACKEND_URL}/api/auth/sign-up/email`);
      assert.deepEqual(JSON.parse(options.body), { name: form.fullName, email: form.email, password: form.password, ...contacts });
      assert.equal(options.headers.cookie, '');
      const hash = value => createHash('sha256').update(value).digest('hex');
      assert.equal(options.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
        .update(['POST', '/api/auth/sign-up/email', options.headers['x-vp-auth-timestamp'], '192.0.2.10', hash(''), hash(options.body)].join('\n')).digest('hex'));
      return Response.json({ token: null, user: { id: 'synthetic', email: form.email, emailVerified: false,
        contactPhone: '+573001234567', contactWhatsapp: '+390212345678' } });
    } });
    assert.equal(calls, 1);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const payload = await response.json();
    assert.equal(payload.requiresConfirmation, true);
    assert.equal(payload.delivery.DeliveryMedium, 'EMAIL');
    assert.doesNotMatch(JSON.stringify(payload), /contactPhone|contactWhatsapp|57300|39021|verified|super_admin|smsConsent/);
  }
});

test('removed phone endpoints never proxy to a messaging provider or create a session', async () => {
  for (const path of ['register/phone/send', 'register/phone/verify', 'registration/phone/send', 'registration/phone/verify', 'sign-in/phone-number']) {
    const response = await proxyBetterAuth(request({}), path, { env, fetchImpl() { assert.fail('removed SMS route reached auth'); } });
    assert.equal(response.status, 404);
  }
});
