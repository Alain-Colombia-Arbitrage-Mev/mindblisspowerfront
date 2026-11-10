import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walletPortalRequestAllowed, walletPortalNotFound, WALLET_PORTAL_ORIGIN } from './wallet-portal-policy.mjs';
import { cloudflarePortalGuard } from './cloudflare-portal-guard.mjs';

const url = pathname => new URL(pathname, WALLET_PORTAL_ORIGIN);

test('administrative portal denies personal funding, ownership and legacy on-ramp entry points before authentication', () => {
  for (const pathname of ['/dashboard/wallet-personal', '/dashboard/wallet-personal/other',
    '/dashboard/%77allet-personal', '/dashboard/%2577allet-personal', '/dashboard/WALLET-PERSONAL',
    '/api/member/wallet-link', '/api/member/wallet-link/challenge', '/api/member/wallet-link/confirm',
    '/api/member/wallet-funding/personal/options?country=MX&sourceCurrencyCode=MXN',
    '/api/member/wallet-funding/%2570ersonal/intent', '/api/member/wallet-funding/personal/status',
    '/api/member/onramp/availability', '/api/member/onramp/quote', '/api/member/onramp/intent']) {
    assert.equal(walletPortalRequestAllowed(url(pathname)), false, pathname);
    assert.equal(cloudflarePortalGuard(new Request(url(pathname)), { AUTH_PROVIDER: 'better-auth' }).status, 404, pathname);
  }
});

test('administrative history accepts exactly one owned administrative selector and no personal selector', () => {
  assert.equal(walletPortalRequestAllowed(url('/api/member/wallet-funding/history?walletKind=administrative')), true);
  for (const search of ['', '?walletKind=personal', '?walletKind=administrative&walletKind=personal',
    '?walletKind=administrative&extra=1', '?walletKind=administrative&walletKind=administrative']) {
    assert.equal(walletPortalRequestAllowed(url(`/api/member/wallet-funding/history${search}`)), false, search);
  }
});

test('other member surfaces and administrative sandbox reads remain available while admin system APIs remain private', async () => {
  for (const pathname of ['/login', '/dashboard/profile', '/dashboard/packages', '/dashboard/network',
    '/dashboard/wallet-administrative', '/api/member/administrative-wallet',
    '/api/member/wallet-funding/administrative/options?country=MX&sourceCurrencyCode=MXN&serviceProvider=TRANSAK']) {
    assert.equal(walletPortalRequestAllowed(url(pathname)), true, pathname);
  }
  assert.equal(cloudflarePortalGuard(new Request(url('/api/admin/users')), { AUTH_PROVIDER: 'better-auth' }).status, 404);
  const failure = walletPortalNotFound();
  assert.equal(failure.status, 404);
  assert.equal(failure.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await failure.json(), { error: 'not_found' });
});

test('route entry graph contains no Reown SDK, personal wallet component or personal sidebar', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const entries = [];
  const visit = folder => { for (const item of readdirSync(folder, { withFileTypes: true })) {
    const target = path.join(folder, item.name);
    if (item.isDirectory()) visit(target);
    else if (/^(?:page|layout|route)\.(?:jsx?|tsx?)$/.test(item.name)) entries.push(target);
  } };
  visit(path.join(root, 'app'));
  const seen = new Set();
  function inspect(file) {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /(?:from\s*|import\(\s*)["']@reown\//, file);
    for (const match of source.matchAll(/(?:from\s*|import\(\s*|import\s*)["']([^"']+)["']/g)) {
      const name = match[1];
      if (!name.startsWith('@/') && !name.startsWith('.')) continue;
      const base = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      const target = [base, ...['.js', '.jsx', '.mjs', '.ts', '.tsx'].map(extension => `${base}${extension}`)]
        .find(candidate => /\.(?:jsx?|mjs|tsx?)$/.test(candidate) && existsSync(candidate));
      if (!target) continue;
      assert.doesNotMatch(target, /(?:components[\\/]reown[\\/]|PersonalWalletFundingPage|SidebarWalletCard)/, file);
      inspect(target);
    }
  }
  entries.forEach(inspect);
  assert.ok(seen.size > 50, 'the check must traverse the real route graph');
});
