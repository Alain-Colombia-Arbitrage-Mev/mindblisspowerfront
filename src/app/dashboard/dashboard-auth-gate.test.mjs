import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { AuthServiceUnavailable, AuthAccessRestricted } from '../../lib/better-auth-bridge.mjs';
import { privateCloudflareResponse } from '../../lib/cloudflare-portal-guard.mjs';

// Execute the real layout and existing AuthShell without starting Next or
// contacting providers. Every identity and failure below is synthetic.
function gate({ token = 'synthetic-private-token', claims = null, tokenError,
  verificationError, betterAuth = true, redirectError } = {}) {
  const calls = { token: 0, verification: [], redirects: [], shell: 0, privateChildren: 0 };
  const compile = (path, mocks) => {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
    }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', compiled)(name => {
      assert.ok(Object.hasOwn(mocks, name), `unexpected dashboard gate dependency ${name}`);
      return mocks[name];
    }, module, module.exports);
    return module.exports.default;
  };
  const AuthShell = compile('../_components/AuthShell.jsx', {
    'react/jsx-runtime': jsxRuntime,
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'lucide-react': { ArrowUpRight: () => null },
  });
  function DashboardShell({ authMode, children }) {
    calls.shell++;
    return React.createElement('section', { 'data-dashboard-mode': authMode }, children);
  }
  const Layout = compile('./layout.jsx', {
    'react/jsx-runtime': jsxRuntime,
    '@/lib/admin-bff': { rawIdToken: async () => {
      calls.token++;
      if (tokenError) throw tokenError;
      return token;
    } },
    '@/lib/better-auth-bridge.mjs': { betterAuthEnabled: () => betterAuth, AuthServiceUnavailable, AuthAccessRestricted },
    '@/lib/verify-id-token': {
      verifyIdToken: () => assert.fail('dashboard must distinguish unavailable verification from invalid proof'),
      verifyIdTokenForSession: async value => {
        calls.verification.push(value);
        if (verificationError) throw verificationError;
        return claims;
      },
    },
    'next/navigation': { redirect: path => {
      calls.redirects.push(path);
      throw redirectError || Object.assign(new Error('synthetic-next-redirect'), { digest: 'NEXT_REDIRECT' });
    } },
    '../_components/AuthShell': { default: AuthShell },
    './_components/DashboardShell': { default: DashboardShell },
  });
  function PrivateChild() {
    calls.privateChildren++;
    return React.createElement('p', null, 'synthetic-private-child-content');
  }
  return { calls, async render() {
    const output = await Layout({ children: React.createElement(PrivateChild) });
    return { output, html: renderToStaticMarkup(output) };
  } };
}

for (const [label, token] of [['empty', ''], ['forged', 'synthetic-forged'],
  ['expired', 'synthetic-expired'], ['restricted or unbound', 'synthetic-ineligible']]) {
  test(`${label} proof cannot render the dashboard or its private children`, async t => {
    const logs = [];
    t.mock.method(console, 'warn', value => logs.push(value));
    const app = gate({ token });
    await assert.rejects(app.render(), { message: 'synthetic-next-redirect' });
    assert.deepEqual(app.calls.redirects, [token ? '/login?auth=session-not-established' : '/login']);
    assert.deepEqual(app.calls.verification, token ? [token] : []);
    assert.equal(app.calls.shell, 0);
    assert.equal(app.calls.privateChildren, 0);
    assert.deepEqual(logs, []);
  });
}

test('Cognito invalid proof retains its existing login destination', async () => {
  const app = gate({ betterAuth: false });
  await assert.rejects(app.render(), { message: 'synthetic-next-redirect' });
  assert.deepEqual(app.calls.redirects, ['/login']);
  assert.equal(app.calls.shell, 0);
  assert.equal(app.calls.privateChildren, 0);
});

test('a canonical binding denial retains the native session and renders only explicit access guidance', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(value));
  const app = gate({ tokenError: new AuthAccessRestricted() });
  const { html } = await app.render();
  assert.deepEqual(app.calls.redirects, []);
  assert.deepEqual(app.calls.verification, []);
  assert.equal(app.calls.shell, 0);
  assert.equal(app.calls.privateChildren, 0);
  assert.match(html, /MBP-LOGIN-ACCESS/);
  assert.match(html, /Tu cuenta necesita revisión de acceso/);
  assert.match(html, /Repetir el código no cambia esos permisos/);
  assert.match(html, /href="\/dashboard"/);
  assert.doesNotMatch(html, /MBP-LOGIN-SESSION|synthetic-private|data-dashboard-mode|sesión expiró/);
  assert.deepEqual(logs, []);
});

for (const [stage, errorProperty, reference] of [
  ['service_token', 'tokenError', 'MBP-LOGIN-SERVICE'],
  ['verification', 'verificationError', 'MBP-LOGIN-VERIFY'],
]) {
  test(`${stage} outage renders only the existing auth shell with an opaque reference and native retry links`, async t => {
    const logs = [];
    t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
    const error = new AuthServiceUnavailable();
    error.message = 'synthetic-private-error@example.test secret token';
    error.stack = 'synthetic-private-stack';
    error.cause = { email: 'synthetic-private@example.test', token: 'synthetic-private-token' };
    const app = gate({ [errorProperty]: error });
    const { html } = await app.render();
    assert.equal(app.calls.token, 1);
    assert.deepEqual(app.calls.verification, stage === 'service_token' ? [] : ['synthetic-private-token']);
    assert.equal(app.calls.shell, 0);
    assert.equal(app.calls.privateChildren, 0);
    assert.deepEqual(app.calls.redirects, []);
    assert.deepEqual(logs, [{ event: 'auth_handoff_unavailable', stage }]);
    assert.match(html, /auth-mono/);
    assert.match(html, /role="alert"/);
    assert.match(html, /No pudimos comprobar tu sesión/);
    assert.match(html, new RegExp(reference));
    assert.match(html, /href="\/dashboard"[^>]*>Reintentar abrir el panel<\/a>/);
    assert.match(html, /href="\/login"[^>]*>Volver al acceso<\/a>/);
    assert.doesNotMatch(html + JSON.stringify(logs), /synthetic-private|@|stack|cause|password|account_suspended|review_required/);
    assert.doesNotMatch(html, /data-dashboard-mode|synthetic-private-child-content|<script/);

    // The existing Worker boundary covers HTML/RSC, errors and redirects too.
    const response = privateCloudflareResponse(new Response(html, {
      headers: { 'content-type': 'text/html', 'cache-control': 'public,max-age=86400' },
    }));
    for (const header of ['CDN-Cache-Control', 'Cloudflare-CDN-Cache-Control']) {
      assert.equal(response.headers.get(header), 'no-store');
    }
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  });
}

test('healthy verified identities retain the shell and children without receiving authority from the layout', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(value));
  for (const betterAuth of [true, false]) {
    const claims = { sub: 'synthetic-subject', email: 'synthetic@example.test', role: 'untrusted-unused-role' };
    const app = gate({ betterAuth, claims });
    const { output, html } = await app.render();
    assert.equal(app.calls.token, 1);
    assert.deepEqual(app.calls.verification, ['synthetic-private-token']);
    assert.equal(app.calls.shell, 1);
    assert.equal(app.calls.privateChildren, 1);
    assert.deepEqual(app.calls.redirects, []);
    assert.equal(output.props.authMode, betterAuth ? 'better-auth' : 'cognito');
    assert.deepEqual(Object.keys(output.props).sort(), ['authMode', 'children']);
    assert.match(html, /synthetic-private-child-content/);
    assert.doesNotMatch(html, /synthetic-private-token|synthetic@example|untrusted-unused-role|MBP-LOGIN/);
  }
  assert.deepEqual(logs, []);
});

test('Next redirect exceptions remain outside auth catches instead of becoming a service outage', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(value));
  const redirectError = new AuthServiceUnavailable();
  const app = gate({ redirectError });
  await assert.rejects(app.render(), error => error === redirectError);
  assert.deepEqual(logs, []);
  assert.equal(app.calls.shell, 0);
  assert.equal(app.calls.privateChildren, 0);
});

test('unclassified programming errors propagate without raw diagnostic logging or a partial dashboard', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(value));
  for (const errorProperty of ['tokenError', 'verificationError']) {
    const error = new Error('synthetic-programming-failure');
    const app = gate({ [errorProperty]: error });
    await assert.rejects(app.render(), actual => actual === error);
    assert.equal(app.calls.shell, 0);
    assert.equal(app.calls.privateChildren, 0);
    assert.deepEqual(app.calls.redirects, []);
  }
  assert.deepEqual(logs, []);
});
