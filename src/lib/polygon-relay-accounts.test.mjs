import assert from 'node:assert/strict';
import test from 'node:test';
import { hasSelectedPolygonRelayAccount } from './polygon-relay-accounts.mjs';

const bound = `0x${'a'.repeat(40)}`, other = `0x${'b'.repeat(40)}`;
test('external authorized account lists retain only the selected bound account as the sponsored signer', () => {
  assert.equal(hasSelectedPolygonRelayAccount([bound], bound), true);
  assert.equal(hasSelectedPolygonRelayAccount([bound.toUpperCase().replace('0X', '0x'), other], bound), true);
  assert.equal(hasSelectedPolygonRelayAccount([other, bound], bound), false);
  for (const accounts of [[], null, bound, { 0: bound, length: 1 }, [bound, bound], [bound, null], [bound, [other]], [bound, 'not-address']]) {
    assert.equal(hasSelectedPolygonRelayAccount(accounts, bound), false);
  }
  const trap = { toString() { assert.fail('provider data must not be coerced'); } };
  assert.equal(hasSelectedPolygonRelayAccount([bound, trap], bound), false);
  assert.equal(hasSelectedPolygonRelayAccount([bound], trap), false);
  assert.equal(hasSelectedPolygonRelayAccount([bound], [bound]), false);
});
