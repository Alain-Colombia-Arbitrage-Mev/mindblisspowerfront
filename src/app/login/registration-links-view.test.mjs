import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from '../register/registration-view-test-harness.mjs';
import * as registration from '../register/registration-model.mjs';
import * as emailOtp from '../../lib/email-otp-client.mjs';
import * as auth from './better-auth-login.mjs';

const icons = new Proxy({}, { get: () => () => null });
const passwordView = () => null;
function magicView() {
  return registrationViewHarness('../login/MagicLinkLoginForm.jsx', {
    'lucide-react': icons,
    '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, label: '', start() {} }), isMicrosoftEmail: () => false, suggestEmailFix: () => '' },
    '@/lib/password': { checkPassword: () => ({ results: [] }), isValidPassword: () => true },
    '@/lib/referral-attribution': { bindReferralToEmail() {}, captureReferralFromUrl: () => null,
      normalizePlacementSide: side => ['L', 'R'].includes(side) ? side : '', normalizeReferralCode: value => value },
    '@/lib/email-otp-client.mjs': emailOtp,
    './BetterAuthPasswordLogin': { default: passwordView },
    './better-auth-login.mjs': auth,
    '../register/registration-model.mjs': registration,
  });
}
function browser(t) {
  const previous = globalThis.window;
  const destinations = [];
  globalThis.window = { location: { search: '', assign: href => destinations.push(href) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  return destinations;
}

test('every login visitor gets an explicit registration path without an account-existence lookup and without losing referral side', t => {
  const destinations = browser(t);
  t.mock.method(globalThis, 'fetch', () => assert.fail('render or registration link must not query an account'));
  for (const authMode of ['better-auth', 'cognito']) {
    const harness = magicView();
    const tree = harness.render({ authMode, initialEmail: ' MEMBER@EXAMPLE.TEST ', initialRef: 'MP-REFERRED', initialSide: 'R' });
    assert.match(renderToStaticMarkup(tree), /Crear cuenta nueva/);
    find(tree, node => node?.props?.children === 'Crear cuenta nueva').props.onClick();
    assert.equal(destinations.at(-1), '/register?email=member%40example.test&ref=MP-REFERRED&side=R');
    harness.unmount();
  }
});

test('Better Auth password verification receives a safe registration continuation with the same referral hints', t => {
  browser(t);
  const harness = magicView();
  const tree = harness.render({ authMode: 'better-auth', initialMode: 'password', initialEmail: 'member@example.test', initialRef: 'MP-REFERRED', initialSide: 'L' });
  const password = find(tree, node => node?.type === passwordView);
  assert.equal(password.props.registrationHref, '/register?email=member%40example.test&ref=MP-REFERRED&side=L&resume=1');
  harness.unmount();
});

test('login offers email registration without phone validation or SMS sign-in', t => {
  const destinations = browser(t);
  const harness = magicView();
  const tree = harness.render({ authMode: 'better-auth', initialEmail: 'member@example.test', initialRef: 'MP-REFERRED', initialSide: 'R' });
  const button = find(tree, node => node?.props?.children === 'Crear cuenta nueva');
  button.props.onClick();
  assert.equal(destinations[0], '/register?email=member%40example.test&ref=MP-REFERRED&side=R');
  assert.doesNotMatch(renderToStaticMarkup(tree), /SMS|validar teléfono/);
  harness.unmount();
});

test('both login providers keep SMS sending unavailable even when their help fallback is visible', t => {
  browser(t);
  for (const authMode of ['better-auth', 'cognito']) {
    const harness = magicView();
    harness.render({ authMode });
    harness.state[13] = true;
    const html = renderToStaticMarkup(harness.render({ authMode }));
    assert.doesNotMatch(html, /Recíbelo por SMS|Enviar.*SMS|SMS disponible/);
    harness.unmount();
  }
});

test('the real password form preserves the supplied safe continuation after EMAIL_NOT_VERIFIED', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 'EMAIL_NOT_VERIFIED' }, { status: 403 }));
  const harness = registrationViewHarness('../login/BetterAuthPasswordLogin.jsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    '../register/RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub,
      RegistrationPassword: ({ visible, onToggle, ...props }) => registrationFieldStub(props) },
    './better-auth-login.mjs': auth, '../register/registration-model.mjs': registration,
  });
  const props = { email: 'member@example.test', setEmail() {}, onBusy() {}, onError() {}, onNotice() {}, rememberReferral() {},
    registrationHref: '/register?email=member%40example.test&ref=MP-REFERRED&side=R&resume=1' };
  harness.render(props);
  harness.state[0] = 'Synthetic Existing Password';
  const tree = harness.render(props);
  await find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.match(renderToStaticMarkup(harness.render(props)), /href="\/register\?email=member%40example.test&amp;ref=MP-REFERRED&amp;side=R&amp;resume=1"/);
});

test('real email-login send and explicit resend handlers get 30 seconds but verification keeps its 12-second deadline', async t => {
  browser(t);
  const deadlines = [], paths = [];
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, 'timeout', milliseconds => { deadlines.push(milliseconds); return timeout(milliseconds); });
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return path.endsWith('/send-verification-otp') ? Response.json({ ok: true })
      : Response.json({ error: 'authentication_failed' }, { status: 401 });
  });
  const harness = magicView(), props = { authMode: 'better-auth', initialEmail: 'member@example.test' };
  let tree = harness.render(props);
  await find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = harness.render(props);
  await find(tree, node => node?.props?.children === 'Reenviar').props.onClick({ preventDefault() {} });
  tree = harness.render(props);
  find(tree, node => node?.props?.id === 'login-code').props.onChange('001234');
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(deadlines, [30000, 30000, 12000]);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp']);
  harness.unmount();
});
