import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { walletReownConfiguration, walletReownMetadata, WALLET_REOWN_ORIGIN } from './wallet-reown-config.mjs';
import { createWalletReownBoundary, guardWalletReownProvider, walletReownAddress, walletReownChainId,
  walletReownOwnerKey, walletReownOwnerFingerprint, readWalletReownOwner, rememberWalletReownOwner, forgetWalletReownOwner } from './wallet-reown-connection.mjs';

const address = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`, project = 'a'.repeat(32);
const a = { subject: 'synthetic-a', email: 'member@example.test' }, b = { ...a, subject: 'synthetic-b' };
test('wallet metadata and configuration have no production project or other portal fallback', () => {
  for (const value of ['', null, 'invalid', 'a'.repeat(33)]) assert.equal(walletReownConfiguration(value, WALLET_REOWN_ORIGIN), null);
  for (const origin of ['https://app.mindblisspower.com', 'https://mindblisspower.com', `${WALLET_REOWN_ORIGIN}/path`, `${WALLET_REOWN_ORIGIN}/`, 'https://wallet.mindblisspower.com.attacker.test']) {
    assert.equal(walletReownConfiguration(project, origin), null);
  }
  assert.equal(walletReownMetadata('http://localhost:3000'), null);
  assert.equal(walletReownMetadata('http://localhost:3000', { allowLocal: true }).url, 'http://localhost:3000');
  const config = walletReownConfiguration(project, WALLET_REOWN_ORIGIN);
  assert.equal(config.projectId, project); assert.equal(config.themeMode, 'light');
  for (const feature of ['onramp', 'swaps', 'send', 'receive', 'history', 'pay', 'reownAuthentication']) assert.equal(config.features[feature], false);
  assert.equal(config.features.email, true); assert.deepEqual(config.features.socials, ['google', 'apple']);
  const source = readFileSync(new URL('../components/reown/WalletReownProvider.jsx', import.meta.url), 'utf8');
  assert.match(source, /NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_REOWN_PROJECT_ID|personal-wallet|wallet-binding|SolanaAdapter|mainnet|startOnramp|createPersonalFunding/);
  assert.match(source, /networks: \[polygon\]/);
});

test('owner markers contain only SHA256 and cannot merge two subjects with the same email', async () => {
  assert.equal(walletReownOwnerKey({ email: a.email }), '');
  const first = await walletReownOwnerFingerprint(walletReownOwnerKey(a)), second = await walletReownOwnerFingerprint(walletReownOwnerKey(b));
  assert.match(first, /^[0-9a-f]{64}$/); assert.notEqual(first, second);
  const values = new Map(), browser = { sessionStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  assert.equal(rememberWalletReownOwner(first, browser), true); assert.equal(readWalletReownOwner(browser), first);
  assert.doesNotMatch(JSON.stringify([...values]), /@|synthetic|token|cookie/);
  assert.equal(rememberWalletReownOwner('forged', browser), false);
  forgetWalletReownOwner(browser); assert.equal(readWalletReownOwner(browser), '');
  const denied = { get sessionStorage() { throw Error('synthetic store denied'); } };
  assert.equal(readWalletReownOwner(denied), ''); assert.equal(rememberWalletReownOwner(first, denied), false); assert.doesNotThrow(() => forgetWalletReownOwner(denied));
});

test('address and chain snapshots reject malformed or unsupported values without requesting anything', () => {
  assert.equal(walletReownAddress(address), address); assert.equal(walletReownAddress('0x' + '0'.repeat(40)), '');
  assert.equal(walletReownAddress(`${address} `), ''); assert.equal(walletReownAddress('<script>'), '');
  assert.equal(walletReownChainId(137), 137); assert.equal(walletReownChainId('0x89'), 137); assert.equal(walletReownChainId('137'), 137);
  for (const value of [null, undefined, 'eip155:137', '137anything', '', -1, 1.5]) assert.equal(walletReownChainId(value), null);
});

test('native owner changes and logout permanently retire captured connection leases', async () => {
  const scope = createWalletReownBoundary(), first = walletReownOwnerKey(a), next = walletReownOwnerKey(b);
  const epoch = scope.setOwner(first); assert.equal(scope.permits(first, epoch), false);
  assert.equal(scope.authorize(first, epoch), true);
  let calls = 0;
  const provider = guardWalletReownProvider({ request: async () => { calls++; return [address]; } }, () => scope.permits(first, epoch), { address, chainId: () => 137 });
  assert.deepEqual(await provider.request({ method: 'eth_accounts' }), [address]);
  scope.setOwner(next); await assert.rejects(provider.request({ method: 'eth_accounts' }), /session_changed/); assert.equal(calls, 1);
  assert.equal(scope.authorize(first, epoch), false);
  const current = scope.generation(); scope.authorize(next, current); scope.retire(); assert.equal(scope.permits(next, current), false);
});

test('guarded provider allows only connection, Polygon switching and explicit same-address ownership signing', async () => {
  const calls = [], raw = { request: async input => { calls.push(input); return 'synthetic'; } }; let chain = 1;
  const provider = guardWalletReownProvider(raw, () => true, { address, chainId: () => chain });
  for (const method of ['eth_sendTransaction', 'eth_sendRawTransaction', 'eth_signTransaction', 'wallet_sendCalls', 'wallet_grantPermissions', 'eth_sign']) {
    await assert.rejects(provider.request({ method, params: [] }), /method_disabled/);
  }
  await assert.rejects(provider.request({ method: 'personal_sign', params: ['ownership', address] }), /network_required/);
  await assert.rejects(provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] }), /network_required/);
  await assert.rejects(provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89', injected: true }] }), /network_required/);
  assert.equal(calls.length, 0);
  await provider.request({ method: 'eth_accounts' }); await provider.request({ method: 'eth_chainId' });
  await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }] }); chain = 137;
  await assert.rejects(provider.request({ method: 'personal_sign', params: ['ownership', other] }), /network_required/);
  await provider.request({ method: 'personal_sign', params: ['ownership', address] });
  assert.equal(calls.length, 4);
});

test('a late ownership RPC result cannot be reused after its native owner changes', async () => {
  let resolve, active = true;
  const provider = guardWalletReownProvider({ request: () => new Promise(done => { resolve = done; }) }, () => active, { address, chainId: () => 137 });
  const pending = provider.request({ method: 'personal_sign', params: ['ownership', address] });
  active = false; resolve('synthetic-signature'); await assert.rejects(pending, /session_changed/);
});

test('captured provider listeners also stop exposing account data after retirement and remain removable', () => {
  let active = true, callback, count = 0;
  const raw = { request: async () => [], on: (_event, listener) => { callback = listener; }, removeListener: (_event, listener) => { assert.equal(listener, callback); callback = null; } };
  const provider = guardWalletReownProvider(raw, () => active), listener = () => count++;
  provider.on('accountsChanged', listener); callback([address]); assert.equal(count, 1);
  active = false; callback([other]); assert.equal(count, 1);
  provider.removeListener('accountsChanged', listener); assert.equal(callback, null);
});
