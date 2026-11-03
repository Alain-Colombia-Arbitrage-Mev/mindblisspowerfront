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
  globalThis.window = { location: { search: '?verified=true&registered=1', assign: href => destinations.push(href) } };
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

test('accepted OTP enters the panel immediately after matching canonical access, once across rerenders and repeated clicks', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
      : path === '/api/auth/session' ? { authenticated: true, mode: 'better-auth', email } : proof());
  });
  const harness = view();
  assert.doesNotMatch(html(harness), /Correo verificado correctamente/);
  harness.replayEffects();
  await enterCode(harness);
  for (let render = 0; render < 3; render++) {
    const rendered = html(harness);
    assert.match(rendered, /Correo verificado correctamente/);
    assert.match(rendered, /role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    assert.match(rendered, /member@example\.test/);
    assert.match(rendered, /Continuar al panel/);
    assert.doesNotMatch(rendered, /id="login-code"|Reenviar|Enviar código/);
    assert.match(rendered, /Abriendo tu panel/);
    assert.deepEqual(destinations, ['/dashboard']);
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
  assert.match(html(harness), /Si tu cuenta anterior requiere revisión/);
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

test('password login enters through the same parent callback only after matching canonical access, without an email send', async t => {
  const destinations = browser(t), paths = [];
  let releaseSession, sessionStarted;
  const checkingSession = new Promise(resolve => { sessionStarted = resolve; });
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    if (path === '/api/auth/session') {
      sessionStarted();
      return new Promise(resolve => { releaseSession = resolve; });
    }
    return Response.json(proof());
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
  const pending = submit(harness.render(passwordProps));
  await checkingSession;
  assert.doesNotMatch(renderToStaticMarkup(parent.render(parentProps)), /Correo verificado correctamente/);
  assert.deepEqual(destinations, [], 'native proof alone cannot enter before the current canonical session check');
  assert.equal(find(harness.render(passwordProps), node => node?.type === 'form').props['aria-busy'], true);
  releaseSession(Response.json({ authenticated: true, mode: 'better-auth', email }));
  await pending;
  assert.match(renderToStaticMarkup(parent.render(parentProps)), /Correo verificado correctamente/);
  assert.deepEqual(paths, ['/api/auth/sign-in/email', '/api/auth/session']);
  assert.equal(harness.state[0], '');
  assert.deepEqual(destinations, ['/dashboard']);
  passwordProps.onVerified(email, { ready: true });
  assert.deepEqual(destinations, ['/dashboard'], 'a repeated completion callback cannot navigate twice');
  harness.unmount(); parent.unmount();
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

test('manual access review is duplicate-locked, aborts on unmount and ignores a late canonical result or error', async t => {
  const destinations = browser(t);
  for (const result of [Response.json({ authenticated: true, mode: 'better-auth', email }),
    Response.json({ error: 'synthetic-private-error' }, { status: 503 })]) {
    let checks = 0, release, signal;
    t.mock.method(globalThis, 'fetch', async (path, options) => {
      if (path === '/api/auth/session') {
        if (++checks === 1) return Response.json({ authenticated: false, mode: 'better-auth', state: 'review_required' });
        signal = options.signal;
        return new Promise(resolve => { release = resolve; });
      }
      return Response.json(path.endsWith('/send-verification-otp') ? { ok: true } : proof());
    });
    const harness = view(); await enterCode(harness);
    const click = find(harness.render(props), node => node?.props?.children === 'Revisar acceso').props.onClick;
    const pending = click(); await click();
    assert.equal(checks, 2, 'the initial check and one explicit review are the only session requests');
    harness.unmount(); const state = [...harness.state];
    assert.equal(signal.aborted, true);
    release(result); await pending;
    assert.deepEqual(harness.state, state);
    assert.deepEqual(destinations, [], 'an abandoned form cannot navigate after a late review');
  }
});

test('a current explicit access review can proceed without sending or redeeming another OTP', async t => {
  const destinations = browser(t), paths = [];
  let checks = 0;
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
      : path === '/api/auth/session' ? { authenticated: ++checks > 1, mode: 'better-auth', email } : proof());
  });
  const harness = view(); await enterCode(harness);
  const review = find(harness.render(props), node => node?.props?.children === 'Revisar acceso').props.onClick;
  await review(); await review();
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp', '/api/auth/session', '/api/auth/session']);
  harness.unmount();
});

test('OTP proof waits for the current canonical response and an abandoned lookup cannot navigate or update state', async t => {
  const destinations = browser(t), paths = [];
  let release, signal, started;
  const checking = new Promise(resolve => { started = resolve; });
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    if (path === '/api/auth/session') {
      signal = options.signal; started();
      return new Promise(resolve => { release = resolve; });
    }
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true } : proof());
  });
  const harness = view();
  const pending = enterCode(harness);
  await checking;
  assert.match(html(harness), /Comprobando tu acceso actual/);
  assert.deepEqual(destinations, [], 'OTP ownership is not sufficient for dashboard entry');
  harness.unmount(); const state = [...harness.state];
  assert.equal(signal.aborted, true);
  release(Response.json({ authenticated: true, mode: 'better-auth', email }));
  await pending;
  assert.deepEqual(harness.state, state);
  assert.deepEqual(destinations, []);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp', '/api/auth/session']);
});

test('stale password completion and old review controls cannot navigate after the parent is abandoned or another email is selected', async t => {
  const destinations = browser(t);
  t.mock.method(globalThis, 'fetch', async path => Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
    : path === '/api/auth/session' ? { authenticated: false, mode: 'better-auth' } : proof()));
  const harness = view(); await enterCode(harness);
  const review = find(harness.render(props), node => node?.props?.children === 'Revisar acceso').props.onClick;
  find(harness.render(props), node => node?.props?.children === 'Usar otro correo').props.onClick();
  await review();
  assert.deepEqual(destinations, []);
  const password = view(), passwordProps = { ...props, initialMode: 'password' };
  const complete = find(password.render(passwordProps), node => typeof node?.props?.onVerified === 'function').props.onVerified;
  password.unmount(); const state = [...password.state];
  complete(email, { ready: true });
  assert.deepEqual(password.state, state);
  assert.deepEqual(destinations, []);
  harness.unmount();
});

test('automatic entry keeps this tab sponsor and branch bound to its own email despite another tab changing global referral context', async t => {
  const destinations = browser(t), values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  window.localStorage = storage;
  window.location.search = '?ref=SponsorA&side=L';
  t.mock.method(globalThis, 'fetch', async path => Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
    : path === '/api/auth/session' ? { authenticated: true, mode: 'better-auth', email } : proof()));
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
