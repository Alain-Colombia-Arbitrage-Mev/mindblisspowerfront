import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { retiredWalletRoute } from './retired-wallet-route.mjs';
import { walletPortalNotFound, walletPortalRequestAllowed } from './wallet-portal-policy.mjs';

function route(relative, extra = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === '@/lib/wallet-portal-policy.mjs') return { walletPortalNotFound, walletPortalRequestAllowed };
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
    if (Object.hasOwn(extra, name)) return extra[name];
    assert.fail('Unexpected route dependency: ' + name);
  }, module, module.exports);
  return module.exports;
}

test('the retired route utility remains a private terminal404', async () => {
  const response = retiredWalletRoute();
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'not_found' });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('the administrative branch retains its native assignment and sandbox funding BFF routes', async () => {
  const calls = [];
  const dependencies = {
    '@/lib/administrative-wallet-bff.mjs': { handleAdministrativeWallet(_request, action) { calls.push(action); return Response.json({ action }); } },
    '@/lib/wallet-funding-bff.mjs': { handleWalletFunding(_request, action) { calls.push(action); return Response.json({ action }); } },
  };
  for (const [relative, method, action] of [
    ['../app/api/member/administrative-wallet/route.js', 'GET', 'status'],
    ['../app/api/member/administrative-wallet/ensure/route.js', 'POST', 'ensure'],
    ['../app/api/member/wallet-funding/administrative/options/route.js', 'GET', 'options'],
    ['../app/api/member/wallet-funding/administrative/session/route.js', 'POST', 'administrative'],
    ['../app/api/member/wallet-funding/administrative/status/route.js', 'GET', 'administrative-status'],
  ]) {
    const handler = route(relative, dependencies);
    assert.equal(handler.dynamic, 'force-dynamic');
    const response = await handler[method](new Request('https://wallet.mindblisspower.com/api/member/example', { method }));
    assert.equal(response.status, 200, relative);
    assert.deepEqual(await response.json(), { action });
  }
  assert.deepEqual(calls, ['status', 'ensure', 'options', 'administrative', 'administrative-status']);
});

test('the wallet page mounts the dedicated sandbox wallet flow and never the old assignment or production wallet page', () => {
  const SandboxWalletFundingPage = () => assert.fail('The route only returns its component');
  const page = route('../app/dashboard/wallet-administrative/page.jsx', {
    '../_components/executive-pages/SandboxWalletFundingPage': { default: SandboxWalletFundingPage },
  });
  const element = page.default();
  assert.equal(element.type, SandboxWalletFundingPage);
  assert.deepEqual(element.props, {});
});
