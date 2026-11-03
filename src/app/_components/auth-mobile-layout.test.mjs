import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import postcss from 'postcss';
import { registrationViewHarness, findRegistrationNode as find } from '../register/registration-view-test-harness.mjs';
import * as registration from '../register/registration-model.mjs';
import * as emailOtp from '../../lib/email-otp-client.mjs';
import * as auth from '../login/better-auth-login.mjs';
import * as deadline from '../../lib/browser-request-deadline.mjs';

const require = createRequire(import.meta.url);
const source = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const link = ({ children, ...props }) => React.createElement('a', props, children);
const icons = new Proxy({}, { get: () => () => null });
const classes = node => new Set((node?.props?.className || '').split(/\s+/));
function hasClasses(node, ...tokens) {
  for (const token of tokens) assert.ok(classes(node).has(token), `Missing responsive contract: ${token}`);
}

function compile(file, mocks, exports = '') {
  const code = ts.transpileModule(`${source(file)}\n${exports}`, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react/jsx-runtime') return require(id);
    assert.ok(Object.hasOwn(mocks, id), `Unexpected auth layout dependency: ${id}`);
    return mocks[id];
  }, module, module.exports);
  return module.exports;
}

const loginMocks = {
  react: React,
  'lucide-react': icons,
  '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, label: '', start() {} }), isMicrosoftEmail: () => false, suggestEmailFix: () => '' },
  '@/lib/password': { checkPassword: () => ({ results: [] }), isValidPassword: () => true },
  '@/lib/referral-attribution': { bindReferralCodeToEmail() {}, captureReferralFromUrl: () => null, normalizePlacementSide: () => '', normalizeReferralCode: value => value },
  '@/lib/email-otp-client.mjs': emailOtp,
  './BetterAuthPasswordLogin': { default: () => null },
  '@/lib/referral-sync.mjs': { beginVerifiedReferralSync: () => Promise.resolve({ ok: true }) },
  './better-auth-login.mjs': auth,
  '../register/registration-model.mjs': registration,
  '@/lib/browser-request-deadline.mjs': deadline,
};

test('the real AuthShell retains desktop editorial layout while declaring compact, wrapping mobile landmarks', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('rendering an auth shell cannot query or send an OTP'));
  const AuthShell = compile('./AuthShell.jsx', { 'next/link': { default: link }, 'lucide-react': icons }).default;
  const tree = AuthShell({ activePath: '/login', eyebrow: 'Acceso', title: 'Tu equipo ya está adentro.', description: 'Descripción de marca',
    sideKpis: [{ value: '24/7', label: 'portal' }], children: React.createElement('form', { 'aria-label': 'Acceso seguro' }),
    loginHref: '/login?ref=Sponsor&side=R', registrationHref: '/register?ref=Sponsor&side=R' });
  assert.equal(tree.type, 'main');
  hasClasses(tree, 'min-h-dvh', 'min-w-0', 'lg:grid', 'lg:grid-cols-[minmax(420px,46%)_minmax(0,1fr)]');
  const brand = find(tree, node => node?.type === 'aside');
  hasClasses(brand, 'min-h-36', 'sm:min-h-48', 'p-4', 'lg:sticky', 'lg:top-0', 'lg:h-dvh', 'lg:p-10');
  assert.ok(!classes(brand).has('min-h-[300px]'));
  const heading = find(tree, node => node?.type === 'h1');
  hasClasses(heading, 'break-words', 'text-2xl', 'sm:text-3xl', 'lg:text-6xl');
  const description = find(tree, node => node?.type === 'p' && node.props.children === 'Descripción de marca');
  hasClasses(description, 'hidden', 'lg:block');
  const column = find(tree, node => node?.type === 'section');
  hasClasses(column, 'min-h-0', 'min-w-0', 'lg:min-h-dvh');
  const nav = find(tree, node => node?.type === 'nav');
  assert.equal(nav.props['aria-label'], 'Acceso y registro');
  hasClasses(nav, 'flex-wrap');
  for (const item of React.Children.toArray(nav.props.children)) hasClasses(item, 'min-h-11', 'items-center');
  const content = find(tree, node => classes(node).has('auth-content'));
  hasClasses(content, 'min-w-0', 'px-4', 'py-5', 'lg:items-center', 'lg:px-14');
  hasClasses(content.props.children, 'min-w-0', 'w-full', '[overflow-wrap:anywhere]');
  const html = renderToStaticMarkup(tree);
  assert.match(html, /<main\b/); assert.match(html, /<nav aria-label="Acceso y registro"/);
  assert.match(html, /<form aria-label="Acceso seguro"/);
  assert.match(html, /href="\/login\?ref=Sponsor&amp;side=R" aria-current="page"/);
  assert.match(html, /href="\/register\?ref=Sponsor&amp;side=R"/);
  for (const brandLink of React.Children.toArray(brand.props.children[2].props.children)) hasClasses(brandLink, 'min-h-11');
  // These assertions test semantic markup/Tailwind contracts, not actual pixel
  // geometry. Browser viewport/keyboard and zoom checks remain separate QA.
});

test('mobile auth safe-area and keyboard styles are scoped, preserve zoom and do not hide form overflow', () => {
  const css = postcss.parse(source('../../index.css'));
  const insets = [];
  css.walkDecls(decl => { if (decl.value.includes('safe-area-inset')) insets.push(decl); });
  assert.ok(insets.length >= 4);
  for (const decl of insets) {
    for (const selector of decl.parent.selector.split(',')) assert.match(selector.trim(), /^\.auth-(?:brand-panel|nav|content)$/);
    assert.equal(decl.parent.parent.name, 'media');
    assert.equal(decl.parent.parent.params, '(max-width: 1023px)');
  }
  const authRules = [];
  css.walkRules(rule => { if (rule.selector.includes('.auth-')) authRules.push(rule); });
  assert.ok(authRules.some(rule => rule.nodes.some(node => node.prop === 'scroll-margin-block' && node.value === '1.5rem')));
  assert.ok(authRules.some(rule => rule.nodes.some(node => node.prop === 'touch-action' && node.value === 'manipulation')));
  for (const rule of authRules) {
    if (rule.selector.includes('.auth-grain')) continue; // decorative photo grain is intentionally clipped
    for (const decl of rule.nodes) {
      if (/^overflow(?:-[xy])?$/.test(decl.prop || '')) assert.doesNotMatch(decl.value, /hidden|clip/);
      if (decl.prop === 'touch-action') assert.notEqual(decl.value, 'none');
    }
  }
  const layout = compile('../layout.jsx', { '../index.css': {} });
  assert.equal(layout.viewport.width, 'device-width'); assert.equal(layout.viewport.initialScale, 1);
  assert.notEqual(layout.viewport.userScalable, false); assert.equal(layout.viewport.maximumScale, undefined);
  for (const file of ['./AuthShell.jsx', '../login/page.jsx', '../forgot-password/page.jsx']) {
    assert.doesNotMatch(source(file), /(?:user-scalable\s*=\s*no|maximum-scale\s*=\s*1|touch-action\s*:\s*none)/);
  }
});

test('real login controls declare readable mobile input text and 44-pixel-or-larger touch contracts', () => {
  const { EmailField, PasswordField, CodeField, ModeButton } = compile('../login/MagicLinkLoginForm.jsx', loginMocks,
    'export { EmailField, PasswordField, CodeField, ModeButton };');
  const controls = [
    EmailField({ email: 'member@example.test', setEmail() {}, onClearError() {} }),
    PasswordField({ id: 'password', label: 'Contraseña', value: '', showPassword: false, autoComplete: 'current-password', onChange() {}, onToggle() {} }),
    CodeField({ id: 'otp', label: 'Código', value: '', onChange() {}, codeLength: 6 }),
  ];
  for (const control of controls) {
    const input = find(control, node => node?.type === 'input');
    hasClasses(input, 'text-base', 'min-h-12', 'w-full');
    assert.ok(!classes(input).has('text-sm'));
    assert.match(renderToStaticMarkup(control), /<label[^>]*for=/);
  }
  const email = find(controls[0], node => node?.type === 'input');
  assert.equal(email.props.type, 'email'); assert.equal(email.props.inputMode, 'email');
  assert.equal(email.props.autoCapitalize, 'none'); assert.equal(email.props.autoComplete, 'email');
  hasClasses(find(controls[1], node => node?.type === 'button'), 'h-11', 'w-11');
  hasClasses(ModeButton({ active: true, children: 'Código al correo', onClick() {} }), 'min-h-11');
  const otp = find(controls[2], node => node?.type === 'input');
  assert.equal(otp.props.inputMode, 'numeric'); assert.equal(otp.props.autoComplete, 'one-time-code');
});

test('verified login exposes a prominent native dashboard anchor without a JavaScript click gate or extra code', async t => {
  const email = 'member@example.test', props = { authMode: 'better-auth', initialEmail: email }, paths = [], destinations = [];
  const previous = globalThis.window;
  globalThis.window = { location: { search: '', assign: href => destinations.push(href), replace: href => destinations.push(href) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    if (path === '/api/auth/email-otp/send-verification-otp') return Response.json({ ok: true });
    assert.equal(path, '/api/auth/sign-in/email-otp');
    return Response.json({ ok: true, user: { id: 'synthetic-member', email, emailVerified: true } });
  });
  const harness = registrationViewHarness('../login/MagicLinkLoginForm.jsx', loginMocks);
  t.after(() => harness.unmount());
  const submit = () => find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  await submit();
  find(harness.render(props), node => node?.props?.id === 'login-code').props.onChange('001234');
  await submit();
  const anchor = find(harness.render(props), node => node?.type === 'a' && node.props.href === '/dashboard');
  assert.ok(anchor); hasClasses(anchor, 'min-h-12', 'text-base', 'bg-[var(--vp-accent)]');
  assert.equal(anchor.props.onClick, undefined); assert.equal(anchor.props.target, undefined);
  assert.match(renderToStaticMarkup(anchor), /Continuar al panel/);
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp']);
});

test('login and recovery cards retain desktop padding but allow narrow mobile content to shrink', () => {
  for (const file of ['../login/page.jsx', '../forgot-password/page.jsx']) {
    assert.match(source(file), /className="min-w-0 rounded-xl p-4 sm:p-7"/);
  }
});
