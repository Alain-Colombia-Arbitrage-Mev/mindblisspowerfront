import assert from 'node:assert/strict';
import test from 'node:test';
import { readArbitrumUsdcBalance, readEthereumUsdcBalance, readPolygonUsdcBalance } from './wallet-polygon-usdc.mjs';

const projectVariable = 'NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID';
const project = '1'.repeat(32);
const wallet = '0x0000000000000000000000000000000000000001';
const usdc = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

function withProject(t, value = project) {
  const previous = process.env[projectVariable];
  process.env[projectVariable] = value;
  t.after(() => {
    if (previous === undefined) delete process.env[projectVariable];
    else process.env[projectVariable] = previous;
  });
}

test('reads Circle USDC on Polygon without wallet permissions and preserves its six decimals', async t => {
  withProject(t);
  const balance = await readPolygonUsdcBalance(wallet, { fetchImpl: async (url, init) => {
    assert.equal(url.origin, 'https://rpc.walletconnect.org');
    assert.equal(url.searchParams.get('chainId'), 'eip155:137');
    assert.equal(url.searchParams.get('projectId'), project);
    assert.equal(init.credentials, 'omit');
    assert.equal(init.redirect, 'error');
    assert.deepEqual(JSON.parse(init.body), {
      jsonrpc: '2.0', id: 1, method: 'eth_call',
      params: [{ to: usdc, data: '0x70a08231' + wallet.slice(2).padStart(64, '0') }, 'latest'],
    });
    return Response.json({ jsonrpc: '2.0', id: 1, result: '0x' + (1234567).toString(16).padStart(64, '0') });
  } });
  assert.equal(balance, '1.234567');
});

test('reads native USDC on Arbitrum One from the public RPC without project credentials', async t => {
  withProject(t, '');
  const balance = await readArbitrumUsdcBalance(wallet, { fetchImpl: async (url, init) => {
    assert.equal(url.href, 'https://arb1.arbitrum.io/rpc');
    assert.equal(init.credentials, 'omit');
    assert.equal(init.redirect, 'error');
    assert.deepEqual(init.headers, { 'Content-Type': 'application/json' });
    assert.deepEqual(JSON.parse(init.body), {
      jsonrpc: '2.0', id: 1, method: 'eth_call',
      params: [{ to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', data: '0x70a08231' + wallet.slice(2).padStart(64, '0') }, 'latest'],
    });
    return Response.json({ jsonrpc: '2.0', id: 1, result: '0x' + (12000001).toString(16).padStart(64, '0') });
  } });
  assert.equal(balance, '12.000001');
});

test('reads Circle USDC on Ethereum mainnet using its own chain and token contract', async t => {
  withProject(t);
  const balance = await readEthereumUsdcBalance(wallet, { fetchImpl: async (url, init) => {
    assert.equal(url.origin, 'https://rpc.walletconnect.org');
    assert.equal(url.searchParams.get('chainId'), 'eip155:1');
    assert.equal(init.credentials, 'omit');
    assert.deepEqual(JSON.parse(init.body), {
      jsonrpc: '2.0', id: 1, method: 'eth_call',
      params: [{ to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', data: '0x70a08231' + wallet.slice(2).padStart(64, '0') }, 'latest'],
    });
    return Response.json({ jsonrpc: '2.0', id: 1, result: '0x' + (23000009).toString(16).padStart(64, '0') });
  } });
  assert.equal(balance, '23.000009');
});

test('missing configuration or an invalid address makes no request', async t => {
  withProject(t, '');
  const fetchImpl = () => assert.fail('invalid input must not be sent');
  await assert.rejects(readPolygonUsdcBalance(wallet, { fetchImpl }), /balance_unavailable/);
  process.env[projectVariable] = project;
  await assert.rejects(readPolygonUsdcBalance('invalid-address', { fetchImpl }), /balance_unavailable/);
  await assert.rejects(readArbitrumUsdcBalance('invalid-address', { fetchImpl }), /balance_unavailable/);
  await assert.rejects(readArbitrumUsdcBalance(wallet, { fetchImpl, signal: AbortSignal.abort() }), /balance_unavailable/);
});

test('a foreign reply, malformed amount or cancelled read cannot display a balance', async t => {
  withProject(t);
  for (const value of [{ id: 1, result: '0x1' }, { id: 2, result: '0x' + '0'.repeat(64) }]) {
    await assert.rejects(readPolygonUsdcBalance(wallet, {
      fetchImpl: async () => Response.json({ jsonrpc: '2.0', ...value }),
    }), /balance_unavailable/);
  }
  const controller = new AbortController();
  await assert.rejects(readPolygonUsdcBalance(wallet, {
    signal: controller.signal,
    fetchImpl: async () => {
      controller.abort();
      return Response.json({ jsonrpc: '2.0', id: 1, result: '0x' + '0'.repeat(64) });
    },
  }), /balance_unavailable/);
});
