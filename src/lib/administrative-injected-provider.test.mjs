import assert from 'node:assert/strict';
import test from 'node:test';
import { discoverAdministrativeProviders, readAdministrativeProvider, switchAdministrativeProviderNetwork,
  administrativeProviderMatches, signAdministrativeOwnership, watchAdministrativeProvider } from './administrative-injected-provider.mjs';

const assigned = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`, message = 'wallet.mindblisspower.com wants you to sign in with your Ethereum account:\n' + assigned + '\n\nOwnership only; no funds are transferred.\nChain ID: 137';
const sign = `0x${'ab'.repeat(65)}`;
function wallet({ account = assigned, chain = '0x89' } = {}) {
  const calls = [], listeners = new Map();
  const provider = { async request(input) { calls.push(input); return input.method === 'eth_chainId' ? chain : input.method === 'personal_sign' ? sign : input.method === 'wallet_switchEthereumChain' ? null : [account]; },
    on(event, callback) { listeners.set(event, callback); }, removeListener(event) { listeners.delete(event); } };
  return { provider, calls, listeners };
}

test('passive provider discovery only emits the EIP-6963 event and never requests account access', () => {
  const h = wallet(), target = new EventTarget(), snapshots = []; target.ethereum = h.provider;
  let discoveries = 0; target.addEventListener('eip6963:requestProvider', () => discoveries++);
  const stop = discoverAdministrativeProviders(value => snapshots.push(value), target);
  assert.equal(discoveries, 1); assert.equal(snapshots.length, 1); assert.equal(h.calls.length, 0);
  const event = new Event('eip6963:announceProvider'); event.detail = { info: { uuid: '11111111-1111-4111-8111-111111111111', name: 'Wallet <script>', icon: 'malicious.svg' }, provider: h.provider };
  target.dispatchEvent(event); assert.equal(snapshots.length, 1, 'same provider is deduplicated without rendering an icon');
  stop(); assert.equal(h.calls.length, 0);
});

test('readonly reload checks never request permission; only an explicit connect calls eth_requestAccounts', async () => {
  const h = wallet(); assert.ok(administrativeProviderMatches(await readAdministrativeProvider(h.provider), assigned));
  assert.deepEqual(h.calls.map(call => call.method), ['eth_accounts', 'eth_chainId']);
  await readAdministrativeProvider(h.provider, { requestAccess: true });
  assert.deepEqual(h.calls.slice(2).map(call => call.method), ['eth_requestAccounts', 'eth_chainId']);
});

test('account/network mismatch and malformed provider data do not request an ownership signature', async () => {
  for (const input of [{ account: other }, { chain: '0x1' }, { account: '' }]) {
    const h = wallet(input); await assert.rejects(signAdministrativeOwnership(h.provider, message, assigned));
    assert.ok(!h.calls.some(call => call.method === 'personal_sign'));
  }
  assert.equal(administrativeProviderMatches({ address: assigned, chainId: '0x1' }, assigned), false);
});

test('explicit network switch targets Polygon only and never adds a network or starts a transaction', async () => {
  const h = wallet(); await switchAdministrativeProviderNetwork(h.provider);
  assert.deepEqual(h.calls[0], { method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }] });
  assert.ok(h.calls.every(call => ['wallet_switchEthereumChain', 'eth_accounts', 'eth_chainId'].includes(call.method)));
});

test('ownership signs UTF-8 message bytes with personal_sign and checks account and chain before and after', async () => {
  const h = wallet(); assert.equal(await signAdministrativeOwnership(h.provider, message, assigned), sign);
  assert.deepEqual(h.calls.map(call => call.method), ['eth_accounts', 'eth_chainId', 'personal_sign', 'eth_accounts', 'eth_chainId']);
  assert.equal(Buffer.from(h.calls[2].params[0].slice(2), 'hex').toString('utf8'), message); assert.equal(h.calls[2].params[1], assigned);
  assert.ok(h.calls.every(call => !['eth_sendTransaction', 'eth_sendRawTransaction', 'wallet_sendCalls', 'eth_signTransaction'].includes(call.method)));
});

test('provider account/network events invalidate pending work and listener cleanup retires stale handlers', async () => {
  const h = wallet(), controller = new AbortController(); let changed = 0;
  const stop = watchAdministrativeProvider(h.provider, () => { changed++; controller.abort(); });
  assert.deepEqual([...h.listeners.keys()], ['accountsChanged', 'chainChanged', 'disconnect']); h.listeners.get('accountsChanged')([other]);
  await assert.rejects(readAdministrativeProvider(h.provider, { signal: controller.signal }), { name: 'AbortError' }); assert.equal(h.calls.length, 0);
  stop(); assert.equal(h.listeners.size, 0); assert.equal(changed, 1);
});

test('an account changed while the signature popup was open cannot produce an accepted frontend proof', async () => {
  const h = wallet(); let accountReads = 0;
  h.provider.request = async input => { h.calls.push(input); return input.method === 'eth_chainId' ? '0x89' : input.method === 'personal_sign' ? sign : [++accountReads === 1 ? assigned : other]; };
  await assert.rejects(signAdministrativeOwnership(h.provider, message, assigned), /administrative_signer_mismatch/);
});
