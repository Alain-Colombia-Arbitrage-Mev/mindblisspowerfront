import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

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

test('root layout applies the saved theme before paint and initializes Tailwind dark mode', () => {
  const layout = source('../layout.jsx');
  assert.match(layout, /className="dark"/);
  assert.match(layout, /id="vp-theme-init"/);
  assert.match(layout, /root\.classList\.toggle\("dark", theme === "dark"\)/);
  assert.match(layout, /root\.style\.colorScheme = theme/);
  assert.match(layout, /meta name="theme-color"/);
});

test('theme switch keeps a 44px target, visible focus and a reduced-motion state', () => {
  const css = source('../../index.css');
  assert.match(css, /\.vp-shell-icon\.vp-theme-toggle\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.vp-theme-switch\s*\{[^}]*width:\s*60px[^}]*height:\s*34px/s);
  assert.match(css, /\.vp-theme-toggle:focus-visible/);
  assert.match(css, /prefers-reduced-motion[\s\S]*\.vp-theme-thumb, \.vp-theme-glyph \{ transition: none; \}/);
  assert.match(css, /\.auth-access-area \.vp-theme-toggle \{ min-width: 44px; width: 44px;/);
});
