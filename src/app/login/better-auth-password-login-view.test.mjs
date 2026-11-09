import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from '../register/registration-view-test-harness.mjs';
import * as login from './better-auth-login.mjs';
import * as registration from '../register/registration-model.mjs';

const email = 'member@example.test';
const password = ' Raw synthetic password ';
const event = { preventDefault() {} };
const proof = { ok: true, user: { id: 'synthetic', email, emailVerified: true } };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function view() {
  const events = [];
  const props = { email: ` MEMBER@EXAMPLE.TEST `, setEmail() {},
    onBusy: value => events.push(['busy', value]), onError: value => events.push(['error', value]),
    onNotice: value => events.push(['notice', value]), onVerified: (...values) => events.push(['verified', ...values]),
    rememberReferral: value => events.push(['referral', value]),
    onRegistrationRequired: value => events.push(['register', value]) };
  const harness = registrationViewHarness('../login/BetterAuthPasswordLogin.jsx', {
    'next/link': { default: ({ children, ...attributes }) => React.createElement('a', attributes, children) },
    '../register/RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub,
      RegistrationPassword: ({ visible: _visible, onToggle: _onToggle, ...attributes }) => registrationFieldStub(attributes) },
    './better-auth-login.mjs': login, '../register/registration-model.mjs': registration,
  });
  const render = () => harness.render(props);
  const form = () => find(render(), node => node?.type === 'form');
  const changePassword = value => find(render(), node => node?.props?.id === 'password-login-password')
    .props.onChange({ target: { value } });
  changePassword(password);
  return { ...harness, props, events, render, form, changePassword, submit: () => form().props.onSubmit(event) };
}

test('passwordless members get an explicit recovery path using the original email, without a lookup or automatic code', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('rendering recovery help cannot query or send a code'));
  const harness = view(), tree = harness.render(), html = renderToStaticMarkup(tree);
  assert.match(html, /Si ya creaste una contraseña/);
  assert.match(html, /aunque nunca hayas creado una contraseña/);
  assert.match(html, /¿No tienes contraseña o la olvidaste\?/);
  assert.match(html, /Usa el correo original de tu cuenta/);
  assert.match(html, /No necesitas cambiarlo ni crear otra cuenta/);
  assert.match(html, /solicita el código de recuperación, escríbelo y repite tu nueva contraseña para confirmarla/);
  assert.match(html, /Los pasos y límites de recuperación se muestran allí/);
  assert.match(html, /ese código no es el de inicio de sesión/);
  assert.match(html, /No compartas tu contraseña ni tus códigos/);
  assert.doesNotMatch(html, /5 solicitudes|10 intentos|24 horas|recibirás|Te enviamos|te quedan/);
  assert.doesNotMatch(html, /contraseña que creaste al registrarte/);
  const recovery = find(tree, node => node?.props?.href === '/forgot-password' && /Crear o cambiar/.test(String(node.props.children)));
  assert.ok(recovery);
  assert.match(recovery.props.children, /Crear o cambiar contraseña con un código/);
  assert.equal(recovery.props.href.includes('@'), false, 'contact details stay out of the link');
  harness.unmount();
});

test('password login publishes only fresh POST session proof, preserves the exact password and never requests a session preflight', async t => {
  const calls = [], reply = deferred();
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, options });
    assert.equal(path, '/api/auth/sign-in/email');
    return reply.promise;
  });
  const harness = view(), pending = harness.submit();
  assert.deepEqual(calls.map(call => call.path), ['/api/auth/sign-in/email']);
  assert.deepEqual(JSON.parse(calls[0].options.body), { email, password });
  assert.equal(harness.events.some(([name]) => ['verified', 'referral'].includes(name)), false);
  assert.equal(harness.form().props['aria-busy'], true);
  reply.resolve(Response.json(proof)); await pending;
  assert.deepEqual(harness.events.filter(([name]) => ['verified', 'referral'].includes(name)), [
    ['referral', email], ['verified', email],
  ]);
  assert.equal(harness.state[0], '');
  assert.equal(harness.form().props['aria-busy'], false);
  assert.equal(calls.length, 1);
  for (const { options } of calls) {
    assert.equal(options.credentials, 'same-origin'); assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error'); assert.equal(options.signal.aborted, false);
  }
  harness.unmount();
});

test('password login locks simultaneous submissions and releases the lock after a definitive error', async t => {
  const reply = deferred(); let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return calls === 1 ? reply.promise : Response.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 }); });
  const harness = view(), handler = harness.form().props.onSubmit;
  const pending = handler(event); await handler(event); await harness.submit();
  assert.equal(calls, 1);
  reply.resolve(Response.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 })); await pending;
  await harness.submit(); assert.equal(calls, 2);
  assert.equal(harness.events.some(([name]) => ['verified', 'referral'].includes(name)), false);
  harness.unmount();
});

test('unmount before sign-in acknowledgement aborts the request and ignores late success or registration redirection', async t => {
  for (const response of [Response.json(proof), Response.json({ code: 'REGISTRATION_REQUIRED' }, { status: 409 })]) {
    const reply = deferred(), calls = [];
    t.mock.method(globalThis, 'fetch', async (path, options) => { calls.push({ path, options }); return reply.promise; });
    const harness = view(), pending = harness.submit();
    harness.unmount(); const state = [...harness.state], events = [...harness.events];
    assert.equal(calls[0].options.signal.aborted, true);
    reply.resolve(response); await pending;
    assert.equal(calls.length, 1); assert.deepEqual(harness.state, state); assert.deepEqual(harness.events, events);
  }
});

test('unmount during response decoding suppresses late verification, referral and error callbacks', async t => {
  const body = deferred(), decoding = deferred();
  t.mock.method(globalThis, 'fetch', async () => ({ status: 200, ok: true, json() { decoding.resolve(); return body.promise; } }));
  const harness = view(), pending = harness.submit(); await decoding.promise;
  harness.unmount(); const state = [...harness.state], events = [...harness.events];
  body.resolve(proof); await pending;
  assert.deepEqual(harness.state, state); assert.deepEqual(harness.events, events);
});

test('a password POST outage never publishes verified success, and an explicit retry needs no OTP or session GET', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, options });
    assert.equal(path, '/api/auth/sign-in/email');
    return calls.length === 1 ? Response.json({ error: 'unavailable' }, { status: 503 }) : Response.json(proof);
  });
  const harness = view(); await harness.submit();
  assert.equal(harness.events.some(([name]) => ['verified', 'referral'].includes(name)), false);
  await harness.submit();
  assert.deepEqual(harness.events.filter(([name]) => name === 'verified'), [['verified', email]]);
  assert.equal(calls.length, 2);
  harness.unmount();
});

test('a disposed password form cannot overwrite the verified result of a newer form when replies arrive out of order', async t => {
  const first = deferred(); let signIns = 0;
  t.mock.method(globalThis, 'fetch', async path => {
    assert.equal(path, '/api/auth/sign-in/email');
    signIns++; return signIns === 1 ? first.promise : Response.json(proof);
  });
  const previous = view(), pending = previous.submit(); previous.unmount();
  const before = [...previous.events], state = [...previous.state];
  const current = view(); await current.submit();
  first.resolve(Response.json(proof)); await pending;
  assert.deepEqual(previous.events, before); assert.deepEqual(previous.state, state);
  assert.deepEqual(current.events.filter(([name]) => name === 'verified'), [['verified', email]]);
  current.unmount();
});

test('fresh password session proof reaches its continuation without consulting a legacy or unavailable session summary', async t => {
  const paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return path === '/api/auth/sign-in/email' ? Response.json(proof)
      : Response.json({ authenticated: false, mode: 'better-auth', state: 'review_required' }, { status: 503 });
  });
  const harness = view(); await harness.submit();
  assert.deepEqual(paths, ['/api/auth/sign-in/email']);
  assert.deepEqual(harness.events.filter(([name]) => name === 'verified'), [['verified', email]]);
  assert.equal(harness.events.some(([name, value]) => name === 'notice' && /revisión|aprobación|vinculación/.test(value)), false);
  harness.unmount();
});

test('malformed or rejected sign-in proof cannot trigger a canonical lookup, referral or verified screen', async t => {
  for (const payload of [{ ok: true }, { ...proof, user: { ...proof.user, emailVerified: false } }, { ...proof, user: { ...proof.user, email: 'another@example.test' } }]) {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(payload); });
    const harness = view(); await harness.submit();
    assert.equal(calls, 1); assert.equal(harness.events.some(([name]) => ['verified', 'referral'].includes(name)), false);
    harness.unmount();
  }
});

test('local password-login validation focuses and explains the first invalid field without a provider request', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', () => { calls++; assert.fail('invalid form reached the provider'); });
  const harness = view(), focused = [];
  harness.props.email = 'invalid';
  find(harness.render(), node => node?.props?.id === 'password-login-email').props.inputRef.current = { focus() { focused.push('email'); } };
  await harness.submit();
  assert.deepEqual(focused, ['email']);
  assert.match(find(harness.render(), node => node?.props?.id === 'password-login-email').props.error, /correo electrónico válido/);
  harness.props.email = email; harness.changePassword('');
  find(harness.render(), node => node?.props?.id === 'password-login-password').props.inputRef.current = { focus() { focused.push('password'); } };
  await harness.submit();
  assert.deepEqual(focused, ['email', 'password']);
  assert.match(find(harness.render(), node => node?.props?.id === 'password-login-password').props.error, /contraseña/);
  harness.changePassword(password);
  assert.equal(find(harness.render(), node => node?.props?.id === 'password-login-password').props.error, undefined);
  assert.equal(harness.state[0], password, 'input bytes remain unchanged');
  assert.equal(calls, 0); harness.unmount();
});
