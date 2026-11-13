import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import ts from 'typescript';
import { registrationLoginUrl, registrationUrl } from '../register/registration-model.mjs';

const ThemeToggle = () => null;
const LanguageSwitcher = () => null;

function shell(props) {
  const source = readFileSync(new URL('./AuthShell.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }, mocks = { 'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) }, 'lucide-react': new Proxy({}, { get: () => () => null }),
    './ThemeToggle': { default: ThemeToggle },
    '@/i18n/LanguageSwitcher': { default: LanguageSwitcher }, './AuthLocalizedContent': { AuthIdentityCopy: () => null, AuthLegal: () => null },
    'react/jsx-runtime': { jsx: (type, props, key) => React.createElement(type, { ...props, key }), jsxs: (type, props, key) => React.createElement(type, { ...props, key }) } };
  new Function('require', 'module', 'exports', code)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected auth navigation dependency: ${name}`); return mocks[name];
  }, module, module.exports);
  return module.exports.default(props);
}
function nodes(node) { return [node, ...React.Children.toArray(node?.props?.children).flatMap(nodes)]; }

test('the real auth shell keeps the Mindbliss identity and preferences without support controls', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('the static shell must not inspect a session or send messages'));
  const tree = shell({ activePath: '/register', loginHref: registrationLoginUrl('member@example.test', 'Sponsor', 'R'), registrationHref: registrationUrl('member@example.test', 'Sponsor', 'R') });
  const all = nodes(tree);
  assert.equal(all.find(node => node?.props?.className === 'auth-wordmark').props.href, '/');
  assert.ok(all.some(node => node?.type === ThemeToggle));
  assert.ok(all.some(node => node?.type === LanguageSwitcher && node.props.compact));
  assert.doesNotMatch(readFileSync(new URL('./AuthShell.jsx', import.meta.url), 'utf8'), /AuthSupportWidget/);
  assert.equal(all.some(node => node?.type === 'nav'), false);
});

test('auth pages without attribution retain the approved shell classes', () => {
  const all = nodes(shell({ activePath: '/login' }));
  const layout = new Set(all.find(node => node?.type === 'main').props.className.split(/\s+/));
  assert.ok(layout.has('auth-shell'));
  assert.ok(all.some(node => node?.props?.className === 'auth-identity'));
  assert.ok(all.some(node => node?.props?.className === 'auth-content'));
});
