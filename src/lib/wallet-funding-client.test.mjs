import assert from 'node:assert/strict';
import test from 'node:test';
import { readAdministrativeSandboxOptions } from './wallet-funding-client.mjs';

const options = { walletKind: 'administrative', environment: 'sandbox', provider: 'meld', country: 'US',
  serviceProvider: 'TRANSAK', paymentMethods: ['CREDIT_DEBIT_CARD'] };

test('administrative methods never borrow personal provider options or invent an empty fallback', async () => {
  const original = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json({ ...options, paymentMethods: [] }); };
    const result = await readAdministrativeSandboxOptions('US', 'TRANSAK');
    assert.deepEqual(result.paymentMethods, []);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, '/api/member/wallet-funding/administrative/options?country=US&serviceProvider=TRANSAK');
    assert.equal(calls[0].init.credentials, 'same-origin');
    assert.equal(calls[0].init.cache, 'no-store');
    await assert.rejects(readAdministrativeSandboxOptions('US', 'TOPPER'), { message: 'invalid_request' });
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = original; }
});

test('a canceled old country/provider request cannot publish late methods into the new selection', async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  try {
    globalThis.fetch = async () => pending;
    const old = readAdministrativeSandboxOptions('US', 'TRANSAK', { signal: controller.signal });
    controller.abort();
    resolve(Response.json(options));
    await assert.rejects(old, { name: 'AbortError' });
    globalThis.fetch = async () => Response.json(options);
    await assert.rejects(readAdministrativeSandboxOptions('CO', 'BANXA'), { message: 'funding_unavailable' });
  } finally { globalThis.fetch = original; }
});
