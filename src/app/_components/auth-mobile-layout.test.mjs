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
  './SocialLoginButtons': { default: () => null },
  '@/lib/referral-sync.mjs': { beginVerifiedReferralSync: () => Promise.resolve({ ok: true }) },
  './better-auth-login.mjs': auth,
  '../register/registration-model.mjs': registration,
  '@/lib/browser-request-deadline.mjs': deadline,
};

test('the real AuthShell renders the approved identity card and compact access landmarks', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('rendering an auth shell cannot query or send an OTP'));
  const AuthShell = compile('./AuthShell.jsx', { 'next/link': { default: link }, 'lucide-react': icons, './ThemeToggle': { default: () => null }, './AuthSupportWidget': { default: () => React.createElement('button', null, '¿Necesitas ayuda?') },
    '@/i18n/LanguageSwitcher': { default: () => null }, './AuthLocalizedContent': {
      AuthIdentityCopy: ({ title, description }) => React.createElement('div', null, React.createElement('h1', null, title), React.createElement('p', null, description)),
      AuthLegal: () => null,
    } }).default;
  const tree = AuthShell({ activePath: '/login', eyebrow: 'Acceso', title: 'Tu equipo ya está adentro.', description: 'Descripción de marca',
    sideKpis: [{ value: '24/7', label: 'portal' }], children: React.createElement('form', { 'aria-label': 'Acceso seguro' }),
    loginHref: '/login?ref=Sponsor&side=R', registrationHref: '/register?ref=Sponsor&side=R' });
  assert.equal(tree.type, 'main'); hasClasses(tree, 'auth-shell');
  const brand = find(tree, node => node?.type === 'aside');
  hasClasses(brand, 'auth-identity');
  const localizedIdentity = find(tree, node => node?.props?.title === 'Tu equipo ya está adentro.');
  assert.equal(localizedIdentity.props.description, 'Descripción de marca');
  const column = find(tree, node => node?.type === 'section');
  hasClasses(column, 'auth-access-area');
  const content = find(tree, node => classes(node).has('auth-content'));
  assert.ok(content);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /<main\b/); assert.match(html, /auth-identity/);
  assert.match(html, /<form aria-label="Acceso seguro"/);
  assert.match(html, /loading="eager" decoding="async"/);
  assert.match(html, /¿Necesitas ayuda\?/);
});

test('mobile auth safe-area and keyboard styles are scoped, preserve zoom and do not hide form overflow', () => {
  const css = postcss.parse(source('../../index.css'));
  const insets = [];
  css.walkDecls(decl => { if (decl.value.includes('safe-area-inset')) insets.push(decl); });
  assert.ok(insets.length >= 4);
  for (const decl of insets) {
    for (const selector of decl.parent.selector.split(',')) assert.match(selector.trim(), /^(?:(?:\.auth-shell--long )?\.auth-(?:wordmark|identity-copy|access-tools|content|legal)|\.auth-shell \.vp-support-launcher)$/);
    assert.equal(decl.parent.parent.name, 'media');
    assert.ok(['(max-width: 719px)', '(max-width: 380px)'].includes(decl.parent.parent.params));
  }
  const authRules = [];
  css.walkRules(rule => { if (rule.selector.includes('.auth-')) authRules.push(rule); });
  assert.ok(authRules.some(rule => rule.nodes.some(node => node.prop === 'scroll-margin-block' && node.value === '1.5rem')));
  assert.ok(authRules.some(rule => rule.nodes.some(node => node.prop === 'touch-action' && node.value === 'manipulation')));
  for (const rule of authRules) {
    if (/\.auth-(?:shell|identity|password-form)/.test(rule.selector)) continue;
    for (const decl of rule.nodes) {
      if (/^overflow(?:-[xy])?$/.test(decl.prop || '')) assert.doesNotMatch(decl.value, /hidden|clip/);
      if (decl.prop === 'touch-action') assert.notEqual(decl.value, 'none');
    }
  }
  const layout = compile('../layout.jsx', { '../index.css': {}, '@/i18n/LanguageProvider': { LanguageProvider: ({ children }) => children } });
  assert.equal(layout.viewport.width, 'device-width'); assert.equal(layout.viewport.initialScale, 1);
  assert.notEqual(layout.viewport.userScalable, false); assert.equal(layout.viewport.maximumScale, undefined);
  for (const file of ['./AuthShell.jsx', '../login/page.jsx', '../forgot-password/page.jsx']) {
    assert.doesNotMatch(source(file), /(?:user-scalable\s*=\s*no|maximum-scale\s*=\s*1|touch-action\s*:\s*none)/);
  }
});

test('tablet login keeps the identity column proportioned and centers its message', () => {
  const css = postcss.parse(source('../../index.css'));
  const tablet = css.nodes.find(node => node.type === 'atrule' && node.name === 'media'
    && node.params === '(min-width: 720px) and (max-width: 980px)');
  assert.ok(tablet, 'Missing tablet auth layout');
  const declarations = selector => Object.fromEntries(tablet.nodes
    .find(node => node.type === 'rule' && node.selector === selector)
    .nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
  const shell = declarations('.auth-shell');
  assert.match(shell['grid-template-columns'], /clamp\(280px, 36vw, 360px\)/);
  assert.equal(declarations('.auth-shell:not(.auth-shell--long)')['align-items'], 'start');
  const identity = declarations('.auth-shell:not(.auth-shell--long) .auth-identity');
  assert.equal(identity['aspect-ratio'], '3 / 5');
  assert.match(identity['max-height'], /620px/);
  assert.equal(identity.position, 'sticky');
  assert.equal(identity.top, '50dvh');
  assert.equal(identity['align-self'], 'start');
  assert.equal(identity.transform, 'translateY(-50%)');
  const copy = declarations('.auth-shell:not(.auth-shell--long) .auth-identity-copy');
  assert.equal(copy.top, '50%');
  assert.equal(copy.transform, 'translateY(-50%)');
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

test('shared registration and recovery password icons stay centered inside their inputs without fixed offsets', () => {
  const { RegistrationPassword } = compile('../register/RegistrationFields.jsx', {
    'lucide-react': icons,
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
  });
  const control = RegistrationPassword({ id: 'shared-password', label: 'Contraseña', visible: false,
    onToggle() {}, name: 'password', value: '', onChange() {} });
  const rendered = control.type(control.props);
  const input = find(rendered, node => node?.type === 'input');
  const button = find(rendered, node => node?.type === 'button');
  hasClasses(input, 'pe-14');
  hasClasses(button, 'absolute', 'inset-y-0', 'end-1', 'my-auto', 'h-11', 'w-11', 'items-center', 'justify-center');
  assert.equal(button.props['aria-label'], 'Mostrar contraseña');
  assert.equal(button.props['aria-pressed'], false);
  assert.doesNotMatch(source('../../index.css'), /auth-password-form\s*>\s*div:nth-of-type\(2\)[^{]*\{[^}]*top:/s);
});

test('verified login exposes a prominent native dashboard anchor without a JavaScript click gate or extra code', async t => {
  const email = 'member@example.test', props = { authMode: 'better-auth', initialEmail: email }, paths = [], destinations = [];
  const previous = globalThis.window;
  globalThis.window = { location: { search: '', assign: href => destinations.push(href), replace: href => destinations.push(href) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    if (path === '/api/auth/email-otp/send-verification-otp') return Response.json({ ok: true });
    if (path === '/api/auth/session?view=access') return Response.json({ authenticated: true, mode: 'better-auth', email });
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
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp', '/api/auth/session?view=access']);
});

test('auth flows use shared layout variants and avoid a nested recovery card', () => {
  assert.match(source('../login/page.jsx'), /className="auth-login-form"/);
  assert.match(source('../forgot-password/page.jsx'), /layout="compact"/);
  assert.match(source('../forgot-password/page.jsx'), /className="auth-recovery-form"/);
  assert.doesNotMatch(source('../forgot-password/page.jsx'), /rounded-xl p-4 sm:p-7/);
  assert.match(source('../register/RegisterForm.jsx'), /layout="long"/);
  assert.match(source('../register/BetterAuthRegisterForm.jsx'), /layout="long"/);
});
