import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from '../register/registration-view-test-harness.mjs';
import * as recovery from './password-recovery-model.mjs';
import { registrationLoginUrl, registrationUrl } from '../register/registration-model.mjs';

const email = 'member@example.test';
const props = { initialEmail: ' MEMBER@EXAMPLE.TEST ' };
const prevent = { preventDefault() {} };
const link = ({ children, ...attributes }) => React.createElement('a', attributes, children);
const field = id => node => node?.props?.id === id && typeof node.props.onChange === 'function';
const submit = harness => find(harness.render(props), node => node?.type === 'form').props.onSubmit(prevent);
const change = (harness, id, value) => find(harness.render(props), field(id)).props.onChange({ target: { value } });
const html = harness => renderToStaticMarkup(harness.render(props));

function view(cooldown = () => ({ active: false, label: '', start() {} })) {
  return registrationViewHarness('../forgot-password/BetterAuthPasswordRecovery.jsx', {
    'next/link': { default: link }, 'lucide-react': { CheckCircle2: () => null },
    '@/lib/useResendCooldown': { useResendCooldown: cooldown },
    '../register/RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub,
      RegistrationPassword: ({ visible: _visible, onToggle: _onToggle, ...attributes }) => registrationFieldStub(attributes) },
    './password-recovery-model.mjs': recovery,
  });
}

function enterCredentials(harness, password = ' Raw synthetic password ') {
  change(harness, 'recovery-otp', '001234');
  change(harness, 'recovery-password', password);
  change(harness, 'recovery-confirm-password', password);
}

test('recovery explains first-password setup in three steps without changing the original address', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('recovery instructions cannot request or redeem an OTP'));
  const harness = view(), tree = harness.render(props), markup = renderToStaticMarkup(tree);
  const steps = find(tree, node => node?.type === 'ol');
  assert.equal(steps.props['aria-label'], 'Pasos para crear o cambiar la contraseña');
  assert.equal(React.Children.count(steps.props.children), 3);
  assert.match(markup, /primera contraseña de acceso o reemplazar la anterior/);
  assert.match(markup, /tu contraseña antigua no es necesaria/);
  assert.match(markup, /No necesitas cambiar tu correo ni volver a registrarte/);
  assert.match(markup, /5 solicitudes de recuperación y 10 intentos de validación/);
  assert.match(markup, /últimas 24 horas/);
  assert.match(markup, /Recargar la página, cambiar de dispositivo o pedir otro código no reinicia el límite diario/);
  assert.match(markup, /no bloquea el inicio de sesión/);
  assert.ok(markup.indexOf('Solicita el código') < markup.indexOf('Escribe el código'));
  assert.ok(markup.indexOf('Escribe el código') < markup.indexOf('Guarda los cambios'));
  assert.match(markup, /revisa esa bandeja, incluido spam/);
  assert.match(markup, /repítela para confirmarla/);
  assert.doesNotMatch(markup, /Te enviamos|cuenta existe|cuenta no existe|Contraseña actualizada/);
  harness.unmount();
});

test('first-password setup and reset use one neutral flow and never log in, change email or query credential existence', async t => {
  for (const account of ['existing-password', 'no-password', 'unknown-account']) {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (path, options) => {
      calls.push({ path, options, body: JSON.parse(options.body) });
      return Response.json({ ok: true });
    });
    const harness = view();
    assert.equal(calls.length, 0, account);
    await submit(harness);
    assert.match(html(harness), /Si el correo corresponde a una cuenta habilitada/);
    assert.doesNotMatch(html(harness), /Te enviamos|cuenta existe|no existe|Contraseña actualizada/);
    assert.equal(find(harness.render(props), field('recovery-email')).props.readOnly, true);
    assert.match(html(harness), /no cambia el correo registrado/);
    enterCredentials(harness);
    await submit(harness);
    assert.match(html(harness), /Contraseña actualizada/);
    assert.match(html(harness), /role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    assert.match(html(harness), /href="\/login\?mode=password"/);
    assert.doesNotMatch(html(harness), /one-time-code|new-password|member@example\.test|dashboard/);
    assert.equal(harness.state[3], ''); assert.equal(harness.state[4], ''); assert.equal(harness.state[5], '');
    assert.deepEqual(calls.map(call => call.path), ['/api/auth/email-otp/request-password-reset', '/api/auth/email-otp/reset-password']);
    assert.deepEqual(calls.map(call => call.body), [{ email }, { email, otp: '001234', password: ' Raw synthetic password ' }]);
    for (const { options } of calls) {
      assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store');
      assert.equal(options.redirect, 'error'); assert.equal(options.method, 'POST');
    }
    harness.unmount();
  }
});

test('local validation blocks malformed email, OTP and mismatched or short passwords before any network request', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ok: true }); });
  const harness = view();
  change(harness, 'recovery-email', 'invalid'); await submit(harness);
  assert.equal(calls, 0); assert.match(html(harness), /correo original/);
  change(harness, 'recovery-email', email); await submit(harness);
  enterCredentials(harness, 'short'); await submit(harness);
  assert.equal(calls, 1); assert.match(html(harness), /12 y 128/);
  enterCredentials(harness); change(harness, 'recovery-confirm-password', 'Another synthetic password'); await submit(harness);
  assert.equal(calls, 1); assert.match(html(harness), /no coinciden/);
  enterCredentials(harness); change(harness, 'recovery-otp', '１２３４５６'); await submit(harness);
  assert.equal(calls, 1); assert.match(html(harness), /6 dígitos/);
  harness.unmount();
});

test('code-entry guidance states the three-attempt policy but a rejected code never reports fabricated remaining attempts or proof', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, body: JSON.parse(options.body) });
    return path.endsWith('/request-password-reset') ? Response.json({ ok: true }) : Response.json({
      code: 'OTP_EXPIRED', error: 'private-provider-diagnostic', message: 'Te quedan 0 intentos. Correo verificado.',
      remainingAttempts: 0, accountExists: true, emailVerified: true,
    }, { status: 400 });
  });
  const harness = view(); await submit(harness);
  let markup = html(harness);
  assert.match(markup, /Vence en 5 minutos y permite hasta 3 intentos/);
  assert.match(markup, /no uses un código de inicio de sesión o registro ni lo compartas/);
  assert.match(markup, /espera a que termine el contador antes de solicitar otro/);
  assert.doesNotMatch(markup, /Te enviamos|Contraseña actualizada|Te quedan/);
  enterCredentials(harness); await submit(harness);
  markup = html(harness);
  assert.match(markup, /Si el código venció o agotó sus 3 intentos, espera el contador y solicita otro/);
  assert.doesNotMatch(markup, /private-provider|Te quedan|Correo verificado|Contraseña actualizada|accountExists|remainingAttempts/);
  assert.equal(find(harness.render(props), field('recovery-email')).props.value, email);
  assert.equal(find(harness.render(props), field('recovery-email')).props.readOnly, true);
  assert.equal(find(harness.render(props), field('recovery-otp')).props.value, '001234');
  assert.equal(calls.length, 2, 'guidance cannot resend, verify, navigate or request account state automatically');
  assert.deepEqual(calls.map(call => call.body.email), [email, email]);
  harness.unmount();
});

test('ambiguous send responses keep original code entry with a safe wait and no delivery claim or automatic resend', async t => {
  for (const outcome of [() => Response.json({ ok: true, user: {} }), () => Response.json({ ok: 'true' }),
    () => new Response('invalid-json'), () => Response.json({ error: 'private-backend-details' }, { status: 503 }),
    () => { throw new DOMException('private-timeout', 'TimeoutError'); }]) {
    let calls = 0, remaining = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return outcome(); });
    const harness = view(() => ({ active: remaining > 0, label: `Reenviar en ${remaining}`, start(value = 300) { remaining = value; } }));
    await submit(harness);
    assert.ok(find(harness.render(props), field('recovery-otp')));
    assert.match(html(harness), /No pudimos confirmar el envío/);
    assert.doesNotMatch(html(harness), /private-|Te enviamos|Contraseña actualizada/);
    assert.equal(remaining, 300); assert.equal(calls, 1);
    await find(harness.render(props), node => node?.props?.children === 'Reenviar en 300').props.onClick(prevent);
    assert.equal(calls, 1);
    harness.unmount();
  }
});

test('rate limiting preserves the original recipient and never shortens a longer Retry-After', async t => {
  let remaining = 0, calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++; return Response.json({ error: 'private-rate-details', email: 'other@example.test' }, { status: 429, headers: { 'retry-after': '950' } });
  });
  const harness = view(() => ({ active: remaining > 0, label: `Reenviar en ${remaining}`, start(value = 300) { remaining = value; } }));
  await submit(harness);
  assert.equal(remaining, 950); assert.match(html(harness), /Demasiados intentos/);
  assert.doesNotMatch(html(harness), /private-|other@example/);
  assert.equal(find(harness.render(props), field('recovery-email')).props.value, email);
  await find(harness.render(props), node => node?.props?.children === 'Reenviar en 950').props.onClick(prevent);
  assert.equal(calls, 1);
  harness.unmount();
});

test('received recovery code remains usable during send cooldown, while a separate 429 blocks redemption until explicit retry', async t => {
  const budgets = new Map(), scopes = [], calls = [];
  const cooldown = (_seconds, scope) => {
    scopes.push(scope);
    const remaining = budgets.get(scope) || 0;
    return { active: remaining > 0, label: `Reenviar en ${remaining}`, start(value) { budgets.set(scope, value); } };
  };
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, body: JSON.parse(options.body) });
    if (path.endsWith('/request-password-reset')) return Response.json({ ok: true });
    return calls.filter(call => call.path.endsWith('/reset-password')).length === 1
      ? Response.json({ error: 'private-limit-detail' }, { status: 429, headers: { 'retry-after': '600' } })
      : Response.json({ ok: true });
  });
  const harness = view(cooldown); await submit(harness); enterCredentials(harness);
  assert.equal(budgets.get(`better-auth:password-recovery:send:${email}`), 300);
  assert.equal(find(harness.render(props), node => node?.props?.children === 'Guardar nueva contraseña').props.disabled, false);
  await submit(harness);
  assert.equal(calls.length, 2, 'send cooldown never blocks the first use of an already received code');
  assert.equal(budgets.get(`better-auth:password-recovery:send:${email}`), 300, 'redemption cannot overwrite the resend budget');
  assert.equal(budgets.get(`better-auth:password-recovery:confirm:${email}`), 600);
  assert.equal(find(harness.render(props), node => node?.props?.children === 'Validar de nuevo en 600').props.disabled, true);
  assert.equal(find(harness.render(props), field('recovery-otp')).props.value, '001234');
  assert.equal(find(harness.render(props), field('recovery-password')).props.value, ' Raw synthetic password ');
  await submit(harness); assert.equal(calls.length, 2, 'handler also rejects an attempted submit during the 429 wait');
  assert.doesNotMatch(html(harness), /private-limit-detail|Contraseña actualizada/);
  budgets.set(`better-auth:password-recovery:confirm:${email}`, 0);
  harness.render(props); assert.equal(calls.length, 2, 'expiry never retries automatically');
  await submit(harness);
  assert.match(html(harness), /Contraseña actualizada/);
  assert.equal(calls.length, 3);
  assert.equal(scopes.every(scope => scope.startsWith('better-auth:password-recovery:')), true);
  assert.deepEqual(calls.map(call => call.body.email), [email, email, email]);
  harness.unmount();
});

test('daily send cooldown remains scoped to the normalized original email after returning to the email step', async t => {
  const budgets = new Map(), calls = [];
  const cooldown = (_seconds, scope) => {
    const remaining = budgets.get(scope) || 0;
    return { remaining, active: remaining > 0, label: 'must-not-display-1440:00', start(value) { budgets.set(scope, value); } };
  };
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, body: JSON.parse(options.body) });
    return Response.json({ code: 'private-daily-limit-detail' }, { status: 429, headers: { 'retry-after': '86400' } });
  });
  const harness = view(cooldown); await submit(harness);
  assert.equal(budgets.get(`better-auth:password-recovery:send:${email}`), 86400);
  assert.equal(find(harness.render(props), node => node?.props?.children === 'Reenviar en 24 h').props.disabled, true);
  assert.match(html(harness), /Este límite sólo afecta a la recuperación, no al inicio de sesión/);
  assert.doesNotMatch(html(harness), /private-daily|1440:00|cuenta bloqueada|cuenta existe/);
  find(harness.render(props), node => node?.props?.children === 'Volver al paso del correo').props.onClick();
  assert.equal(find(harness.render(props), field('recovery-email')).props.readOnly, false);
  change(harness, 'recovery-email', ' MEMBER@EXAMPLE.TEST ');
  assert.equal(find(harness.render(props), node => node?.props?.children === 'Reenviar en 24 h').props.disabled, true);
  await submit(harness);
  assert.equal(calls.length, 1, 'returning or changing email case cannot clear its server deadline hint');
  budgets.set(`better-auth:password-recovery:send:${email}`, 0);
  harness.render(props);
  assert.equal(calls.length, 1, 'deadline expiry never sends automatically');
  await submit(harness);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(call => call.body), [{ email }, { email }]);
  harness.unmount();
});

test('daily validation cooldown survives a new challenge and uses an independent 24-hour countdown', async t => {
  const budgets = new Map(), calls = [];
  const cooldown = (_seconds, scope) => {
    const remaining = budgets.get(scope) || 0;
    return { remaining, active: remaining > 0, label: 'must-not-display-1440:00', start(value) { budgets.set(scope, value); } };
  };
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, body: JSON.parse(options.body) });
    if (path.endsWith('/request-password-reset')) return Response.json({ ok: true });
    return calls.filter(call => call.path.endsWith('/reset-password')).length === 1
      ? Response.json({ code: 'private-daily-limit-detail' }, { status: 429, headers: { 'retry-after': '86400' } })
      : Response.json({ ok: true });
  });
  const harness = view(cooldown); await submit(harness); enterCredentials(harness); await submit(harness);
  const sendScope = `better-auth:password-recovery:send:${email}`;
  const confirmScope = `better-auth:password-recovery:confirm:${email}`;
  assert.equal(budgets.get(sendScope), 300);
  assert.equal(budgets.get(confirmScope), 86400);
  assert.equal(find(harness.render(props), node => node?.props?.children === 'Validar de nuevo en 24 h').props.disabled, true);
  await submit(harness); assert.equal(calls.length, 2);
  find(harness.render(props), node => node?.props?.children === 'Volver al paso del correo').props.onClick();
  budgets.set(sendScope, 0);
  await submit(harness); enterCredentials(harness); await submit(harness);
  assert.equal(calls.length, 3, 'requesting another challenge does not reset the daily validation cooldown');
  assert.equal(find(harness.render(props), node => node?.props?.children === 'Validar de nuevo en 24 h').props.disabled, true);
  assert.doesNotMatch(html(harness), /private-daily|1440:00|Contraseña actualizada/);
  budgets.set(confirmScope, 0); harness.render(props);
  assert.equal(calls.length, 3, 'daily validation expiry never redeems automatically');
  await submit(harness);
  assert.equal(calls.length, 4);
  assert.match(html(harness), /Contraseña actualizada/);
  harness.unmount();
});

test('a definitive send rejection does not advance or reveal suspended, deleted or missing account states', async t => {
  for (const status of [400, 401, 403, 404]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 'SUSPENDED_USER', message: 'private-status-details' }, { status }));
    const harness = view(); await submit(harness);
    assert.equal(find(harness.render(props), field('recovery-otp')), undefined);
    assert.doesNotMatch(html(harness), /private-|SUSPENDED|suspendid|Contraseña actualizada|Te enviamos/);
    harness.unmount();
  }
});

test('malformed successful-looking reset payloads or rejected codes never display success or install authority', async t => {
  for (const [status, body] of [[201, { ok: true }], [202, { ok: true }], [400, { ok: true }], [403, { ok: true }], [429, { ok: true }], [503, { ok: true }],
    [200, {}], [200, { ok: 'true' }], [200, { ok: true, token: 'private-token' }], [200, { ok: true, emailVerified: true }]]) {
    const paths = [];
    t.mock.method(globalThis, 'fetch', async path => {
      paths.push(path);
      return path.endsWith('/request-password-reset') ? Response.json({ ok: true }) : Response.json(body, { status });
    });
    const harness = view(); await submit(harness); enterCredentials(harness); await submit(harness);
    assert.doesNotMatch(html(harness), /Contraseña actualizada|private-token|dashboard/);
    assert.ok(find(harness.render(props), field('recovery-otp')));
    assert.equal(paths.length, 2);
    harness.unmount();
  }
});

test('accepted or created send responses keep an unconfirmed challenge instead of claiming a recovery acknowledgement', async t => {
  for (const status of [201, 202]) {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ok: true }, { status }); });
    const harness = view(); await submit(harness);
    assert.equal(calls, 1);
    assert.ok(find(harness.render(props), field('recovery-otp')));
    assert.match(html(harness), /No pudimos confirmar el envío/);
    assert.doesNotMatch(html(harness), /Si el correo corresponde a una cuenta habilitada|Contraseña actualizada/);
    harness.unmount();
  }
});

test('double submission is locked and a resend or reset remains bound to the shown original recipient', async t => {
  const calls = []; let resolveFirst;
  t.mock.method(globalThis, 'fetch', (path, options) => {
    calls.push({ path, body: JSON.parse(options.body) });
    return calls.length === 1 ? new Promise(resolve => { resolveFirst = resolve; }) : Promise.resolve(Response.json({ ok: true }));
  });
  const harness = view(), form = find(harness.render(props), node => node?.type === 'form');
  const pending = form.props.onSubmit(prevent); await form.props.onSubmit(prevent);
  assert.equal(calls.length, 1);
  change(harness, 'recovery-email', 'attempted-edit@example.test');
  resolveFirst(Response.json({ ok: true })); await pending;
  // Even a stale/hidden local email edit is not used by the challenge.
  harness.state[0] = 'different@example.test';
  await find(harness.render(props), node => node?.props?.children === 'Solicitar otro código').props.onClick(prevent);
  enterCredentials(harness); await submit(harness);
  assert.deepEqual(calls.map(call => call.body.email), [email, email, email]);
  harness.unmount();
});

test('correcting the entered email clears OTP and passwords but neither mutates an account nor sends another code', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ok: true }); });
  const harness = view(); await submit(harness); enterCredentials(harness);
  find(harness.render(props), node => node?.props?.children === 'Volver al paso del correo').props.onClick();
  assert.equal(calls, 1); assert.equal(harness.state[3], ''); assert.equal(harness.state[4], ''); assert.equal(harness.state[5], '');
  assert.equal(find(harness.render(props), field('recovery-email')).props.readOnly, false);
  assert.equal(find(harness.render(props), field('recovery-otp')), undefined);
  assert.match(html(harness), /no cambia el correo registrado/);
  harness.unmount();
});

test('unmount aborts a pending recovery and a late response cannot change any form state', async t => {
  let resolveFirst, signal;
  t.mock.method(globalThis, 'fetch', (_path, options) => {
    signal = options.signal; return new Promise(resolve => { resolveFirst = resolve; });
  });
  const harness = view(); const pending = submit(harness);
  harness.unmount(); const state = [...harness.state];
  assert.equal(signal.aborted, true);
  resolveFirst(Response.json({ ok: true })); await pending;
  assert.deepEqual(harness.state, state);
});

test('delivery and redemption deadlines are bounded separately and a reset timeout never claims completion', async t => {
  const deadlines = [], original = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, 'timeout', value => { deadlines.push(value); return original(value); });
  t.mock.method(globalThis, 'fetch', async path => {
    if (path.endsWith('/request-password-reset')) return Response.json({ ok: true });
    throw new DOMException('synthetic timeout', 'TimeoutError');
  });
  const harness = view(); await submit(harness); enterCredentials(harness); await submit(harness);
  assert.deepEqual(deadlines, [30000, 12000]);
  assert.match(html(harness), /Prueba iniciar sesión con la nueva contraseña/);
  assert.doesNotMatch(html(harness), /Contraseña actualizada/);
  harness.unmount();
});

function loadPage(name, mocks) {
  const source = readFileSync(new URL(name, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react/jsx-runtime') return { jsx: React.createElement.bind(React), jsxs: React.createElement.bind(React) };
    if (Object.hasOwn(mocks, id)) return mocks[id];
    assert.fail(`Unexpected recovery-page dependency: ${id}`);
  }, module, module.exports);
  return module.exports.default;
}

test('Better Auth recovery page renders its form without redirect and the legacy Cognito reset remains separate', async () => {
  const Recovery = () => null, Legacy = () => null;
  for (const enabled of [true, false]) {
    const page = loadPage('./page.jsx', {
      'next/link': { default: link }, '../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
      '../login/MagicLinkLoginForm': { default: Legacy }, './BetterAuthPasswordRecovery': { default: Recovery },
      '@/lib/better-auth-bridge.mjs': { betterAuthEnabled: () => enabled },
    });
    const tree = await page({ searchParams: Promise.resolve({ email, verified: 'true', auth: 'arbitrary' }) });
    const actual = find(tree, node => node?.type === (enabled ? Recovery : Legacy));
    assert.ok(actual); assert.equal(actual.props.initialEmail, email);
    assert.equal(find(tree, node => node?.type === (enabled ? Legacy : Recovery)), undefined);
    if (!enabled) assert.equal(actual.props.initialMode, 'reset');
  }
});

test('the actual login page exposes recovery in both modes without putting a private email into its recovery URL', async () => {
  for (const enabled of [true, false]) {
    const page = loadPage('../login/page.jsx', {
      'next/link': { default: link }, '../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
      './MagicLinkLoginForm': { default: () => null }, '@/lib/better-auth-bridge.mjs': { betterAuthEnabled: () => enabled },
      '../register/registration-model.mjs': { registrationLoginUrl, registrationUrl },
    });
    const tree = await page({ searchParams: Promise.resolve({ email, mode: 'password' }) });
    const recoveryLink = find(tree, node => node?.props?.href === '/forgot-password');
    assert.ok(recoveryLink);
    assert.equal(recoveryLink.props.children, enabled ? 'Crear o cambiar contraseña' : 'Recuperar contraseña');
    assert.equal(recoveryLink.props.href.includes(email), false);
  }
});
