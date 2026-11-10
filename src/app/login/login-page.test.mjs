import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import ts from 'typescript';
import { registrationLoginUrl, registrationUrl } from '../register/registration-model.mjs';

function page(enabled = true) {
  const compiled = ts.transpileModule(readFileSync(new URL('./page.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const Form = () => null;
  const element = (type, props, key) => React.createElement(type, { ...props, key });
  const mocks = { 'next/link': { default: () => null }, '../_components/AuthShell': { default: () => null },
    './MagicLinkLoginForm': { default: Form }, '@/lib/better-auth-bridge.mjs': {
      betterAuthEnabled: () => enabled,
      betterAuthSocialProviders: () => enabled ? ['google'] : [],
    },
    './LoginLocalizedCopy': { LoginHeading: () => null, LoginAccountLinks: () => null },
    '../register/registration-model.mjs': { registrationLoginUrl, registrationUrl }, 'react/jsx-runtime': { jsx: element, jsxs: element } };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected login page dependency: ${name}`); return mocks[name];
  }, module, module.exports);
  function form(node) {
    if (node?.type === Form) return node;
    return React.Children.toArray(node?.props?.children).map(form).find(Boolean);
  }
  return { async render(params = {}) { return form(await module.exports.default({ searchParams: Promise.resolve(params) })); },
    renderTree(params = {}) { return module.exports.default({ searchParams: Promise.resolve(params) }); } };
}

test('the real login page remounts the form for a changed referral, side, recipient or mode without any request', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('a server login page must not send an OTP or inspect an account'));
  const app = page(), initial = { email: 'first@example.test', ref: 'SponsorA', side: 'L', mode: 'code' };
  const first = await app.render(initial);
  assert.ok(first.key);
  for (const change of [{ ref: 'SponsorB' }, { side: 'R' }, { email: 'second@example.test' }, { mode: 'password' }]) {
    const next = await app.render({ ...initial, ...change });
    assert.notEqual(next.key, first.key);
    assert.equal(next.props.initialEmail, change.email || initial.email);
    assert.equal(next.props.initialRef, change.ref || initial.ref);
    assert.equal(next.props.initialSide, change.side || initial.side);
    assert.equal(next.props.initialMode, change.mode || initial.mode);
  }
  assert.notEqual((await page(false).render(initial)).key, first.key, 'a changed auth provider cannot reuse another provider state');
  assert.deepEqual(first.props.enabledSocialProviders, ['google']);
});

test('unrelated, privileged and duplicate-shaped query values cannot alter the allowed login context', async () => {
  const app = page(), initial = { email: 'member@example.test', ref: 'SponsorA', side: 'L' };
  const first = await app.render(initial);
  const same = await app.render({ ...initial, role: 'admin', subject: 'attacker', next: 'https://attacker.test', password: 'private' });
  assert.equal(same.key, first.key);
  assert.doesNotMatch(JSON.stringify(same.props), /attacker|private|role|subject/);
  const invalid = await app.render({ email: ['a@example.test', 'b@example.test'], ref: {}, side: true, mode: ['password'] });
  assert.equal(invalid.props.initialEmail, ''); assert.equal(invalid.props.initialRef, ''); assert.equal(invalid.props.initialSide, '');
  assert.equal(invalid.props.initialMode, 'code');
});

test('rewon opens email OTP first and only switches to password when explicitly requested', async () => {
  const app = page(true);
  assert.equal((await app.render()).props.initialMode, 'code');
  assert.equal((await app.render({ mode: 'code' })).props.initialMode, 'code');
  assert.equal((await app.render({ mode: 'password' })).props.initialMode, 'password');
  assert.equal((await app.render({ mode: 'reset' })).props.initialMode, 'code');
});

test('the login server page passes the same current referral and side to both top navigation actions without trusting redirects or roles', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('auth navigation must not send messages or read a session'));
  const app = page(), output = await app.renderTree({ email: ' MEMBER@EXAMPLE.TEST ', ref: 'Sponsor&A#?+', side: 'R',
    next: 'https://attacker.test', role: 'admin' });
  for (const [prop, path] of [['loginHref', '/login'], ['registrationHref', '/register']]) {
    const url = new URL(output.props[prop], 'https://portal.example.test');
    assert.equal(url.origin, 'https://portal.example.test'); assert.equal(url.pathname, path);
    assert.equal(url.searchParams.get('ref'), 'Sponsor&A#?+'); assert.equal(url.searchParams.get('side'), 'R');
    assert.equal(url.searchParams.get('email'), 'member@example.test');
    assert.equal(url.searchParams.has('next'), false); assert.equal(url.searchParams.has('role'), false);
  }
});
