import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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

test('new personal payment, gas, Solana and Reown webhook capabilities are retired before every mutation', () => {
  for (const pathname of ['/dashboard/wallet-personal/pay', '/dashboard/wallet-personal/requests',
    '/dashboard/packages', '/dashboard/packages/purchases', '/dashboard/packages/confirmacion',
    '/api/member/company-payments/balances', '/api/member/company-payments/prepare',
    '/api/member/%2563ompany-payments/submit', '/api/member/polygon-relay/capabilities',
    '/api/member/POLYGON-RELAY/authorize', '/api/member/solana-payments/prepare',
    '/api/member/solana-wallet-link/confirm', '/api/webhooks/reown', '/api/webhooks/%2572eown']) {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']) {
      assert.equal(walletPortalRequestAllowed(url(pathname)), false, pathname);
      const response = cloudflarePortalGuard(new Request(url(pathname), { method }), { AUTH_PROVIDER: 'better-auth' });
      assert.equal(response.status, 404, `${method} ${pathname}`);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
    }
  }
});

test('hidden community, network and ranks pages cannot reopen through direct or encoded URLs', () => {
  for (const pathname of ['/dashboard/referrals', '/dashboard/community', '/dashboard/network',
    '/dashboard/network/history', '/dashboard/rank', '/dashboard/ranks', '/dashboard/team',
    '/dashboard/team-pro', '/dashboard/communications', '/dashboard/communications/news',
    '/dashboard/communications/testimonials', '/dashboard/%256eetwork', '/dashboard/TEAM-PRO',
    '/api/member/news', '/api/member/ranks', '/api/network/analyze', '/api/%256eetwork/analyze']) {
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

test('profile, native authentication and referral attribution stay available without widening administrative access', async () => {
  for (const pathname of ['/login', '/register', '/dashboard/profile',
    '/api/auth/get-session', '/api/auth/logout', '/api/auth/better-auth/email-otp/verify-email',
    '/api/member/profile', '/api/member/referral-attribution', '/api/member/referral', '/api/payments/me',
    '/dashboard/wallet-administrative', '/api/member/administrative-wallet',
    '/api/member/administrative-wallet/ensure',
    '/api/member/wallet-funding/administrative/options?country=MX&sourceCurrencyCode=MXN&serviceProvider=TRANSAK']) {
    assert.equal(walletPortalRequestAllowed(url(pathname)), true, pathname);
  }
  assert.equal(cloudflarePortalGuard(new Request(url('/api/admin/users')), { AUTH_PROVIDER: 'better-auth' }).status, 404);
  const failure = walletPortalNotFound();
  assert.equal(failure.status, 404);
  assert.equal(failure.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await failure.json(), { error: 'not_found' });
});

test('retired API modules return a private terminal404 without reading authentication or reaching any provider', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('A retired wallet route reached transport'));
  const root = fileURLToPath(new URL('../', import.meta.url));
  const namespaces = ['member/company-payments', 'member/polygon-relay', 'member/solana-payments',
    'member/solana-wallet-link', 'member/wallet-link', 'member/wallet-funding/personal',
    'member/onramp', 'member/news', 'member/ranks', 'network', 'webhooks/reown'];
  const routes = [];
  function visit(folder) {
    for (const item of readdirSync(folder, { withFileTypes: true })) {
      const target = path.join(folder, item.name);
      if (item.isDirectory()) visit(target);
      else if (item.name === 'route.js') routes.push(target);
    }
  }
  namespaces.forEach(namespace => visit(path.join(root, 'app/api', namespace)));
  const policy = pathToFileURL(path.join(root, 'lib/wallet-portal-policy.mjs')).href;
  for (const file of routes) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /(?:bff|runtimeEnvironment|coreFetch|reown-webhook-discovery)/, file);
    const executable = source.replaceAll('@/lib/wallet-portal-policy.mjs', policy);
    const handlers = await import(`data:text/javascript,${encodeURIComponent(executable)}`);
    for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      assert.equal(typeof handlers[method], 'function', `${file} ${method}`);
      const response = await handlers[method](new Request(url('/api/member/retired'), { method }));
      assert.equal(response.status, 404, `${file} ${method}`);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.deepEqual(await response.json(), { error: 'not_found' });
    }
  }
  assert.ok(routes.length >= 40, 'all added personal APIs must be checked, including unchanged legacy stubs');
});

test('hidden page modules stop at notFound and the history entry retains only the administrative selector', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  for (const page of ['wallet-personal', 'wallet-personal/pay', 'wallet-personal/requests', 'packages', 'packages/purchases', 'packages/confirmacion', 'referrals',
    'network', 'rank', 'ranks', 'team', 'team-pro', 'communications', 'communications/news', 'communications/testimonials']) {
    const source = readFileSync(path.join(root, 'app/dashboard', page, 'page.jsx'), 'utf8');
    assert.match(source, /notFound\(\)/, page);
    assert.doesNotMatch(source, /(?:from\s*|import\(\s*)["'](?:@\/|\.)/, page);
  }
  const history = readFileSync(path.join(root, 'app/api/member/wallet-funding/history/route.js'), 'utf8');
  assert.match(history, /get\('walletKind'\) === 'administrative'/);
  assert.match(history, /walletPortalRequestAllowed\(url\)/);
  assert.doesNotMatch(history, /retiredWalletRoute/);
});

test('the actual history entry rejects every personal or ambiguous selector before its private handler', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const source = readFileSync(path.join(root, 'app/api/member/wallet-funding/history/route.js'), 'utf8');
  const service = `data:text/javascript,${encodeURIComponent("export const handleWalletFunding = (_request, action) => Response.json({ action });")}`;
  const executable = source.replaceAll('@/lib/wallet-portal-policy.mjs', pathToFileURL(path.join(root, 'lib/wallet-portal-policy.mjs')).href)
    .replaceAll('@/lib/wallet-funding-bff.mjs', service);
  const { GET } = await import(`data:text/javascript,${encodeURIComponent(executable)}`);
  for (const search of ['', '?walletKind=personal', '?walletKind=administrative&walletKind=personal',
    '?walletKind=administrative&walletKind=administrative', '?walletKind=administrative&subject=other']) {
    const response = await GET(new Request(url(`/api/member/wallet-funding/history${search}`)));
    assert.equal(response.status, 404, search);
    assert.deepEqual(await response.json(), { error: 'not_found' });
  }
  const accepted = await GET(new Request(url('/api/member/wallet-funding/history?walletKind=administrative')));
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { action: 'history' });
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
      assert.doesNotMatch(target, /(?:components[\\/]reown[\\/]|PersonalWalletFundingPage|PersonalWalletRequestsPage|SidebarWalletCard|CompanyPaymentPage|PersonalTransferRouter|SponsoredTransferPanel)/, file);
      inspect(target);
    }
  }
  entries.forEach(inspect);
  assert.ok(seen.size > 50, 'the check must traverse the real route graph');
});
