import assert from 'node:assert/strict';
import test from 'node:test';
import { administrativeCheckoutReturn } from './administrative-checkout-return.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
test('a hosted return can select only a canonical checkout reference, never payment or wallet authority', () => {
  assert.equal(administrativeCheckoutReturn(`?checkoutReference=${reference.toUpperCase()}`), reference);
  assert.equal(administrativeCheckoutReturn(`?checkoutReference=${reference}&status=paid&success=true&amount=1000000&walletAddress=other`), reference);
  for (const search of ['', '?status=paid', '?checkoutReference=', `?checkoutReference=${reference}&checkoutReference=${reference}`,
    '?checkoutReference=../private', `?checkoutReference=${reference}%0A`, '?checkoutReference=not-a-uuid', null, [], 'x'.repeat(2049)]) {
    assert.equal(administrativeCheckoutReturn(search), null);
  }
});
