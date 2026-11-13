import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const source = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const require = createRequire(import.meta.url);

function componentAt(file) {
  const compiled = ts.transpileModule(source(file), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => {
    if (id === 'react' || id === 'react/jsx-runtime') return require(id);
    if (id === 'lucide-react') return { Loader2: () => null };
    if (id === './SocialProviderIcon') return componentAt('./SocialProviderIcon.jsx');
    if (id === '@/lib/browser-request-deadline.mjs') return { browserRequestDeadline() { assert.fail('SSR started an authentication request'); } };
    assert.fail(`Unexpected social component dependency: ${id}`);
  }, module, module.exports);
  return module.exports;
}

test('the approved login uses real Google and Apple vector marks instead of placeholder glyphs', () => {
  const icons = source('./SocialProviderIcon.jsx');
  for (const color of ['#4285F4', '#34A853', '#FBBC05', '#EA4335']) assert.match(icons, new RegExp(color));
  assert.match(icons, /function AppleIcon/);
  assert.match(icons, /fill="currentColor"/);
  for (const file of ['./MagicLinkLoginForm.jsx', './BetterAuthPasswordLogin.jsx']) {
    assert.doesNotMatch(source(file), /Google, próximamente|Apple, próximamente|<span>G<\/span>|>●</);
  }
});

test('social access remains same-origin, bounded and gated by server-provided availability', () => {
  const component = source('./SocialLoginButtons.jsx');
  assert.match(component, /fetch\('\/api\/auth\/sign-in\/social'/);
  assert.match(component, /credentials: 'same-origin'/);
  assert.match(component, /redirect: 'error'/);
  assert.match(component, /browserRequestDeadline\(controller\.signal, 12000\)/);
  assert.match(component, /enabled\.has\(provider\.id\)/);
  assert.match(component, /https:\/\/accounts\.google\.com/);
  assert.match(component, /https:\/\/appleid\.apple\.com/);
});

test('mobile social actions are full-width touch targets and retain an accessible error channel', () => {
  const css = source('../../index.css');
  const component = source('./SocialLoginButtons.jsx');
  assert.match(css, /\.auth-social-button\s*\{[^}]*min-height:\s*52px/s);
  assert.match(css, /@media \(max-width: 719px\)[\s\S]*\.auth-social-buttons\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /aria-busy=/);
});

test('the actual social component renders no buttons or divider when disabled and only its explicitly enabled Google action', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('rendering social access must not make a request'));
  const login = source('./MagicLinkLoginForm.jsx');
  assert.match(login, /<SocialLoginButtons enabledProviders=\{enabledSocialProviders\} \/>/);
  const SocialLoginButtons = componentAt('./SocialLoginButtons.jsx').default;
  for (const props of [{}, { enabledProviders: [] }, { enabledProviders: ['unknown'] }]) {
    assert.equal(renderToStaticMarkup(React.createElement(SocialLoginButtons, props)), '');
  }
  const google = renderToStaticMarkup(React.createElement(SocialLoginButtons, { enabledProviders: ['google'] }));
  assert.equal((google.match(/<button\b/g) || []).length, 1);
  assert.match(google, /aria-label="Continuar con Google"/);
  assert.match(google, /auth-social-divider/);
  assert.doesNotMatch(google, /Apple|próximamente|disabled/);
});
