import assert from 'node:assert/strict';
import test from 'node:test';
import { profileForm, profileOwnerKey, normalizeProfilePhone, requestProfile } from './profile-model.mjs';

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
  const saved = await requestProfile('POST', { name: 'Persona Prueba' }, { fetchImpl: async (path, options) => {
    calls += 1;
    assert.equal(path, '/api/member/profile');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), { name: 'Persona Prueba' });
    return Response.json({ ok: true, profile });
  } });
  assert.equal(calls, 1);
  assert.equal(saved.phone, profile.phone);
  assert.equal(saved.name, 'Persona Prueba');
  for (const value of [{}, { ok: true }, { ok: 'true', profile }, { ok: true, profile: {} }, { error: 'private_diagnostic' }]) {
    await assert.rejects(requestProfile('POST', { name: 'Cambio' }, { fetchImpl: async () => Response.json(value) }));
  }
});

test('a typed but mismatched saved name or phone never confirms a successful profile update', async () => {
  for (const body of [{ name: 'Nombre Correcto' }, { phone: '+525551234567' }, { country: 'MX' }]) {
    let calls = 0;
    await assert.rejects(requestProfile('POST', body, { fetchImpl: async () => { calls++; return Response.json({ ok: true, profile }); } }), /profile_outcome_unconfirmed/);
    assert.equal(calls, 1, 'an ambiguous save is never repeated');
  }
});

test('profile phone formatting keeps the entered international prefix and never guesses a country', () => {
  assert.equal(normalizeProfilePhone('+52 (555) 123-4567'), '+525551234567');
  assert.equal(normalizeProfilePhone('+57 300 123 4567'), '+573001234567');
  for (const value of ['5551234567', '00525551234567', '+52abc', '+52 555 / 1234567', 5551234567]) assert.equal(normalizeProfilePhone(value), '');
});

test('profile view scope changes with native owner even when the email is reused and never trusts an empty session', () => {
  const first = profileOwnerKey({ subject: 'first', email: 'same@example.test' });
  assert.notEqual(first, profileOwnerKey({ subject: 'second', email: 'same@example.test' }));
  assert.notEqual(first, profileOwnerKey({ subject: 'first', email: 'other@example.test' }));
  assert.equal(profileOwnerKey(null), ''); assert.equal(profileOwnerKey({ subject: 'first' }), '');
  assert.equal(profileOwnerKey({ email: 'same@example.test' }), '');
});

test('native profile reads and saves include a view subject fence while legacy requests omit it', async () => {
  const calls = [], fetchImpl = async (_path, init) => { calls.push(init); return Response.json(init.method === 'POST' ? { ok: true, profile } : profile); };
  for (const method of ['GET', 'POST']) await requestProfile(method, method === 'POST' ? { name: 'Persona Prueba' } : undefined, { fetchImpl, subject: 'owner:one' });
  assert.ok(calls.every(init => new Headers(init.headers).get('x-mindbliss-profile-subject') === 'owner%3Aone'));
  await requestProfile('GET', undefined, { fetchImpl }); assert.equal(new Headers(calls[2].headers).get('x-mindbliss-profile-subject'), null);
  await assert.rejects(requestProfile('GET', undefined, { fetchImpl, subject: '' }), /profile_owner_required/); assert.equal(calls.length, 3);
  let attempts = 0;
  await assert.rejects(requestProfile('POST', { name: 'Persona Prueba' }, { subject: 'old-owner', fetchImpl: async () => { attempts++; return Response.json({ error: 'member_profile_owner_changed' }, { status: 409 }); } }), /member_profile_owner_changed/);
  assert.equal(attempts, 1);
});
