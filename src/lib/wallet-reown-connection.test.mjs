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
  const provider = guardWalletReownProvider({ request: async () => { calls++; return [address]; } }, () => scope.permits(first, epoch), { address });
  assert.deepEqual(await provider.request({ method: 'eth_accounts' }), [address]);
  scope.setOwner(next); await assert.rejects(provider.request({ method: 'eth_accounts' }), /session_changed/); assert.equal(calls, 1);
  assert.equal(scope.authorize(first, epoch), false);
  const current = scope.generation(); scope.authorize(next, current); scope.retire(); assert.equal(scope.permits(next, current), false);
});

test('guarded provider allows only connection, Polygon switching and explicit same-address ownership signing', async () => {
  const calls = [];
  let chain = '0x1', account = address;
  const provider = guardWalletReownProvider({ request: async request => {
    calls.push(request.method);
    if (request.method === 'eth_chainId') return chain;
    if (request.method === 'eth_accounts') return [account];
    if (request.method === 'wallet_switchEthereumChain') { chain = '0x89'; return null; }
    return 'synthetic-signature';
  } }, () => true, { address });
  for (const method of ['eth_sendTransaction', 'eth_sendRawTransaction', 'eth_signTransaction', 'wallet_sendCalls', 'wallet_grantPermissions', 'eth_sign']) {
    await assert.rejects(provider.request({ method, params: [] }), /method_disabled/);
  }
  await assert.rejects(provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] }), /network_required/);
  await assert.rejects(provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89', injected: true }] }), /network_required/);
  await assert.rejects(provider.request({ method: 'personal_sign', params: ['ownership', other] }), /network_required/);
  assert.deepEqual(calls, []);
  const sign = () => provider.request({ method: 'personal_sign', params: ['ownership', address] });
  await assert.rejects(sign(), /signer_mismatch/);
  assert.deepEqual(calls, ['eth_accounts', 'eth_chainId']);
  await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }] });
  account = other; await assert.rejects(sign(), /signer_mismatch/);
  assert.equal(calls.includes('personal_sign'), false);
  account = address; assert.equal(await sign(), 'synthetic-signature');
  assert.deepEqual(calls.slice(-3), ['eth_accounts', 'eth_chainId', 'personal_sign']);
});

test('retiring the native owner during the provider account check stops before network read and signature', async () => {
  let resolve, active = true;
  const calls = [];
  const provider = guardWalletReownProvider({ request: ({ method }) => {
    calls.push(method); return new Promise(done => { resolve = done; });
  } }, () => active, { address });
  const pending = provider.request({ method: 'personal_sign', params: ['ownership', address] });
  active = false; resolve([address]);
  await assert.rejects(pending, /session_changed/);
  assert.deepEqual(calls, ['eth_accounts']);
});

test('a late ownership signature cannot be reused after its native owner changes', async () => {
  let resolveSign, enterSign, active = true;
  const signing = new Promise(resolve => { enterSign = resolve; });
  const provider = guardWalletReownProvider({ request: async ({ method }) => {
    if (method === 'eth_accounts') return [address];
    if (method === 'eth_chainId') return 137;
    enterSign(); return new Promise(done => { resolveSign = done; });
  } }, () => active, { address });
  const pending = provider.request({ method: 'personal_sign', params: ['ownership', address] });
  await signing;
  active = false; resolveSign('synthetic-signature');
  await assert.rejects(pending, /session_changed/);
});

test('captured provider listeners also stop exposing account data after retirement and remain removable', () => {
  let active = true, callback, count = 0;
  const raw = { request: async () => [], on: (_event, listener) => { callback = listener; }, removeListener: (_event, listener) => { assert.equal(listener, callback); callback = null; } };
  const provider = guardWalletReownProvider(raw, () => active), listener = () => count++;
  provider.on('accountsChanged', listener); callback([address]); assert.equal(count, 1);
  active = false; callback([other]); assert.equal(count, 1);
  provider.removeListener('accountsChanged', listener); assert.equal(callback, null);
});
