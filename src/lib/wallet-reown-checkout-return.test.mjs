import assert from 'node:assert/strict';
import test from 'node:test';
import { walletReownCheckoutReturn } from './wallet-reown-checkout-return.mjs';
const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
test('only the dedicated sandbox callback selects a canonical owned reference', () => {
  assert.equal(walletReownCheckoutReturn(`?sandboxCheckoutReference=${reference.toUpperCase()}`), reference);
  for (const search of [undefined, '', `?checkoutReference=${reference}`, `?meldCheckoutReference=${reference}`,
    `?sandboxCheckoutReference=${reference}&checkoutReference=${reference}`, `?sandboxCheckoutReference=${reference}&sandboxCheckoutReference=${reference}`,
    `?sandboxCheckoutReference=${reference}&success=true`, `?sandboxCheckoutReference=${reference}#confirmed`,
    `?sandboxCheckoutReference=${reference}&`, `?%73andboxCheckoutReference=${reference}`, `?sandboxCheckoutReference=${'x'.repeat(4096)}`]) {
    assert.equal(walletReownCheckoutReturn(search), '', search);
  }
});
