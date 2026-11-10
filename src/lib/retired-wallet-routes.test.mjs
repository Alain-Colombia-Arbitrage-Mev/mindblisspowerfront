import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { retiredWalletRoute } from './retired-wallet-route.mjs';

function route(relative, extra = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === '@/lib/retired-wallet-route.mjs') return { retiredWalletRoute };
    if (Object.hasOwn(extra, name)) return extra[name];
    assert.fail(`Retired route loaded an active dependency: ${name}`);
  }, module, module.exports);
  return module.exports;
}

test('administrative assignment, funding and Meld routes return 404 without importing a backend or provider', async () => {
  const routes = [
    ['../app/api/member/administrative-wallet/route.js', 'GET'],
    ['../app/api/member/administrative-wallet/ensure/route.js', 'POST'],
    ['../app/api/member/wallet-funding/administrative/options/route.js', 'GET'],
    ['../app/api/member/wallet-funding/administrative/session/route.js', 'POST'],
    ['../app/api/member/wallet-funding/administrative/status/route.js', 'GET'],
    ['../app/api/member/onramp/availability/route.js', 'GET'],
    ['../app/api/member/onramp/intent/route.js', 'POST'],
    ['../app/api/member/onramp/quote/route.js', 'POST'],
    ['../app/api/webhooks/meld/route.js', 'POST'],
  ];
  for (const [path, method] of routes) {
    const handler = route(path);
    const response = await handler[method](new Request('https://app.mindblisspower.com/api/member/example', {
      method, headers: { cookie: 'better-auth.session_token=synthetic', authorization: 'Bearer never-forwarded' },
    }));
    assert.equal(response.status, 404, path);
    assert.deepEqual(await response.json(), { error: 'not_found' });
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
});

test('the personal history endpoint refuses administrative records before calling its shared BFF library', async () => {
  const calls = [];
  const handler = route('../app/api/member/wallet-funding/history/route.js', {
    '@/lib/wallet-funding-bff.mjs': { handleWalletFunding(request, action) { calls.push({ request, action }); return Response.json({ walletKind: 'personal' }); } },
  });
  for (const query of ['walletKind=administrative', 'walletKind=personal&walletKind=administrative', 'walletKind=administrative&walletKind=personal']) {
    const response = await handler.GET(new Request(`https://app.mindblisspower.com/api/member/wallet-funding/history?${query}`));
    assert.equal(response.status, 404);
  }
  assert.equal(calls.length, 0);
  const response = await handler.GET(new Request('https://app.mindblisspower.com/api/member/wallet-funding/history?walletKind=personal'));
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].action, 'history');
});

test('the retired administrative page cannot render its component, assign a wallet or redirect into another app', () => {
  const missing = new Error('next-not-found');
  const page = route('../app/dashboard/wallet-administrative/page.jsx', { 'next/navigation': { notFound() { throw missing; } } });
  assert.throws(() => page.default(), error => error === missing);
  for (const file of ['../app/dashboard/_components/executive-pages/AdministrativeWalletFundingPage.jsx', '../components/panel/SidebarAdministrativeWalletCard.jsx']) {
    assert.equal(existsSync(new URL(file, import.meta.url)), false, file);
  }
});
