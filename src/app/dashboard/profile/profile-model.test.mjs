import assert from 'node:assert/strict';
import test from 'node:test';
import { profileForm, requestProfile } from './profile-model.mjs';

const profile = { first_name: 'Persona', last_name: 'Prueba', phone: '+573001234567', country: 'Colombia', payout_wallet_usdc: '' };

test('an unavailable or malformed profile cannot become a blank editable form', async () => {
  assert.deepEqual(profileForm(profile), { name: 'Persona Prueba', phone: profile.phone, country: profile.country, payout_wallet_usdc: '' });
  for (const value of [{}, null, [], { ...profile, phone: null }]) assert.throws(() => profileForm(value));
  for (const response of [Response.json({}), Response.json(profile, { status: 503 }), new Response('invalid')]) {
    await assert.rejects(requestProfile('GET', undefined, { fetchImpl: async () => response }));
  }
});

test('saving requires an exact backend acknowledgement and adopts actual returned profile values', async () => {
  let calls = 0;
  const saved = await requestProfile('POST', { name: 'Cambio' }, { fetchImpl: async (path, options) => {
    calls += 1;
    assert.equal(path, '/api/member/profile');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), { name: 'Cambio' });
    return Response.json({ ok: true, profile });
  } });
  assert.equal(calls, 1);
  assert.equal(saved.phone, profile.phone);
  assert.equal(saved.name, 'Persona Prueba');
  for (const value of [{}, { ok: true }, { ok: 'true', profile }, { ok: true, profile: {} }, { error: 'private_diagnostic' }]) {
    await assert.rejects(requestProfile('POST', { name: 'Cambio' }, { fetchImpl: async () => Response.json(value) }));
  }
});
