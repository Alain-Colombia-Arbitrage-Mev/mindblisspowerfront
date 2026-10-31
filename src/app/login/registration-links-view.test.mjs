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
function magicView(cooldown = () => ({ active: false, label: '', start() {} })) {
  return registrationViewHarness('../login/MagicLinkLoginForm.jsx', {
    'lucide-react': icons,
    '@/lib/useResendCooldown': { useResendCooldown: cooldown, isMicrosoftEmail: () => false, suggestEmailFix: () => '' },
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
      RegistrationPassword: ({ visible: _visible, onToggle: _onToggle, ...props }) => registrationFieldStub(props) },
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

test('ambiguous send failures keep a bound code-entry step with a safe cooldown and never retry or claim delivery', async t => {
  const destinations = browser(t);
  for (const response of [Response.json({ error: 'authentication_unavailable', email: 'other@example.test' }, { status: 503 }),
    Response.json({ error: 'upstream_unavailable' }, { status: 502 }), Response.json({}),
    new Response('not-json', { status: 200 })]) {
    let calls = 0, seconds = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return response; });
    const harness = magicView(() => ({ active: seconds > 0, label: `Reenviar en ${seconds}`, start(value) { seconds = value; } }));
    const props = { authMode: 'better-auth', initialEmail: ' MEMBER@EXAMPLE.TEST ' };
    await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
    const tree = harness.render(props), html = renderToStaticMarkup(tree);
    assert.ok(find(tree, node => node?.props?.id === 'login-code'));
    assert.match(html, /member@example\.test/);
    assert.doesNotMatch(html, /other@example\.test|Si tu cuenta está habilitada|Te enviamos|Código aceptado/);
    assert.match(html, /No pudimos confirmar el envío/);
    assert.equal(seconds, 300);
    assert.equal(calls, 1);
    await find(tree, node => node?.props?.children === `Reenviar en ${seconds}`).props.onClick({ preventDefault() {} });
    assert.equal(calls, 1, 'even a programmatic resend cannot bypass the cooldown');
    harness.unmount();
  }
  assert.deepEqual(destinations, []);
});

test('timeout recovery does not lose a possibly delivered code or start an automatic second send', async t => {
  browser(t);
  let calls = 0, seconds = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new DOMException('synthetic timeout', 'TimeoutError'); });
  const harness = magicView(() => ({ active: seconds > 0, label: '', start(value) { seconds = value; } }));
  const props = { authMode: 'better-auth', initialEmail: 'member@example.test' };
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  const html = renderToStaticMarkup(harness.render(props));
  assert.match(html, /Código de acceso/);
  assert.match(html, /Si recibes un código, introdúcelo aquí/);
  assert.match(html, /No enviaremos otro automáticamente/);
  assert.equal(calls, 1); assert.equal(seconds, 300);
  harness.unmount();
});

test('HTTP 429 keeps existing code entry available without shortening its safe resend wait', async t => {
  browser(t);
  let seconds = 0, calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ error: 'authentication_failed' }, { status: 429, headers: { 'retry-after': '83' } }); });
  const harness = magicView(() => ({ active: seconds > 0, label: '', start(value) { seconds = value; } }));
  const props = { authMode: 'better-auth', initialEmail: 'member@example.test' };
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  const tree = harness.render(props);
  assert.ok(find(tree, node => node?.props?.id === 'login-code'));
  assert.match(renderToStaticMarkup(tree), /Demasiados intentos/);
  assert.equal(seconds, 300); assert.equal(calls, 1);
  harness.unmount();
});

test('definite invalid/origin rejections never claim an accepted send or switch into ambiguous recovery', async t => {
  browser(t);
  for (const status of [400, 401, 403]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'private-details' }, { status }));
    const harness = magicView(), props = { authMode: 'better-auth', initialEmail: 'member@example.test' };
    await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
    const tree = harness.render(props);
    assert.equal(find(tree, node => node?.props?.id === 'login-code'), undefined);
    assert.doesNotMatch(renderToStaticMarkup(tree), /private-details|Si tu cuenta está habilitada/);
    harness.unmount();
  }
});

test('double Enter makes only one send and retries stay bound to the original recipient despite an edited hidden state', async t => {
  const destinations = browser(t), calls = [];
  let resolveFirst;
  t.mock.method(globalThis, 'fetch', (path, init) => {
    calls.push({ path, body: JSON.parse(init.body) });
    return calls.length === 1 ? new Promise(resolve => { resolveFirst = resolve; })
      : Promise.resolve(Response.json({ error: 'authentication_failed' }, { status: 401 }));
  });
  const harness = magicView(), props = { authMode: 'better-auth', initialEmail: 'member@example.test' };
  const tree = harness.render(props), submit = find(tree, node => node?.type === 'form').props.onSubmit;
  const pending = submit({ preventDefault() {} });
  await submit({ preventDefault() {} });
  assert.equal(calls.length, 1);
  const busy = harness.render(props);
  const emailField = find(busy, node => node?.props?.email === 'member@example.test' && typeof node.props.setEmail === 'function');
  assert.equal(emailField.props.readOnly, true);
  emailField.props.setEmail('different@example.test');
  resolveFirst(Response.json({ error: 'authentication_unavailable', email: 'attacker@example.test' }, { status: 503 }));
  await pending;
  let recovered = harness.render(props);
  assert.match(renderToStaticMarkup(recovered), /member@example\.test/);
  await find(recovered, node => node?.props?.children === 'Reenviar').props.onClick({ preventDefault() {} });
  recovered = harness.render(props);
  find(recovered, node => node?.props?.id === 'login-code').props.onChange('001234');
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(calls.map(call => call.body.email), ['member@example.test', 'member@example.test', 'member@example.test']);
  assert.deepEqual(destinations, []);
  harness.unmount();
});

test('unmount aborts a pending send and a late response cannot populate the next screen or redirect', async t => {
  const destinations = browser(t);
  let resolveResponse, signal;
  t.mock.method(globalThis, 'fetch', (_path, init) => {
    signal = init.signal;
    return new Promise(resolve => { resolveResponse = resolve; });
  });
  const harness = magicView(), props = { authMode: 'better-auth', initialEmail: 'member@example.test' };
  const pending = find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  harness.unmount();
  const state = [...harness.state];
  assert.equal(signal.aborted, true);
  resolveResponse(Response.json({ ok: true }));
  await pending;
  assert.deepEqual(harness.state, state);
  assert.deepEqual(destinations, []);
});

test('legacy-account guidance and its registration link are generic and available before and after requesting a code', async t => {
  const destinations = browser(t);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ok: true }); });
  const harness = magicView(), props = { authMode: 'better-auth', initialEmail: 'member@example.test', initialRef: 'MP-REFERRED', initialSide: 'R' };
  let tree = harness.render(props);
  for (const stage of ['request', 'confirm', 'changed-email']) {
    const html = renderToStaticMarkup(tree);
    assert.match(html, /Si ya pertenecías a la red/);
    assert.match(html, /solicita un código con tu correo original/);
    assert.match(html, /Tu cuenta y posición en la red se conservan/);
    assert.match(html, /verificar el correo no las vincula automáticamente/);
    assert.match(html, /la vinculación requiere revisión y aprobación/);
    assert.match(html, /Si todavía no tienes un acceso, utiliza Registro/);
    assert.doesNotMatch(html, /aún no creaste tu nuevo acceso, créalo en Registro/);
    const register = find(tree, node => node?.type === 'a' && node.props.children === 'Crear acceso en Registro');
    assert.equal(register.props.href, '/register?email=member%40example.test&ref=MP-REFERRED&side=R');
    if (stage === 'request') await find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
    else if (stage === 'confirm') find(tree, node => node?.props?.children === 'Cambiar email').props.onClick();
    tree = harness.render(props);
  }
  assert.equal(calls, 1, 'guidance and changing email do not query account existence or resend');
  assert.deepEqual(destinations, []);
  harness.unmount();
});

test('a definitively missing OTP account goes to registration instead of an impossible code-entry step', async t => {
  const destinations = browser(t), data = new Map(), calls = [];
  window.sessionStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    calls.push({ path, body: JSON.parse(init.body) });
    return Response.json({ error: 'authentication_failed', code: 'REGISTRATION_REQUIRED' }, { status: 400 });
  });
  const harness = magicView(), props = { authMode: 'better-auth', initialEmail: ' NEW@EXAMPLE.TEST ', initialRef: 'MP-REFERRED', initialSide: 'R' };
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(destinations, ['/register?ref=MP-REFERRED&side=R&reason=registration-required']);
  assert.equal(registration.consumeRegistrationPrefill(window), 'new@example.test');
  assert.equal(data.size, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/auth/email-otp/send-verification-otp');
  assert.equal(calls[0].body.email, 'new@example.test');
  assert.equal(find(harness.render(props), node => node?.props?.id === 'login-code'), undefined);
  harness.unmount();
});

test('a missing account can still reach registration with denied storage, without falling back to an email query', async t => {
  const destinations = browser(t);
  Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('synthetic denial'); } });
  t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 'REGISTRATION_REQUIRED' }, { status: 400 }));
  const harness = magicView(), props = { authMode: 'better-auth', initialEmail: 'new@example.test' };
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(destinations, ['/register?reason=registration-required']);
  harness.unmount();
});

test('registration-looking fields on permission, throttling and service failures cannot redirect OTP login', async t => {
  const destinations = browser(t);
  for (const status of [200, 401, 403, 404, 429, 500, 503]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 'REGISTRATION_REQUIRED', needsRegister: true }, { status }));
    const harness = magicView(), props = { authMode: 'better-auth', initialEmail: 'member@example.test' };
    await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.deepEqual(destinations, []);
    harness.unmount();
  }
});

test('an invalid OTP never redirects to registration even if its response contains a registration code', async t => {
  const destinations = browser(t);
  t.mock.method(globalThis, 'fetch', async path => path.endsWith('/send-verification-otp') ? Response.json({ ok: true })
    : Response.json({ code: 'REGISTRATION_REQUIRED' }, { status: 400 }));
  const harness = magicView(), props = { authMode: 'better-auth', initialEmail: 'member@example.test' };
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  find(harness.render(props), node => node?.props?.id === 'login-code').props.onChange('001234');
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.match(renderToStaticMarkup(harness.render(props)), /Código inválido o expirado/);
  assert.deepEqual(destinations, []);
  harness.unmount();
});

function realPasswordView() {
  return registrationViewHarness('../login/BetterAuthPasswordLogin.jsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    '../register/RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub,
      RegistrationPassword: ({ visible: _visible, onToggle: _onToggle, ...props }) => registrationFieldStub(props) },
    './better-auth-login.mjs': auth, '../register/registration-model.mjs': registration,
  });
}

test('a definitively missing password account clears the password and retains the parent referral through the same safe redirect', async t => {
  const destinations = browser(t), data = new Map(), paths = [];
  window.sessionStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  t.mock.method(globalThis, 'fetch', async path => { paths.push(path); return Response.json({ code: 'REGISTRATION_REQUIRED' }, { status: 400 }); });
  const parent = magicView(), tree = parent.render({ authMode: 'better-auth', initialMode: 'password', initialEmail: 'new@example.test', initialRef: 'MP-REFERRED', initialSide: 'L' });
  const props = find(tree, node => node?.type === passwordView).props;
  const harness = realPasswordView();
  harness.render(props); harness.state[0] = 'Synthetic private password';
  await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(destinations, ['/register?ref=MP-REFERRED&side=L&reason=registration-required']);
  assert.equal(harness.state[0], '');
  assert.equal(registration.consumeRegistrationPrefill(window), 'new@example.test');
  assert.deepEqual(paths, ['/api/auth/sign-in/email']);
  assert.deepEqual([...data.values()], []);
  parent.unmount(); harness.unmount();
});

test('wrong password, denied admin permission and backend failures never become a new-account redirect', async t => {
  const destinations = browser(t), errors = [];
  for (const [status, code] of [[400, 'INVALID_EMAIL_OR_PASSWORD'], [401, 'INVALID_EMAIL_OR_PASSWORD'],
    [403, 'REGISTRATION_REQUIRED'], [429, 'REGISTRATION_REQUIRED'], [503, 'REGISTRATION_REQUIRED']]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ code }, { status }));
    const harness = realPasswordView(), props = { email: 'member@example.test', setEmail() {}, onBusy() {},
      onError: message => errors.push(message), onNotice() {}, onVerified() { assert.fail('a rejected login cannot verify an account'); }, rememberReferral() {} };
    harness.render(props); harness.state[0] = 'Synthetic private password';
    await find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.deepEqual(destinations, []);
    assert.notEqual(harness.state[0], '');
    harness.unmount();
  }
  assert.ok(errors.some(message => message.includes('correo o la contraseña')));
});
