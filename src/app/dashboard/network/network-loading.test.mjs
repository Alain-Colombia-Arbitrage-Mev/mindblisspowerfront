import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { walletPortalRequestAllowed, WALLET_PORTAL_ORIGIN } from '../../../lib/wallet-portal-policy.mjs';

test('the administrative portal retires every network view without importing chunks, fetching data or starting authentication', () => {
  const source = readFileSync(new URL('./page.jsx', import.meta.url), 'utf8');
  assert.match(source, /notFound\(\)/);
  assert.doesNotMatch(source, /member-network-reader|next\/dynamic|BinaryTreeView|GenerationView|createMemberNetworkReader|fetch\(/);
  for (const suffix of ['', '?tab=tree', '?tab=generation', '?tab=rank', '?tab=list']) {
    assert.equal(walletPortalRequestAllowed(new URL('/dashboard/network' + suffix, WALLET_PORTAL_ORIGIN)), false);
  }
});
