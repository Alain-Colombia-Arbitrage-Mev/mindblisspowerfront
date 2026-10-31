import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from '../register/registration-view-test-harness.mjs';
import * as registration from '../register/registration-model.mjs';
import * as emailOtp from '../../lib/email-otp-client.mjs';
import { authSuccess } from '../../lib/auth-response.mjs';
import * as auth from './better-auth-login.mjs';

const email = 'member@example.test';
const props = { authMode: 'better-auth', initialEmail: email };
const proof = () => authSuccess('sign-in/email-otp', { token: 'synthetic-private-token', user: { id: 'synthetic-member', email, emailVerified: true } });
const submit = tree => find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
const html = harness => renderToStaticMarkup(harness.render(props));
function browser(t) {
  const previous = globalThis.window, destinations = [];
  globalThis.window = { location: { search: '?verified=true&registered=1', assign: href => destinations.push(href) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  return destinations;
}
function view() {
  return registrationViewHarness('../login/MagicLinkLoginForm.jsx', {
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, label: '', start() {} }), isMicrosoftEmail: () => false, suggestEmailFix: () => '' },
    '@/lib/password': { checkPassword: () => ({ results: [] }), isValidPassword: () => true },
    '@/lib/referral-attribution': { bindReferralToEmail() {}, captureReferralFromUrl: () => null, normalizePlacementSide: () => '', normalizeReferralCode: value => value },
    '@/lib/email-otp-client.mjs': emailOtp, './BetterAuthPasswordLogin': { default: () => null },
    './better-auth-login.mjs': auth, '../register/registration-model.mjs': registration,
  });
}
async function enterCode(harness) {
  await submit(harness.render(props));
  find(harness.render(props), node => node?.props?.id === 'login-code').props.onChange('001234');
  return submit(harness.render(props));
}

test('accepted OTP displays durable accessible email confirmation before any user-initiated navigation', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
      : path === '/api/auth/session' ? { authenticated: true, mode: 'better-auth', email } : proof());
  });
  const harness = view();
  assert.doesNotMatch(html(harness), /Correo verificado correctamente/);
  await enterCode(harness);
  for (let render = 0; render < 3; render++) {
    const rendered = html(harness);
    assert.match(rendered, /Correo verificado correctamente/);
    assert.match(rendered, /role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    assert.match(rendered, /member@example\.test/);
    assert.match(rendered, /Continuar al panel/);
    assert.doesNotMatch(rendered, /id="login-code"|Reenviar|Enviar código/);
    assert.deepEqual(destinations, []);
  }
  assert.equal(paths.length, 3, 'rerendering never resends or rechecks automatically');
  await find(harness.render(props), node => node?.props?.children === 'Continuar al panel').props.onClick();
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp', '/api/auth/session']);
  harness.unmount();
});

test('verified email remains distinct from legacy approval and a manual access review sends no code', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
      : path === '/api/auth/session' ? { authenticated: false, mode: 'better-auth', state: 'claim_required' } : proof());
  });
  const harness = view(); await enterCode(harness);
  assert.match(html(harness), /Correo verificado correctamente/);
  assert.match(html(harness), /revisión de identidad y aprobación de vinculación/);
  assert.match(html(harness), /no aprueba automáticamente/);
  assert.doesNotMatch(html(harness), /Continuar al panel/);
  await find(harness.render(props), node => node?.props?.children === 'Revisar acceso').props.onClick();
  assert.equal(paths.filter(path => path.includes('send-verification')).length, 1);
  assert.equal(paths.filter(path => path === '/api/auth/sign-in/email-otp').length, 1);
  assert.deepEqual(destinations, []);
  const count = paths.length;
  find(harness.render(props), node => node?.props?.children === 'Usar otro correo').props.onClick();
  assert.doesNotMatch(html(harness), /Correo verificado correctamente/);
  assert.equal(paths.length, count, 'changing the local form does not send an email or log out');
  assert.ok(find(harness.render(props), node => node?.type === 'form'));
  harness.unmount();
});

test('a failed network-authorization check cannot erase proven email ownership or approve network access', async t => {
  const destinations = browser(t);
  t.mock.method(globalThis, 'fetch', async path => path === '/api/auth/session'
    ? Response.json({ error: 'unavailable' }, { status: 503 })
    : Response.json(path.endsWith('/send-verification-otp') ? { ok: true } : proof()));
  const harness = view(); await enterCode(harness);
  assert.match(html(harness), /Correo verificado correctamente/);
  assert.match(html(harness), /servicio de autorización no está disponible/);
  assert.match(html(harness), /Revisar acceso/);
  assert.doesNotMatch(html(harness), /Continuar al panel/);
  assert.deepEqual(destinations, []);
  harness.unmount();
});

test('send acknowledgements, rejected OTPs and malformed or mismatched proof never display verified success', async t => {
  const destinations = browser(t);
  for (const [status, body] of [[400, proof()], [429, proof()], [503, proof()], [200, { ok: true }],
    [200, { ...proof(), user: { ...proof().user, emailVerified: false } }],
    [200, { ...proof(), user: { ...proof().user, email: 'other@example.test' } }]]) {
    const paths = [];
    t.mock.method(globalThis, 'fetch', async path => {
      paths.push(path);
      return path.endsWith('/send-verification-otp') ? Response.json({ ok: true }) : Response.json(body, { status });
    });
    const harness = view(); await enterCode(harness);
    assert.doesNotMatch(html(harness), /Correo verificado correctamente|Continuar al panel/);
    assert.equal(paths.includes('/api/auth/session'), false, 'untrusted sign-in cannot query or install network authority');
    harness.unmount();
  }
  assert.deepEqual(destinations, []);
});

test('password login uses the same verified confirmation contract without an immediate redirect or email send', async t => {
  const destinations = browser(t), verified = [], paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path === '/api/auth/session' ? { authenticated: true, mode: 'better-auth', email } : proof());
  });
  const harness = registrationViewHarness('../login/BetterAuthPasswordLogin.jsx', {
    'next/link': { default: ({ children, ...attributes }) => React.createElement('a', attributes, children) },
    '../register/RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub,
      RegistrationPassword: ({ visible: _visible, onToggle: _onToggle, ...attributes }) => registrationFieldStub(attributes) },
    './better-auth-login.mjs': auth, '../register/registration-model.mjs': registration,
  });
  const passwordProps = { email, setEmail() {}, onBusy() {}, onError() {}, onNotice() {}, rememberReferral() {},
    onVerified: (recipient, access) => verified.push({ recipient, access }) };
  harness.render(passwordProps); harness.state[0] = 'Synthetic Existing Password';
  await submit(harness.render(passwordProps));
  assert.deepEqual(verified, [{ recipient: email, access: { ready: false, checking: true } }, { recipient: email, access: { ready: true } }]);
  assert.deepEqual(paths, ['/api/auth/sign-in/email', '/api/auth/session']);
  assert.equal(harness.state[0], '');
  assert.deepEqual(destinations, []);
});

test('an old canonical cookie for another email never makes the newly verified account ready', async t => {
  const destinations = browser(t);
  t.mock.method(globalThis, 'fetch', async path => Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
    : path === '/api/auth/session' ? { authenticated: true, mode: 'better-auth', email: 'previous@example.test' } : proof()));
  const harness = view(); await enterCode(harness);
  assert.match(html(harness), /Correo verificado correctamente/);
  assert.match(html(harness), /La sesión actual no corresponde al correo verificado/);
  assert.doesNotMatch(html(harness), /Continuar al panel|previous@example\.test/);
  assert.deepEqual(destinations, []);
  harness.unmount();
});
