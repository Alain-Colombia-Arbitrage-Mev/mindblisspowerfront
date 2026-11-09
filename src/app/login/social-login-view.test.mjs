import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = file => readFileSync(new URL(file, import.meta.url), 'utf8');

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
  assert.match(css, /@media \(max-width: 860px\)[\s\S]*\.auth-social-buttons\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /aria-busy=/);
});

test('the login form always renders the social block so unavailable providers remain visible', () => {
  const login = source('./MagicLinkLoginForm.jsx');
  assert.match(login, /<SocialLoginButtons enabledProviders=\{enabledSocialProviders\} \/>/);
  assert.doesNotMatch(login, /emailOtpOnly \? <SocialLoginButtons/);
  assert.match(source('./SocialLoginButtons.jsx'), /\(próximamente\)/);
});
