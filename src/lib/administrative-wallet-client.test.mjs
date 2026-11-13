import assert from 'node:assert/strict';
import test from 'node:test';
import { readAdministrativeWallet, ensureAdministrativeWallet } from './administrative-wallet.mjs';

test('administrative wallet lookup never creates a personal wallet or automatically ensures/retries', async t => {
  const fetchImpl = globalThis.fetch; t.after(() => { globalThis.fetch = fetchImpl; });
  const calls = [];
  globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json({ status: 'pending', addressFamily: 'EVM', asset: 'USDT' }); };
  assert.equal((await readAdministrativeWallet()).status, 'pending'); assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/member/administrative-wallet'); assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.credentials, 'same-origin'); assert.equal(calls[0].init.cache, 'no-store'); assert.equal(calls[0].init.redirect, 'error');
  assert.ok(calls[0].init.signal instanceof AbortSignal);
  await ensureAdministrativeWallet(); assert.equal(calls.length, 2); assert.equal(calls[1].init.method, 'POST'); assert.equal(calls[1].init.body, '{}');
  globalThis.fetch = async () => { calls.push({}); return Response.json({ error: 'administrative_wallet_unavailable' }, { status: 503 }); };
  await assert.rejects(readAdministrativeWallet(), { message: 'administrative_wallet_unavailable' }); assert.equal(calls.length, 3);
});

test('assigned administrative destinations require their complete EVM contract and honor cancellation', async t => {
  const fetchImpl = globalThis.fetch; t.after(() => { globalThis.fetch = fetchImpl; });
  const assigned = { status: 'assigned', addressFamily: 'EVM', asset: 'USDT', address: `0x${'a'.repeat(40)}`, checkoutReference: '11111111-1111-4111-8111-111111111111', assignedAt: '2026-11-12T00:00:00Z' };
  globalThis.fetch = async () => Response.json(assigned); assert.deepEqual(await readAdministrativeWallet(), assigned);
  for (const invalid of [{ ...assigned, address: 'invalid' }, { ...assigned, checkoutReference: '' }, { ...assigned, asset: 'ETH' }, { ...assigned, assignedAt: 'invalid' }, { ...assigned, status: 'pending' }]) {
    globalThis.fetch = async () => Response.json(invalid); await assert.rejects(readAdministrativeWallet(), { message: 'administrative_wallet_unavailable' });
  }
  const controller = new AbortController(); let transportSignal;
  globalThis.fetch = async (_url, init) => { transportSignal = init.signal; return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })); };
  const request = readAdministrativeWallet({ signal: controller.signal }); controller.abort();
  await assert.rejects(request, { name: 'AbortError' }); assert.equal(transportSignal.aborted, true);
});
