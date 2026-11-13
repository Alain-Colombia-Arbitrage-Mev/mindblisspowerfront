import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = file => readFileSync(new URL(file, import.meta.url), 'utf8');
function variableInitializer(file, name) {
  const text = source(file), parsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let expression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === name) expression = node.initializer;
    if (!expression) ts.forEachChild(node, visit);
  }
  visit(parsed); assert.ok(expression, `Missing ${name}`); return expression.getText(parsed);
}
function load(file, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(source(file), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === 'react' || id === 'react/jsx-runtime') return require(id);
    assert.fail(`Unexpected dependency: ${id}`);
  }, module, module.exports);
  return module.exports;
}

test('prepaint initialization always migrates old dark preferences to light, including blocked storage', () => {
  const script = vm.runInNewContext(variableInitializer('../layout.jsx', 'themeInitScript'));
  for (const saved of [null, '', 'system', 'light', 'dark', new Error('storage blocked')]) {
    const root = { dataset: { theme: 'dark' }, style: {}, dark: true, classList: { remove(name) { assert.equal(name, 'dark'); root.dark = false; } } };
    const stored = []; let color;
    vm.runInNewContext(script, {
      localStorage: { getItem() { assert.fail('retired theme must not be restored'); }, setItem(key, value) { if (saved instanceof Error) throw saved; stored.push([key, value]); } },
      document: { documentElement: root, querySelector: () => ({ setAttribute(name, value) { color = value; } }) },
    });
    assert.equal(root.dataset.theme, 'light'); assert.equal(root.style.colorScheme, 'light'); assert.equal(root.dark, false); assert.equal(color, '#f3f7f8');
    if (!(saved instanceof Error)) assert.deepEqual(stored, [['vp-theme', 'light']]);
  }
  assert.match(source('../layout.jsx'), /<html[^>]*data-theme="light"/);
});

test('login and dashboard headers expose language and account controls without a theme switch', () => {
  const Link = ({ children, ...props }) => React.createElement('a', props, children);
  const icon = () => React.createElement('svg', { 'aria-hidden': true });
  const locale = () => React.createElement('button', { type: 'button' }, 'Idioma');
  const mocks = { 'next/link': { default: Link }, './IntentLink': { default: Link },
    'lucide-react': new Proxy({}, { get: () => icon }), '@/i18n/LanguageSwitcher': { default: locale },
    '@/i18n/LanguageProvider': { useI18n: () => ({ t: key => key }) },
    './AuthLocalizedContent': { AuthIdentityCopy: () => null, AuthLegal: () => null } };
  for (const file of ['./AuthShell.jsx', '../../components/panel/PanelHeader.jsx']) {
    const View = load(file, mocks).default;
    const html = renderToStaticMarkup(React.createElement(View, { title: 'Perfil', section: 'Cuenta', mobileMenuOpen: false, onToggleMobileMenu() {} }));
    assert.match(html, /Idioma/); assert.doesNotMatch(html, /role="switch"|vp-theme-toggle|theme\.enableDark/);
  }
  assert.doesNotMatch(source('../../components/panel/overview/OverviewDashboard.jsx'), /ThemeToggle|vp-theme-toggle/);
});

test('AppKit stays light even if a previous document or system preference was dark', () => {
  const expression = variableInitializer('../../components/reown/ReownProvider.jsx', 'initialWalletTheme');
  assert.equal(vm.runInNewContext(expression), 'light');
  assert.equal(vm.runInNewContext(expression, { document: { documentElement: { dataset: { theme: 'dark' } } } }), 'light');
  assert.match(source('../../components/reown/ReownProvider.jsx'), /setThemeMode\("light"\)/);
});

test('notifications use light even if a caller passes a stale dark preference', () => {
  const Sonner = () => null;
  const Toaster = load('../../components/ui/sonner.jsx', { sonner: { Toaster: Sonner } }).Toaster;
  const tree = Toaster({ theme: 'dark', position: 'top-right' });
  assert.equal(tree.type, Sonner); assert.equal(tree.props.theme, 'light'); assert.equal(tree.props.position, 'top-right');
});
