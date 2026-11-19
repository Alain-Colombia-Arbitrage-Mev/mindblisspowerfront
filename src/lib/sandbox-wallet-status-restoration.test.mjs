import assert from 'node:assert/strict';
import test from 'node:test';
import { sandboxWalletStatus } from './sandbox-wallet-contract.mjs';
import { readSandboxWalletStatus, verifySandboxWallet } from './sandbox-wallet-client.mjs';
import { sandboxSubject as ownerSubject, sandboxAddress as address,
  sandboxOtherAddress as otherAddress, sandboxReference as challengeId,
  sandboxSignature as signature, sandboxCapability as capability } from './sandbox-wallet-test-fixtures.mjs';

const now = Date.parse('2026-11-19T12:00:00.000Z');
const linked = { ...capability, status: 'linked', verified: false, address };
const verified = { ...linked, verified: true, expiresAt: '2026-11-19T12:00:01.000Z' };

test('the persisted linked address survives a reload without an active signing grant', () => {
  assert.deepEqual(sandboxWalletStatus(linked, now), linked);
  const mixedAddress = `0x${'aBcDeF12'.repeat(5)}`;
  assert.deepEqual(sandboxWalletStatus({ ...linked, address: mixedAddress }, now), { ...linked, address: mixedAddress.toLowerCase() });
  const unlinked = { ...capability, status: 'unlinked', verified: false };
  assert.deepEqual(sandboxWalletStatus(unlinked, now), unlinked);
  assert.equal(sandboxWalletStatus({ ...unlinked, address }, now), null);
});

test('a well-formed grant expiring in transit retains only the permanent link and never extends its lease', () => {
  assert.deepEqual(sandboxWalletStatus(verified, now), verified);
  assert.deepEqual(sandboxWalletStatus(verified, now + 1_000), linked);
  assert.deepEqual(sandboxWalletStatus(verified, now + 86_400_000), linked);
  assert.equal(sandboxWalletStatus(verified, now + 1_000).expiresAt, undefined);
  assert.equal(verified.verified, true);
  assert.equal(verified.expiresAt, '2026-11-19T12:00:01.000Z');
});

test('restoration never downgrades malformed expiry, address or grant metadata into a trusted link', () => {
  for (const expiresAt of [undefined, null, '', 0, 'yesterday', '2026-99-19T12:00:01.000Z', '2026-11-19T12:00:01Z']) {
    assert.equal(sandboxWalletStatus({ ...verified, expiresAt }, now + 86_400_000), null);
  }
  for (const invalidAddress of ['', '0x1234', `0x${'0'.repeat(40)}`, `${address} `, null]) {
    assert.equal(sandboxWalletStatus({ ...verified, address: invalidAddress }, now + 86_400_000), null);
  }
  assert.equal(sandboxWalletStatus({ ...linked, expiresAt: verified.expiresAt }, now), null);
  assert.equal(sandboxWalletStatus({ ...linked, verified: 'false' }, now), null);
  assert.equal(sandboxWalletStatus({ ...verified, chainId: 1 }, now + 86_400_000), null);
  assert.equal(sandboxWalletStatus({ ...verified, environment: 'production' }, now + 86_400_000), null);
});

test('a status GET restores an expired-in-transit owned link without selecting an owner or requesting a new proof', async t => {
  t.mock.method(Date, 'now', () => now + 1_000);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    calls.push({ path, init });
    return Response.json({ ...verified, subject: 'untrusted-response-selector', nativeSessionId: 'not-a-browser-authority' });
  });
  const restored = await readSandboxWalletStatus({ ownerSubject });
  assert.deepEqual(restored, linked);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/member/sandbox-wallet/status');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.body, undefined);
  assert.equal(calls[0].init.headers['x-mindbliss-sandbox-subject'], encodeURIComponent(ownerSubject));
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal(restored.subject, undefined);
  assert.equal(restored.nativeSessionId, undefined);
  assert.equal(restored.expiresAt, undefined);
  await assert.rejects(readSandboxWalletStatus(), /unauthenticated/);
  assert.equal(calls.length, 1);
});

test('an expired verification response does not claim a fresh proof or automatically retry signing', async t => {
  t.mock.method(Date, 'now', () => now + 1_000);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    calls.push({ path, init });
    return Response.json(verified);
  });
  await assert.rejects(verifySandboxWallet({ challengeId, signature }, address, { ownerSubject }), /sandbox_wallet_unavailable/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/member/sandbox-wallet/verify');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), { challengeId, signature });
  assert.equal(calls[0].init.headers['x-mindbliss-sandbox-subject'], encodeURIComponent(ownerSubject));
});

test('fresh verification still requires the expected address and an unexpired grant', async t => {
  t.mock.method(Date, 'now', () => now);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(verified); });
  assert.deepEqual(await verifySandboxWallet({ challengeId, signature }, address, { ownerSubject }), verified);
  await assert.rejects(verifySandboxWallet({ challengeId, signature }, otherAddress, { ownerSubject }), /sandbox_wallet_unavailable/);
  assert.equal(calls, 2);
});
