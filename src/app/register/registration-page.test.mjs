import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import ts from 'typescript';

function page(enabled = true) {
  const source = readFileSync(new URL('./page.jsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const Legacy = () => null, Better = () => null;
  const mocks = { '@/lib/better-auth-bridge.mjs': { betterAuthEnabled: () => enabled },
    './RegisterForm': { default: Legacy }, './BetterAuthRegisterForm': { default: Better },
    // React's JSX runtime accepts key as its third argument, unlike createElement.
    'react/jsx-runtime': { jsx: (type, props, key) => React.createElement(type, { ...props, key }),
      jsxs: (type, props, key) => React.createElement(type, { ...props, key }) } };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected page dependency: ${name}`); return mocks[name];
  }, module, module.exports);
  return { render: module.exports.default, Legacy, Better };
}

test('the real server page keys each permitted registration context so navigation remounts client state', async () => {
  const app = page();
  const first = await app.render({ searchParams: Promise.resolve({ ref: 'MP-FIRST', side: 'L', email: 'first@example.test' }) });
  const second = await app.render({ searchParams: Promise.resolve({ ref: 'MP-SECOND', side: 'R', email: 'second@example.test', resume: '1' }) });
  assert.equal(first.type, app.Better);
  assert.equal(second.type, app.Better);
  assert.notEqual(first.key, second.key);
  assert.equal(first.key, first.props.initialSearch);
  assert.equal(second.key, second.props.initialSearch);
  assert.deepEqual(Object.fromEntries(new URLSearchParams(second.props.initialSearch)), {
    email: 'second@example.test', ref: 'MP-SECOND', resume: '1',
  });
});

test('unsupported, duplicate-shaped and privileged query values cannot change the registration context or enter its props', async () => {
  const app = page();
  const first = await app.render({ searchParams: Promise.resolve({ ref: 'MP-FIRST', side: 'L' }) });
  const same = await app.render({ searchParams: Promise.resolve({ ref: 'MP-FIRST', side: 'L', role: 'admin', password: 'private', next: 'https://attacker.test' }) });
  assert.equal(first.key, same.key);
  assert.equal(new URLSearchParams(first.props.initialSearch).has('side'), false);
  assert.doesNotMatch(same.props.initialSearch, /admin|private|attacker|password|next/);
  const invalid = await app.render({ searchParams: Promise.resolve({ email: ['first@example.test', 'second@example.test'], ref: {}, side: true }) });
  assert.equal(invalid.props.initialSearch, '');
  assert.equal(invalid.key, '');
});

test('the disabled-provider legacy page remains unchanged and does not await query details', async () => {
  const app = page(false);
  const output = await app.render({ searchParams: { then() { assert.fail('legacy page awaited Better Auth query context'); } } });
  assert.equal(output.type, app.Legacy);
  assert.equal(output.key, null);
});
