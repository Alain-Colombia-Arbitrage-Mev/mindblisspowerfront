import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as policy from '../../lib/auth-entry-policy.mjs';
import * as otp from '../../lib/email-otp-client.mjs';
import * as auth from './better-auth-login.mjs';
import * as registration from '../register/registration-model.mjs';
import * as contacts from '../register/contact-phone-model.mjs';
import * as sessionRecovery from '../../lib/registration-session-recovery.mjs';
import { translateMessage } from '../../i18n/translate.mjs';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from '../register/registration-view-test-harness.mjs';

const require = createRequire(import.meta.url), email = 'entry-pause-fixture@example.test';
const all = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(all)];
const event = (key = 'Enter') => ({ key, defaultPrevented: false, stopped: false,
  preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; } });
const form = tree => find(tree, node => node?.type === 'form');
const byText = (tree, text) => find(tree, node => (node?.type === 'button' || node?.props?.disabled !== undefined)
  && typeof node?.props?.children === 'string' && node.props.children === text);
function moduleAt(file, mocks) {
  const module = { exports: {} }, code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'),
    { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react/jsx-runtime') return require(id);
    assert.ok(Object.hasOwn(mocks, id), `Unexpected entry dependency: ${id}`); return mocks[id];
  }, module, module.exports);
  return module.exports;
}
function fixture(t, file, { search = '', currentPolicy = policy } = {}) {
  const calls = [], sideEffects = [], values = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search,
    assign: value => sideEffects.push(['assign', value]), replace: value => sideEffects.push(['replace', value]) }, sessionStorage: storage } });
  const previousLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window;
    if (previousLocal) Object.defineProperty(globalThis, 'localStorage', previousLocal); else delete globalThis.localStorage; });
  t.mock.method(globalThis, 'fetch', async (...args) => { calls.push(args); assert.fail('The real paused UI must not dispatch any authentication request'); });
  const notice = moduleAt('../_components/AuthEntryNotice.jsx', { '@/lib/auth-entry-policy.mjs': currentPolicy,
    '@/i18n/LanguageProvider': { useI18n: () => ({ t: key => translateMessage('es', key) }) } }).default;
  const mocks = {
    '@/lib/auth-entry-policy.mjs': currentPolicy, '../_components/AuthEntryNotice': { default: notice },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { useRouter: () => ({ push: value => sideEffects.push(['push', value]) }) },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
    '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, label: '', start: () => sideEffects.push(['cooldown']) }), suggestEmailFix: () => '', isMicrosoftEmail: () => false },
    '@/lib/password': { checkPassword: () => ({ results: [] }), isValidPassword: () => true },
    '@/lib/phone': { composePhone: () => '+573001234567', formatLocalPhone: value => value, isValidE164: () => true },
    '@/lib/referral-attribution': { captureReferralFromUrl: () => null, normalizeReferralCode: value => value || '', normalizePlacementSide: () => '',
      bindReferralCodeToEmail: (...args) => sideEffects.push(['referral', ...args]) },
    '@/lib/referral-sync.mjs': { beginVerifiedReferralSync: async (...args) => sideEffects.push(['capture', ...args]) },
    '@/lib/member-session-sync.mjs': { publishMemberSessionReplacement: () => sideEffects.push(['session-replacement']) },
    '@/lib/wallet-setup-handoff.mjs': { rememberWalletSetupAfterAuth: () => sideEffects.push(['wallet-setup']) },
    '@/lib/email-otp-client.mjs': otp, './better-auth-login.mjs': auth, '../register/registration-model.mjs': registration,
    './registration-model.mjs': registration, './contact-phone-model.mjs': contacts, '@/lib/registration-session-recovery.mjs': sessionRecovery,
    './RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub },
    '../register/RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub,
      RegistrationPassword: ({ visible: _visible, onToggle: _onToggle, ...props }) => registrationFieldStub(props) },
    './ContactPhoneField': { default: () => null }, './BetterAuthPasswordLogin': { default: () => null }, './SocialLoginButtons': { default: () => null },
    './SocialProviderIcon': { AppleIcon: () => null, GoogleIcon: () => null },
  };
  const h = registrationViewHarness(file, mocks); t.after(() => h.unmount());
  return { ...h, calls, sideEffects };
}
async function assertSubmitBlocked(tree) {
  const target = form(tree), keyboard = event(); assert.ok(target, 'The existing form and fields remain visible');
  target.props.onKeyDown(keyboard); assert.equal(keyboard.defaultPrevented, true); assert.equal(keyboard.stopped, true);
  const submission = event(); await target.props.onSubmit(submission); assert.equal(submission.defaultPrevented, true);
  assert.equal(submission.stopped, true, 'Direct onSubmit/requestSubmit is guarded independently of the disabled button');
}

test('OTP sign-in keeps its input but disables sending and blocks Enter/direct submission under the actual pause policy', async t => {
  for (const authMode of ['better-auth', 'cognito']) {
    const h = fixture(t, '../login/MagicLinkLoginForm.jsx');
    const tree = h.render({ authMode, initialEmail: email });
    assert.equal(byText(tree, 'Enviar código').props.disabled, true); await assertSubmitBlocked(tree);
    const create = byText(tree, 'Crear cuenta nueva'); assert.equal(create.props.disabled, true); create.props.onClick(event());
    const html = renderToStaticMarkup(tree); assert.match(html, /type="email"/); assert.match(html, /temporalmente no disponibles/);
    assert.doesNotMatch(html, /href="\/register/); if (authMode === 'better-auth') assert.match(html, /href="\/forgot-password/);
    assert.equal(h.calls.length, 0); assert.deepEqual(h.sideEffects, []);
  }
});

test('valid OTP confirmation and manual resend cannot sign in, generate another code or navigate while paused', async t => {
  for (const authMode of ['better-auth', 'cognito']) {
    const h = fixture(t, '../login/MagicLinkLoginForm.jsx'); h.render({ authMode, initialEmail: email });
    h.state[1] = 'confirm'; h.state[7] = '123456'; h.state[8] = email;
    const tree = h.render({ authMode, initialEmail: email }); await assertSubmitBlocked(tree);
    const resend = byText(tree, 'Reenviar'); assert.equal(resend.props.disabled, true); await resend.props.onClick(event());
    assert.equal(h.calls.length, 0); assert.deepEqual(h.sideEffects, []);
  }
});

test('native and legacy password entry cannot use Enter or a forced submit; recovery links remain available', async t => {
  const h = fixture(t, '../login/BetterAuthPasswordLogin.jsx'), effects = [];
  const props = { email, setEmail() {}, onBusy: value => effects.push(value), onError: value => effects.push(value),
    onNotice: value => effects.push(value), onVerified: value => effects.push(value), rememberReferral: value => effects.push(value) };
  let tree = h.render(props); find(tree, node => node?.props?.id === 'password-login-password').props.onChange({ target: { value: 'Synthetic Password 1!' } });
  tree = h.render(props); effects.length = 0; assert.equal(byText(tree, 'Iniciar sesión').props.disabled, true); await assertSubmitBlocked(tree);
  assert.ok(all(tree).some(node => node?.props?.href === '/forgot-password')); assert.equal(h.calls.length, 0); assert.deepEqual(effects, []);
  const legacy = fixture(t, '../login/MagicLinkLoginForm.jsx'); legacy.render({ authMode: 'cognito', initialEmail: email, initialMode: 'password' });
  legacy.state[5] = 'Synthetic Password 1!'; tree = legacy.render({ authMode: 'cognito', initialEmail: email, initialMode: 'password' });
  assert.equal(byText(tree, 'Iniciar sesión').props.disabled, true); await assertSubmitBlocked(tree); assert.equal(legacy.calls.length, 0);
});

test('explicitly enabled social providers stay disabled and their captured click handlers cannot dispatch OAuth', async t => {
  const h = fixture(t, '../login/SocialLoginButtons.jsx'), tree = h.render({ enabledProviders: ['google', 'apple'] });
  const buttons = all(tree).filter(node => node?.type === 'button'); assert.equal(buttons.length, 2);
  for (const button of buttons) { assert.equal(button.props.disabled, true); await button.props.onClick(); }
  assert.equal(h.calls.length, 0); assert.deepEqual(h.sideEffects, []);
});

test('registration retains editable details but blocks account creation and verification shortcuts before any request', async t => {
  const h = fixture(t, './BetterAuthRegisterForm.jsx'), props = { initialSearch: `email=${encodeURIComponent(email)}` };
  let tree = h.render(props);
  for (const [id, value] of [['fullName', 'Synthetic Member'], ['acceptsPrivacy', true]]) {
    find(tree, node => node?.props?.id === id).props.onChange({ target: { value, checked: value } }); tree = h.render(props);
  }
  assert.equal(find(tree, node => node?.props?.id === 'fullName').props.disabled, false);
  assert.equal(byText(tree, 'Crear cuenta y verificar correo').props.disabled, true); await assertSubmitBlocked(tree);
  const shortcut = byText(tree, 'Ya solicité mi registro: verificar correo'); assert.equal(shortcut.props.disabled, true); shortcut.props.onClick(event());
  assert.equal(find(h.render(props), node => node?.props?.id === 'code'), undefined);
  assert.equal(h.calls.length, 0); assert.deepEqual(h.sideEffects, []);
});

test('a resumed registration with a complete six-digit code cannot verify or resend and never auto-recovers a session', async t => {
  const h = fixture(t, './BetterAuthRegisterForm.jsx'), props = { initialSearch: `resume=1&email=${encodeURIComponent(email)}` };
  let tree = h.render(props); find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '123456' } }); tree = h.render(props);
  assert.equal(byText(tree, 'Verificar correo').props.disabled, true); await assertSubmitBlocked(tree);
  const resend = byText(tree, 'Solicitar otro código'); assert.equal(resend.props.disabled, true); await resend.props.onClick();
  h.replayEffects(); assert.equal(h.calls.length, 0); assert.deepEqual(h.sideEffects, []);
});

test('legacy registration resume parameters do not auto-send, and both registration steps reject forced submissions', async t => {
  const h = fixture(t, './RegisterForm.jsx', { search: `?resume=1&email=${encodeURIComponent(email)}` });
  let tree = h.render(); h.replayEffects(); tree = h.render(); assert.equal(h.calls.length, 0);
  h.state[0] = { ...h.state[0], fullName: 'Synthetic Member', email, password: 'Synthetic Password 1!', confirmPassword: 'Synthetic Password 1!', phone: '3001234567', acceptsPrivacy: true };
  tree = h.render(); assert.equal(find(tree, node => node?.type === 'button' && node.props.type === 'submit').props.disabled, true); await assertSubmitBlocked(tree);
  h.state[5] = true; h.state[6] = '123456'; tree = h.render(); await assertSubmitBlocked(tree);
  const resend = byText(tree, 'Reenviar código'); assert.equal(resend.props.disabled, true); await resend.props.onClick();
  assert.equal(h.calls.length, 0); assert.deepEqual(h.sideEffects, []);
});

test('entry links are hidden rather than redirecting around the pause, while the translated notice and recovery remain', () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const translations = { useI18n: () => ({ t: key => translateMessage(locale, key) }) };
    const common = { '@/lib/auth-entry-policy.mjs': policy, '@/i18n/LanguageProvider': translations,
      'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) } };
    const Notice = moduleAt('../_components/AuthEntryNotice.jsx', common).default;
    const Links = moduleAt('./LoginLocalizedCopy.jsx', common).LoginAccountLinks;
    const notice = renderToStaticMarkup(React.createElement(Notice)); assert.ok(notice.includes(translateMessage(locale, 'authEntry.unavailable')));
    const links = renderToStaticMarkup(React.createElement(Links, { registrationHref: '/register?ref=SYNTHETIC', emailOtpOnly: true }));
    assert.doesNotMatch(links, /\/register/); assert.match(links, /\/forgot-password/);
  }
});

test('the independent password recovery form stays usable without enabling a password sign-in action', async t => {
  const h = fixture(t, '../login/MagicLinkLoginForm.jsx'), props = { authMode: 'cognito', initialEmail: email, initialMode: 'reset' };
  const tree = h.render(props); assert.equal(form(tree).props.onKeyDown, undefined);
  assert.equal(byText(tree, 'Enviar código').props.disabled, false);
  assert.equal(h.calls.length, 0, 'Recovery still waits for its explicit action');
});

test('a password response that arrives after the UI pause cannot publish verification, referral or navigation callbacks', async t => {
  let paused = false, resolve;
  const currentPolicy = { authEntryAllowed: () => !paused, suppressAuthEntry: value => paused ? policy.suppressAuthEntry(value) : false };
  const h = fixture(t, '../login/BetterAuthPasswordLogin.jsx', { currentPolicy }), effects = [], calls = [];
  t.mock.method(globalThis, 'fetch', (...args) => { calls.push(args); return new Promise(done => { resolve = done; }); });
  const props = { email, setEmail() {}, onBusy() {}, onError() {}, onNotice() {}, onVerified: value => effects.push(['verified', value]),
    rememberReferral: value => effects.push(['referral', value]) };
  let tree = h.render(props); find(tree, node => node?.props?.id === 'password-login-password').props.onChange({ target: { value: 'Synthetic Password 1!' } });
  tree = h.render(props); const pending = form(tree).props.onSubmit(event()); assert.equal(calls.length, 1);
  paused = true; resolve(Response.json({ ok: true, user: { id: 'synthetic', email, emailVerified: true } })); await pending;
  assert.deepEqual(effects, []); assert.deepEqual(h.sideEffects, []); assert.equal(calls.length, 1);
});

test('a registration confirmation arriving after the pause cannot recover, capture attribution or start a new session handoff', async t => {
  let paused = false, resolve;
  const currentPolicy = { authEntryAllowed: () => !paused, suppressAuthEntry: value => paused ? policy.suppressAuthEntry(value) : false };
  const h = fixture(t, './BetterAuthRegisterForm.jsx', { currentPolicy }), calls = [];
  t.mock.method(globalThis, 'fetch', (...args) => { calls.push(args); return new Promise(done => { resolve = done; }); });
  const props = { initialSearch: `resume=1&email=${encodeURIComponent(email)}` };
  let tree = h.render(props); find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '123456' } }); tree = h.render(props);
  const pending = form(tree).props.onSubmit(event()); assert.equal(calls.length, 1);
  paused = true; resolve(Response.json({ ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true, subject: 'synthetic' })); await pending;
  assert.deepEqual(h.sideEffects, []); assert.equal(calls.length, 1);
});

test('an OAuth URL received after pausing is not followed even if the original social click was accepted', async t => {
  let paused = false, resolve;
  const currentPolicy = { authEntryAllowed: () => !paused };
  const h = fixture(t, '../login/SocialLoginButtons.jsx', { currentPolicy }), calls = [];
  t.mock.method(globalThis, 'fetch', (...args) => { calls.push(args); return new Promise(done => { resolve = done; }); });
  const tree = h.render({ enabledProviders: ['google'] });
  const pending = find(tree, node => node?.type === 'button').props.onClick(); assert.equal(calls.length, 1);
  paused = true; resolve(Response.json({ url: 'https://accounts.google.com/o/oauth2/v2/auth?state=synthetic' })); await pending;
  assert.deepEqual(h.sideEffects, []); assert.equal(calls.length, 1);
});
