import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = file => readFileSync(new URL(file, import.meta.url), 'utf8');

test('theme control exposes a real switch with both visual states and a current-state label', () => {
  const component = source('./ThemeToggle.jsx');
  assert.match(component, /role="switch"/);
  assert.match(component, /aria-checked=\{theme === "dark"\}/);
  assert.match(component, /vp-theme-glyph--sun/);
  assert.match(component, /vp-theme-glyph--moon/);
  assert.match(component, /theme === "dark" \? t\("theme\.dark"\) : t\("theme\.light"\)/);
  assert.match(component, /theme === "dark" \? t\("theme\.enableLight"\) : t\("theme\.enableDark"\)/);
  assert.match(component, /localStorage\.setItem\(THEME_STORAGE_KEY, next\)/);
  assert.match(component, /classList\.toggle\("dark", next === "dark"\)/);
  assert.match(component, /root\.style\.colorScheme = next/);
  assert.match(component, /window\.dispatchEvent\(new CustomEvent\(THEME_EVENT/);
  assert.match(component, /window\.addEventListener\(THEME_EVENT, syncTheme\)/);
});

test('root layout renders light before hydration and preserves a saved theme before paint', () => {
  const layout = source('../layout.jsx');
  assert.match(layout, /<html[^>]*data-theme="light"/);
  assert.doesNotMatch(layout, /<html[^>]*className="dark"/);
  assert.match(layout, /<meta name="theme-color" content="#f3f7f8"/);
  assert.match(layout, /id="vp-theme-init"/);
  assert.match(layout, /root\.classList\.toggle\("dark", theme === "dark"\)/);
  assert.match(layout, /root\.style\.colorScheme = theme/);
  assert.match(layout, /meta name="theme-color"/);
});

function variableInitializer(file, name) {
  const text = source(file);
  const parsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let expression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === name) expression = node.initializer;
    if (!expression) ts.forEachChild(node, visit);
  }
  visit(parsed);
  assert.ok(expression, `Missing ${name}`);
  return expression.getText(parsed);
}

test('prepaint initialization uses light without a preference and never overwrites an explicit dark choice', () => {
  const script = vm.runInNewContext(variableInitializer('../layout.jsx', 'themeInitScript'));
  for (const [saved, expected] of [[null, 'light'], ['', 'light'], ['system', 'light'], ['light', 'light'], ['dark', 'dark'], [new Error('storage blocked'), 'light']]) {
    const root = { dataset: {}, style: {}, classList: { toggle(name, enabled) { root.dark = enabled; } } };
    let color;
    vm.runInNewContext(script, {
      localStorage: { getItem() { if (saved instanceof Error) throw saved; return saved; }, setItem() { assert.fail('initialization saved an implicit preference'); } },
      document: { documentElement: root, querySelector: () => ({ setAttribute(name, value) { color = value; } }) },
    });
    assert.equal(root.dataset.theme, expected);
    assert.equal(root.style.colorScheme, expected);
    assert.equal(root.dark, expected === 'dark');
    assert.equal(color, expected === 'dark' ? '#0b1219' : '#f3f7f8');
  }
  const toggle = source('./ThemeToggle.jsx');
  assert.match(toggle, /useState\("light"\)/);
  assert.match(toggle, /let next = "light"/);
  const css = source('../../index.css');
  assert.match(css, /:root:not\(\[data-theme="dark"\]\)\s*\{\s*color-scheme:\s*light/s);
});

test('theme switch keeps a 44px target, visible focus and a reduced-motion state', () => {
  const css = source('../../index.css');
  assert.match(css, /\.vp-shell-icon\.vp-theme-toggle\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.vp-theme-switch\s*\{[^}]*width:\s*60px[^}]*height:\s*34px/s);
  assert.match(css, /\.vp-theme-toggle:focus-visible/);
  assert.match(css, /prefers-reduced-motion[\s\S]*\.vp-theme-thumb, \.vp-theme-glyph \{ transition: none; \}/);
  assert.match(css, /\.auth-access-area \.vp-theme-toggle \{ min-width: 44px; width: 44px;/);
});
