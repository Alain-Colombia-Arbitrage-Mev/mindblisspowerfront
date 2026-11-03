import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from '../register/registration-view-test-harness.mjs';
import * as registration from '../register/registration-model.mjs';
import * as emailOtp from '../../lib/email-otp-client.mjs';
import { authSuccess } from '../../lib/auth-response.mjs';
import * as auth from './better-auth-login.mjs';
import * as referral from '../../lib/referral-attribution.js';

const email = 'member@example.test';
const props = { authMode: 'better-auth', initialEmail: email };
const proof = () => authSuccess('sign-in/email-otp', { token: 'synthetic-private-token', user: { id: 'synthetic-member', email, emailVerified: true } });
const submit = tree => find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
const html = harness => renderToStaticMarkup(harness.render(props));
function browser(t) {
  const previous = globalThis.window, destinations = [];
  globalThis.window = { location: { search: '?verified=true&registered=1', assign: href => destinations.push(href), replace: href => destinations.push(href) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  return destinations;
}
function view({ microsoft = false, attribution, sync = () => Promise.resolve({ ok: true }) } = {}) {
  return registrationViewHarness('../login/MagicLinkLoginForm.jsx', {
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, label: '', start() {} }), isMicrosoftEmail: () => microsoft, suggestEmailFix: () => '' },
    '@/lib/password': { checkPassword: () => ({ results: [] }), isValidPassword: () => true },
    '@/lib/referral-attribution': attribution || { bindReferralCodeToEmail() {}, captureReferralFromUrl: () => null, normalizePlacementSide: () => '', normalizeReferralCode: value => value },
    '@/lib/email-otp-client.mjs': emailOtp, './BetterAuthPasswordLogin': { default: () => null },
    '@/lib/referral-sync.mjs': { beginVerifiedReferralSync: sync },
    './better-auth-login.mjs': auth, '../register/registration-model.mjs': registration,
  });
}
async function enterCode(harness) {
  await submit(harness.render(props));
  find(harness.render(props), node => node?.props?.id === 'login-code').props.onChange('001234');
  return submit(harness.render(props));
}

test('login guidance states the actual OTP policy and manual waits without changing recovery, delivery or account authority', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => { paths.push(path); return Response.json({ ok: true }); });
  const harness = view();
  let markup = html(harness);
  assert.match(markup, /correo original de tu cuenta/);
  assert.match(markup, /6 dígitos, vence en 5 minutos y permite hasta 3 intentos/);
  assert.match(markup, /espera al menos 5 minutos entre envíos al mismo correo y respeta el contador/);
  assert.match(markup, /No compartas el código/);
  assert.doesNotMatch(markup, /5 solicitudes|10 intentos|24 horas|recibirás|Te enviamos|te quedan|Correo verificado correctamente/);
  assert.deepEqual(paths, []);
  await submit(harness.render(props));
  markup = html(harness);
  assert.match(markup, /Vence en 5 minutos y permite hasta 3 intentos/);
  assert.match(markup, /no uses un código de registro o recuperación ni lo compartas/);
  assert.match(markup, /Espera a que termine el contador antes de solicitar otro código/);
  assert.doesNotMatch(markup, /recibirás|Te enviamos|te quedan|Correo verificado correctamente/);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp']);
  assert.deepEqual(destinations, []);
  harness.unmount();
});

test('rejected login OTP guidance cannot reflect provider diagnostics, delivery claims or fabricated remaining attempts', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return path.endsWith('/send-verification-otp') ? Response.json({ ok: true }) : Response.json({
      code: 'INVALID_OTP', message: 'private-provider-diagnostic: Te quedan 2 intentos; correo verificado.', remainingAttempts: 2,
    }, { status: 400 });
  });
  const harness = view(); await enterCode(harness);
  const markup = html(harness);
  assert.match(markup, /Código inválido o expirado/);
  assert.match(markup, /código de acceso más reciente/);
  assert.match(markup, /espera el contador antes de solicitar otro/);
  assert.doesNotMatch(markup, /private-provider|Te quedan|correo verificado|Correo verificado correctamente|remainingAttempts/);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp']);
  assert.deepEqual(destinations, []);
  harness.unmount();
});

test('fresh BFF-proven OTP session starts one hard dashboard navigation without a client session preflight', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    assert.ok(!path.startsWith('/api/auth/session'), 'server dashboard, not a client preflight, owns authorization');
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true } : proof());
  });
  const harness = view();
  harness.replayEffects();
  await enterCode(harness);
  for (let render = 0; render < 3; render++) {
    const rendered = html(harness);
    assert.match(rendered, /Correo verificado correctamente/);
    assert.match(rendered, /role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    assert.match(rendered, /Abriendo tu panel/);
    assert.doesNotMatch(rendered, /id="login-code"|Reenviar|Enviar código|Revisar acceso/);
    assert.equal(find(harness.render(props), node => node?.type === 'a' && node?.props?.href === '/dashboard').props.href, '/dashboard');
    assert.deepEqual(destinations, ['/dashboard']);
  }
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp']);
  harness.unmount();
});

test('a dashboard continuation is a real same-origin anchor and never claims a network grant or manual review', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true } : proof());
  });
  const harness = view(); await enterCode(harness);
  const rendered = html(harness);
  assert.match(rendered, /Correo verificado correctamente/);
  assert.doesNotMatch(rendered, /Revisar acceso|Si tu cuenta anterior requiere revisión|cuenta aprobada|saldo disponible/);
  const continuation = find(harness.render(props), node => node?.type === 'a' && node?.props?.href === '/dashboard');
  assert.equal(continuation.props.href, '/dashboard');
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp']);
  harness.unmount();
});

test('unavailable session summaries cannot hold a newly established native session on a client review screen', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    if (path.startsWith('/api/auth/session')) return Response.json({ error: 'unavailable' }, { status: 503 });
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true } : proof());
  });
  const harness = view(); await enterCode(harness);
  assert.match(html(harness), /Correo verificado correctamente/);
  assert.equal(paths.some(path => path.startsWith('/api/auth/session')), false);
  assert.deepEqual(destinations, ['/dashboard'], 'navigation reaches the server gate; it grants no account or financial permissions');
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
    assert.equal(paths.includes('/api/auth/session?view=access'), false, 'untrusted sign-in cannot query or install network authority');
    harness.unmount();
  }
  assert.deepEqual(destinations, []);
});

test('password login publishes fresh native proof to the parent and navigates without a client session request or email send', async t => {
  const destinations = browser(t), paths = [];
  let release, started;
  const waiting = new Promise(resolve => { started = resolve; });
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path); assert.equal(path, '/api/auth/sign-in/email');
    started(); return new Promise(resolve => { release = resolve; });
  });
  const parent = view(), parentProps = { ...props, initialMode: 'password' };
  const passwordProps = find(parent.render(parentProps), node => typeof node?.props?.onVerified === 'function').props;
  const harness = registrationViewHarness('../login/BetterAuthPasswordLogin.jsx', {
    'next/link': { default: ({ children, ...attributes }) => React.createElement('a', attributes, children) },
    '../register/RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub,
      RegistrationPassword: ({ visible: _visible, onToggle: _onToggle, ...attributes }) => registrationFieldStub(attributes) },
    './better-auth-login.mjs': auth, '../register/registration-model.mjs': registration,
  });
  harness.render(passwordProps); harness.state[0] = 'Synthetic Existing Password';
  const pending = submit(harness.render(passwordProps)); await waiting;
  assert.deepEqual(destinations, []);
  assert.doesNotMatch(renderToStaticMarkup(parent.render(parentProps)), /Correo verificado correctamente/);
  release(Response.json(proof())); await pending;
  assert.match(renderToStaticMarkup(parent.render(parentProps)), /Correo verificado correctamente/);
  assert.deepEqual(paths, ['/api/auth/sign-in/email']);
  assert.equal(harness.state[0], '');
  assert.deepEqual(destinations, ['/dashboard']);
  passwordProps.onVerified(email);
  assert.deepEqual(destinations, ['/dashboard']);
  harness.unmount(); parent.unmount();
});

test('an OTP proof belonging to another email cannot start dashboard navigation or a session lookup', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
      : { ...proof(), user: { ...proof().user, email: 'previous@example.test' } });
  });
  const harness = view(); await enterCode(harness);
  assert.doesNotMatch(html(harness), /Correo verificado correctamente|Continuar al panel|previous@example\.test/);
  assert.equal(paths.some(path => path.startsWith('/api/auth/session')), false);
  assert.deepEqual(destinations, []);
  harness.unmount();
});

test('OTP confirmation is duplicate-locked, aborts on unmount and ignores late native proof or error', async t => {
  const destinations = browser(t);
  for (const result of [Response.json(proof()), Response.json({ error: 'synthetic-private-error' }, { status: 503 })]) {
    let release, signal, calls = 0;
    t.mock.method(globalThis, 'fetch', async (path, options) => {
      if (path.endsWith('/send-verification-otp')) return Response.json({ ok: true });
      assert.equal(path, '/api/auth/sign-in/email-otp');
      calls++; signal = options.signal;
      return new Promise(resolve => { release = resolve; });
    });
    const harness = view(); await submit(harness.render(props));
    find(harness.render(props), node => node?.props?.id === 'login-code').props.onChange('001234');
    const click = find(harness.render(props), node => node?.type === 'form').props.onSubmit;
    const pending = click({ preventDefault() {} }); await click({ preventDefault() {} });
    assert.equal(calls, 1);
    harness.unmount(); const state = [...harness.state];
    assert.equal(signal.aborted, true);
    release(result); await pending;
    assert.deepEqual(harness.state, state);
    assert.deepEqual(destinations, []);
  }
});

test('an accepted OTP cannot trigger a second redemption or send when the verified screen renders again', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true } : proof());
  });
  const harness = view(); await enterCode(harness);
  for (let index = 0; index < 5; index++) harness.render(props);
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp']);
  assert.equal(find(harness.render(props), node => node?.type === 'a' && node?.props?.href === '/dashboard').props.href, '/dashboard');
  harness.unmount();
});

test('a disposed OTP form ignores a late decoded POST proof without navigating, resending or updating state', async t => {
  const destinations = browser(t), paths = [];
  let release, signal, started;
  const decoding = new Promise(resolve => { started = resolve; });
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    if (path.endsWith('/send-verification-otp')) return Response.json({ ok: true });
    signal = options.signal;
    return { ok: true, status: 200, json() { started(); return new Promise(resolve => { release = resolve; }); } };
  });
  const harness = view(), pending = enterCode(harness); await decoding;
  assert.deepEqual(destinations, []);
  harness.unmount(); const state = [...harness.state];
  assert.equal(signal.aborted, true);
  release(proof()); await pending;
  assert.deepEqual(harness.state, state);
  assert.deepEqual(destinations, []);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp']);
});

test('a stale password completion cannot navigate after its parent has been unmounted', t => {
  const destinations = browser(t);
  const parent = view(), parentProps = { ...props, initialMode: 'password' };
  const complete = find(parent.render(parentProps), node => typeof node?.props?.onVerified === 'function').props.onVerified;
  parent.unmount(); const state = [...parent.state];
  complete(email);
  assert.deepEqual(parent.state, state);
  assert.deepEqual(destinations, []);
});

test('automatic entry keeps this tab sponsor and branch bound to its own email despite another tab changing global referral context', async t => {
  const destinations = browser(t), values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  window.localStorage = storage;
  window.location.search = '?ref=SponsorA&side=L';
  t.mock.method(globalThis, 'fetch', async path => Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
    : path === '/api/auth/session?view=access' ? { authenticated: true, mode: 'better-auth', email } : proof()));
  const saves = [];
  const harness = view({ attribution: referral, sync: (...values) => { saves.push(values); return new Promise(() => {}); } });
  harness.render(props); harness.render(props);
  referral.captureReferralFromUrl('?ref=SponsorB&side=R', storage);
  referral.bindReferralCodeToEmail('other@example.test', 'SponsorOther', storage, undefined, 'login', 'R');
  await enterCode(harness);
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(saves, [[email, 'SponsorA', 'L']], 'a pending background save never delays entry or uses the other tab hint');
  assert.deepEqual(referral.referralForCheckout(email, storage), { code: 'SponsorA', email, side: 'L' });
  assert.deepEqual(referral.referralForCheckout('other@example.test', storage), { code: 'SponsorOther', email: 'other@example.test', side: 'R' });
  harness.unmount();
});

test('Microsoft delivery help preserves the original account and distinguishes the six-digit login purpose', async t => {
  browser(t);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ok: true }); });
  const harness = view({ microsoft: true });
  assert.match(html(harness), /6 dígitos.*5 minutos.*distinto del código de registro o recuperación/);
  await submit(harness.render(props));
  const markup = html(harness);
  assert.match(markup, /conserva el correo original de tu cuenta/);
  assert.match(markup, /no uses un código de registro o recuperación/);
  assert.doesNotMatch(markup, /usa otro correo|cambia(?:r)? (?:el|tu) correo/i);
  assert.match(markup, /name="login-code"/);
  assert.match(markup, /aria-describedby="login-code-helper"/);
  assert.match(markup, /maxLength="6"/);
  assert.equal(calls, 1); harness.unmount();
});
