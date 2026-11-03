import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import ts from 'typescript';
import { registrationLoginUrl, registrationUrl } from '../register/registration-model.mjs';

function shell(props) {
  const source = readFileSync(new URL('./AuthShell.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }, mocks = { 'next/link': { default: () => null }, 'lucide-react': { ArrowUpRight: () => null },
    'react/jsx-runtime': { jsx: (type, props, key) => React.createElement(type, { ...props, key }), jsxs: (type, props, key) => React.createElement(type, { ...props, key }) } };
  new Function('require', 'module', 'exports', code)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected auth navigation dependency: ${name}`); return mocks[name];
  }, module, module.exports);
  return module.exports.default(props);
}
function nodes(node) { return [node, ...React.Children.toArray(node?.props?.children).flatMap(nodes)]; }

test('the real auth shell preserves explicit login and registration contexts with the existing active tab and unchanged home/onboarding links', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('the static shell must not inspect a session or send messages'));
  const context = { ref: 'Sponsor&A#?+', side: 'R', email: 'member@example.test' };
  const loginHref = registrationLoginUrl(context.email, context.ref, context.side);
  const registrationHref = registrationUrl(context.email, context.ref, context.side);
  const tree = shell({ activePath: '/register', loginHref, registrationHref });
  const all = nodes(tree);
  const login = all.find(node => node?.props?.children === 'Acceso');
  const registration = all.find(node => node?.props?.children === 'Registro');
  assert.equal(login.props.href, loginHref); assert.equal(registration.props.href, registrationHref);
  assert.equal(registration.props['aria-current'], 'page'); assert.equal(login.props['aria-current'], undefined);
  assert.equal(all.find(node => node?.props?.children === 'Bienvenida').props.href, '/onboarding');
  assert.equal(all.filter(node => node?.props?.href === '/').length, 2);
});

test('auth pages without an attribution context retain their existing plain paths and design', () => {
  const all = nodes(shell({ activePath: '/login' }));
  assert.equal(all.find(node => node?.props?.children === 'Acceso').props.href, '/login');
  assert.equal(all.find(node => node?.props?.children === 'Registro').props.href, '/register');
  assert.equal(all.find(node => node?.type === 'main').props.className, 'auth-mono min-h-dvh lg:grid lg:grid-cols-[minmax(420px,46%)_minmax(0,1fr)]');
});
