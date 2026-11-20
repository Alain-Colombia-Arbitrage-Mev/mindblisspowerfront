import assert from 'node:assert/strict';
import test from 'node:test';
import { appWalletDepositUri } from './app-wallet-deposit-qr.mjs';

const address = '0x1234567890abcdef1234567890abcdef12345678';
const deposits = [
  ['USDC_POLYGON', 137, '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'],
  ['USDC_ARBITRUM', 42161, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
  ['USDC', 1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
  ['USDT_POLYGON', 137, '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'],
];

test('deposit QR identifies the exact ERC-20 contract, chain and linked recipient without an amount', () => {
  for (const [code, chainId, token] of deposits) {
    const uri = appWalletDepositUri(address, code);
    assert.match(uri, /^ethereum:0x[0-9A-Fa-f]{40}@[0-9]+\/transfer\?address=0x[0-9A-Fa-f]{40}$/, code);
    assert.equal(uri.toLowerCase(), ('ethereum:' + token + '@' + chainId + '/transfer?address=' + address).toLowerCase(), code);
    assert.deepEqual([...new URL(uri).searchParams.keys()], ['address'], code);
  }
  assert.equal(appWalletDepositUri(address), appWalletDepositUri(address, 'USDC_POLYGON'));
});

test('an unlinked, malformed or zero address and an unsupported asset cannot generate a deposit QR', () => {
  for (const value of [undefined, null, '', '0x1234', '0x' + '0'.repeat(40), address + ' ', 'ethereum:' + address]) {
    assert.ok(!appWalletDepositUri(value, 'USDC_POLYGON'));
  }
  for (const code of [null, '', 'ETH', 'USDC_ETHEREUM', 'USDT_ARBITRUM', 'USDC_BASE']) {
    assert.ok(!appWalletDepositUri(address, code), code);
  }
});
