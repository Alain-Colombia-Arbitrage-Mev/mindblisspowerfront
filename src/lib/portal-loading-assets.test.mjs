import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
function load(name, mocks = {}) {
  const source = read(name);
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react/jsx-runtime') return jsx;
    if (Object.hasOwn(mocks, id)) return mocks[id];
    assert.fail(`Unexpected dependency in lightweight portal shell: ${id}`);
  }, module, module.exports);
  return module.exports.default;
}

test('root layout preloads the local brand font without remote styles or the disabled chat widget', () => {
  const Layout = load('../app/layout.jsx', { '../index.css': {} });
  const html = renderToStaticMarkup(React.createElement(Layout, null, 'synthetic-content'));
  assert.match(html, /rel="preload"[^>]*href="\/fonts\/manrope-latin-wght\.woff2"[^>]*as="font"/);
  assert.match(html, /crossorigin="anonymous"/i);
  assert.match(html, /synthetic-content/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|chatwoot|soporte\.mindbliss/i);
  assert.doesNotMatch(read('../app/layout.jsx'), /ChatwootWidget/);
});

test('the local Mindbliss font kit is WOFF2, licensed and nonblocking', () => {
  const css = read('../index.css');
  assert.doesNotMatch(css, /@import\s+url|fonts\.googleapis|fonts\.gstatic/);
  for (const filename of ['manrope-latin-wght.woff2', 'manrope-latin-ext-wght.woff2', 'ibm-plex-mono-latin-400.woff2', 'ibm-plex-mono-latin-500.woff2']) {
    const bytes = readFileSync(new URL(`../../public/fonts/${filename}`, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'wOF2');
    assert.ok(bytes.length > 1000 && bytes.length < 80000);
    assert.ok(css.includes(`url('/fonts/${filename}')`));
  }
  const faces = css.match(/@font-face\s*\{[^}]+\}/g);
  assert.equal(faces.length, 4);
  for (const face of faces) {
    assert.match(face, /font-family:\s*'(?:Manrope|IBM Plex Mono)'/);
    assert.match(face, /font-display:\s*swap/);
  }
  assert.match(read('../../public/fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
});

test('static auth shell renders the approved identity panel and eager photo without becoming a client boundary', () => {
  const source = read('../app/_components/AuthShell.jsx');
  assert.doesNotMatch(source, /^['"]use client['"]/);
  const AuthShell = load('../app/_components/AuthShell.jsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'lucide-react': new Proxy({}, { get: () => () => React.createElement('span', { 'aria-hidden': true }) }),
    './ThemeToggle': { default: () => null },
    './AuthSupportWidget': { default: () => null },
  });
  const html = renderToStaticMarkup(React.createElement(AuthShell, {
    activePath: '/login', eyebrow: 'Acceso', title: 'Bienvenido',
  }, React.createElement('button', null, 'Enviar código')));
  assert.match(html, /class="auth-identity"/);
  assert.match(html, /class="auth-wordmark" href="\/"/);
  assert.match(html, /loading="eager" decoding="async"/);
  assert.match(html, /Enviar código/);
});

test('navigation fallback is accessible, static and has no session or financial data dependencies', () => {
  const Loading = load('../app/dashboard/loading.jsx');
  const html = renderToStaticMarkup(React.createElement(Loading));
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.doesNotMatch(html, /@|\$|balance|token|sesión/i);
});
