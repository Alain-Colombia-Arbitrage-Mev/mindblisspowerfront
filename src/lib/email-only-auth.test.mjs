import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function loadSource(relativePath, mocks) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    assert.fail(`Unexpected dependency in email-only route: ${id}`);
  }, module, module.exports);
  return module.exports;
}

test('the actual auth catch-all rejects every phone route without consulting an upstream service', async () => {
  let upstream = 0;
  const route = loadSource('../app/api/auth/[...path]/route.js', { '@/lib/better-auth-bridge.mjs': {
    proxyBetterAuth() { upstream += 1; return Response.json({ ok: true }); },
    proxyBetterAuthKeys() { upstream += 1; return Response.json({ keys: [] }); },
  } });
  for (const path of ['phone-number/opt-in', 'phone-number/send-otp', 'phone-number/verify', 'phone-number/revoke-consent', 'phone-number/sign-in', 'phone-number/unknown']) {
    for (const method of ['GET', 'POST']) {
      const response = await route[method](new Request(`https://example.test/api/auth/${path}`, { method }), { params: Promise.resolve({ path: path.split('/') }) });
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.deepEqual(await response.json(), { error: 'not_found' });
    }
  }
  assert.equal(upstream, 0);
  assert.equal((await route.GET(new Request('https://example.test/api/auth/jwks'), { params: Promise.resolve({ path: ['jwks'] }) })).status, 200);
  assert.equal(upstream, 1);
  assert.equal((await route.POST(new Request('https://example.test/api/auth/sign-in/email', { method: 'POST' }), { params: Promise.resolve({ path: ['sign-in', 'email'] }) })).status, 200);
  assert.equal(upstream, 2);
});

test('the actual former SMS page redirects to email login without loading its SMS component', () => {
  const redirects = [];
  const page = loadSource('../app/account/security/page.jsx', { 'next/navigation': { redirect(path) { redirects.push(path); throw new Error('synthetic_next_redirect'); } } });
  assert.throws(() => page.default(), /synthetic_next_redirect/);
  assert.deepEqual(redirects, ['/login']);
});
