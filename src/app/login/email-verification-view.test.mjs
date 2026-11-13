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
function view({ microsoft = false, attribution, sync = () => Promise.resolve({ ok: true }), cooldowns, onSession = () => {} } = {}) {
  return registrationViewHarness('../login/MagicLinkLoginForm.jsx', {
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/lib/useResendCooldown': { useResendCooldown: (_seconds, scope = '') => {
      if (!cooldowns) return { active: false, label: '', start() {} };
      const key = scope.includes(':sign-in-confirm:') ? 'confirm' : scope.includes(':sign-in:') ? 'send' : 'other';
      if (!cooldowns.has(key)) cooldowns.set(key, { active: false, label: '', start(seconds) {
        this.active = true; this.seconds = seconds; this.label = `Reenviar en ${seconds}s`;
      } });
      return cooldowns.get(key);
    }, isMicrosoftEmail: () => microsoft, suggestEmailFix: () => '' },
    '@/lib/password': { checkPassword: () => ({ results: [] }), isValidPassword: () => true },
    '@/lib/referral-attribution': attribution || { bindReferralCodeToEmail() {}, captureReferralFromUrl: () => null, normalizePlacementSide: () => '', normalizeReferralCode: value => value },
    '@/lib/email-otp-client.mjs': emailOtp, './BetterAuthPasswordLogin': { default: () => null },
    '@/lib/referral-sync.mjs': { beginVerifiedReferralSync: sync },
    '@/lib/member-session-sync.mjs': { publishMemberSessionReplacement: onSession },
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

test('fresh BFF-proven OTP session checks the browser cookie once before one hard dashboard navigation', async t => {
  const destinations = browser(t), paths = []; let notifications = 0;
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
      : path === '/api/auth/session?view=access' ? { authenticated: true, mode: 'better-auth', email } : proof());
  });
  const harness = view({ onSession: () => { notifications++; assert.equal(paths.at(-1), '/api/auth/sign-in/email-otp'); } });
  harness.replayEffects();
  await enterCode(harness);
  for (let render = 0; render < 3; render++) {
    const rendered = html(harness);
    assert.match(rendered, /Correo verificado correctamente/);
    assert.match(rendered, /role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    assert.match(rendered, /El servidor comprobará tu sesión/);
    assert.doesNotMatch(rendered, /id="login-code"|Reenviar|Enviar código|Revisar acceso/);
    assert.equal(find(harness.render(props), node => node?.type === 'a' && node?.props?.href === '/dashboard').props.href, '/dashboard');
    assert.deepEqual(destinations, ['/dashboard']);
  }
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp', '/api/auth/session?view=access']);
  assert.equal(notifications, 1, 'only the verified native POST replaces other mounted sessions');
  harness.unmount();
});

test('a dashboard continuation is a real same-origin anchor and never claims a network grant or manual review', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
      : path === '/api/auth/session?view=access' ? { authenticated: true, mode: 'better-auth', email } : proof());
  });
  const harness = view(); await enterCode(harness);
  const rendered = html(harness);
  assert.match(rendered, /Correo verificado correctamente/);
  assert.doesNotMatch(rendered, /Revisar acceso|Si tu cuenta anterior requiere revisión|cuenta aprobada|saldo disponible/);
  const continuation = find(harness.render(props), node => node?.type === 'a' && node?.props?.href === '/dashboard');
  assert.equal(continuation.props.href, '/dashboard');
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp', '/api/auth/session?view=access']);
  harness.unmount();
});

test('an unavailable cookie roundtrip keeps verified proof and a direct native fallback without automatic navigation or another OTP', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    if (path.startsWith('/api/auth/session')) return Response.json({ error: 'unavailable' }, { status: 503 });
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true } : proof());
  });
  const harness = view(); await enterCode(harness);
  assert.match(html(harness), /Correo verificado correctamente/);
  assert.equal(paths.filter(path => path === '/api/auth/session?view=access').length, 1);
  assert.deepEqual(destinations, []);
  assert.match(html(harness), /servicio de autorización no está disponible/);
  assert.equal(find(harness.render(props), node => node?.type === 'a' && node?.props?.href === '/dashboard').props.href, '/dashboard');
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
    const harness = view({ onSession: () => assert.fail('rejected or malformed OTP proof must not signal a new session') }); await enterCode(harness);
    assert.doesNotMatch(html(harness), /Correo verificado correctamente|Continuar al panel/);
    assert.equal(paths.includes('/api/auth/session?view=access'), false, 'untrusted sign-in cannot query or install network authority');
    harness.unmount();
  }
  assert.deepEqual(destinations, []);
});

test('password login publishes fresh native proof and the parent checks its browser cookie once without sending email', async t => {
  const destinations = browser(t), paths = []; let notifications = 0;
  let release, started;
  const waiting = new Promise(resolve => { started = resolve; });
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    if (path === '/api/auth/session?view=access') return Response.json({ authenticated: true, mode: 'better-auth', email });
    assert.equal(path, '/api/auth/sign-in/email');
    started(); return new Promise(resolve => { release = resolve; });
  });
  const parent = view({ onSession: () => { notifications++; } }), parentProps = { ...props, initialMode: 'password' };
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
  await new Promise(resolve => setImmediate(resolve));
  assert.match(renderToStaticMarkup(parent.render(parentProps)), /Correo verificado correctamente/);
  assert.deepEqual(paths, ['/api/auth/sign-in/email', '/api/auth/session?view=access']);
  assert.equal(harness.state[0], '');
  assert.deepEqual(destinations, ['/dashboard']);
  passwordProps.onVerified(email);
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(paths, ['/api/auth/sign-in/email', '/api/auth/session?view=access'], 'a duplicate password completion cannot repeat the cookie check');
  assert.equal(notifications, 1, 'a verified password session uses the same duplicate-locked replacement notification');
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
    return Response.json(path.endsWith('/send-verification-otp') ? { ok: true }
      : path === '/api/auth/session?view=access' ? { authenticated: true, mode: 'better-auth', email } : proof());
  });
  const harness = view(); await enterCode(harness);
  for (let index = 0; index < 5; index++) harness.render(props);
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(paths, ['/api/auth/email-otp/send-verification-otp', '/api/auth/sign-in/email-otp', '/api/auth/session?view=access']);
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

test('automatic entry keeps this tab sponsor bound to its own email while discarding every branch hint', async t => {
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
  assert.deepEqual(saves, [[email, 'SponsorA', '']], 'a pending background save never delays entry, uses another tab or selects a branch');
  assert.deepEqual(referral.referralForCheckout(email, storage), { code: 'SponsorA', email });
  assert.deepEqual(referral.referralForCheckout('other@example.test', storage), { code: 'SponsorOther', email: 'other@example.test' });
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

test('edge HTML 429 and service 503 preserve code entry, neutral guidance and a manual resend wait without registration redirects', async t => {
  const destinations = browser(t);
  for (const status of [429, 503]) {
    const cooldowns = new Map(), calls = [];
    t.mock.method(globalThis, 'fetch', async path => { calls.push(path); return new Response('<html>private recipient REGISTRATION_REQUIRED</html>', {
      status, headers: { 'Content-Type': 'text/html', 'Retry-After': '621' },
    }); });
    const harness = view({ cooldowns }); await submit(harness.render(props));
    const markup = html(harness);
    assert.match(markup, /No pudimos confirmar el envío/); assert.doesNotMatch(markup, /private recipient|<html>|Correo verificado correctamente/);
    assert.ok(find(harness.render(props), node => node?.props?.id === 'login-code'));
    assert.equal(cooldowns.get('send').seconds, 621); assert.equal(cooldowns.get('confirm').active, false);
    for (let count = 0; count < 3; count++) harness.render(props);
    const resend = find(harness.render(props), node => node?.props?.onClick && node?.props?.children === 'Reenviar en 621s');
    assert.equal(resend.props.disabled, true); await resend.props.onClick({ preventDefault() {} });
    assert.deepEqual(calls, ['/api/auth/email-otp/send-verification-otp']); assert.deepEqual(destinations, []);
    harness.unmount();
  }
});

test('a limited redemption preserves the received OTP and pauses only validation until explicit retry', async t => {
  const destinations = browser(t), cooldowns = new Map(), paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return path.endsWith('/send-verification-otp') ? Response.json({ ok: true })
      : new Response('<html>private WAF detail</html>', { status: 429, headers: { 'Retry-After': '83', 'Content-Type': 'text/html' } });
  });
  const harness = view({ cooldowns }); await enterCode(harness);
  assert.equal(cooldowns.get('confirm').seconds, 83);
  assert.equal(find(harness.render(props), node => node?.props?.id === 'login-code').props.value, '001234');
  assert.match(html(harness), /Demasiados intentos/); assert.doesNotMatch(html(harness), /private WAF|inválido o expirado/);
  assert.ok(find(harness.render(props), node => node?.props?.children === 'Validar de nuevo en 83s').props.disabled);
  await submit(harness.render(props)); assert.equal(paths.length, 2);
  cooldowns.get('confirm').active = false;
  t.mock.method(globalThis, 'fetch', async path => { paths.push(path); return Response.json({ error: 'private provider detail' }, { status: 503 }); });
  await submit(harness.render(props)); assert.equal(paths.length, 3);
  assert.match(html(harness), /servicio de acceso no está disponible/); assert.doesNotMatch(html(harness), /private provider|inválido o expirado/);
  assert.equal(find(harness.render(props), node => node?.props?.id === 'login-code').props.value, '001234');
  assert.deepEqual(destinations, []); harness.unmount();
});

test('uncertain resend cannot erase an entered code or cause another email until the user chooses it after the wait', async t => {
  browser(t); const cooldowns = new Map(), paths = [];
  t.mock.method(globalThis, 'fetch', async path => { paths.push(path); return paths.length === 1 ? Response.json({ ok: true })
    : new Response('private edge detail', { status: 429, headers: { 'Retry-After': '621' } }); });
  const harness = view({ cooldowns }); await submit(harness.render(props));
  find(harness.render(props), node => node?.props?.id === 'login-code').props.onChange('001234');
  cooldowns.get('send').active = false;
  const resend = find(harness.render(props), node => node?.props?.onClick && node?.props?.children === 'Reenviar');
  await resend.props.onClick({ preventDefault() {} });
  assert.equal(paths.length, 2); assert.equal(find(harness.render(props), node => node?.props?.id === 'login-code').props.value, '001234');
  assert.equal(cooldowns.get('send').seconds, 621); harness.unmount();
});
