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
const session = { authenticated: true, mode: 'better-auth', email };
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
  assert.doesNotMatch(html, /contraseña que creaste al registrarte/);
  const recovery = find(tree, node => node?.props?.href === '/forgot-password');
  assert.ok(recovery);
  assert.match(recovery.props.children, /Crear o cambiar contraseña con un código/);
  assert.equal(recovery.props.href.includes('@'), false, 'contact details stay out of the link');
  harness.unmount();
});

test('password login waits for canonical access before publishing one verified screen and preserves the exact password', async t => {
  const calls = [], check = deferred(), checking = deferred();
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, options });
    if (path === '/api/auth/sign-in/email') return Response.json(proof);
    checking.resolve(); return check.promise;
  });
  const harness = view(), pending = harness.submit();
  await checking.promise;
  assert.deepEqual(calls.map(call => call.path), ['/api/auth/sign-in/email', '/api/auth/session']);
  assert.deepEqual(JSON.parse(calls[0].options.body), { email, password });
  assert.equal(harness.events.some(([name]) => ['verified', 'referral'].includes(name)), false);
  assert.equal(harness.form().props['aria-busy'], true);
  check.resolve(Response.json(session)); await pending;
  assert.deepEqual(harness.events.filter(([name]) => ['verified', 'referral'].includes(name)), [
    ['referral', email], ['verified', email, { ready: true }],
  ]);
  assert.equal(harness.state[0], '');
  assert.equal(harness.form().props['aria-busy'], false);
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

test('unmount during canonical session lookup aborts its signal and ignores a late authenticated result', async t => {
  const check = deferred(), checking = deferred(), calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, options });
    if (path === '/api/auth/sign-in/email') return Response.json(proof);
    checking.resolve(); return check.promise;
  });
  const harness = view(), pending = harness.submit(); await checking.promise;
  harness.unmount(); const state = [...harness.state], events = [...harness.events];
  assert.equal(calls[1].options.signal.aborted, true);
  check.resolve(Response.json(session)); await pending;
  assert.equal(calls.length, 2); assert.deepEqual(harness.state, state); assert.deepEqual(harness.events, events);
});

test('a disposed password form cannot overwrite the verified result of a newer form when replies arrive out of order', async t => {
  const first = deferred(); let signIns = 0;
  t.mock.method(globalThis, 'fetch', async path => {
    if (path === '/api/auth/session') return Response.json(session);
    signIns++; return signIns === 1 ? first.promise : Response.json(proof);
  });
  const previous = view(), pending = previous.submit(); previous.unmount();
  const before = [...previous.events], state = [...previous.state];
  const current = view(); await current.submit();
  first.resolve(Response.json(proof)); await pending;
  assert.deepEqual(previous.events, before); assert.deepEqual(previous.state, state);
  assert.deepEqual(current.events.filter(([name]) => name === 'verified'), [['verified', email, { ready: true }]]);
  current.unmount();
});

test('unbound access remains a reviewed-linking notice after valid password proof and never claims network access', async t => {
  t.mock.method(globalThis, 'fetch', async path => path === '/api/auth/sign-in/email' ? Response.json(proof)
    : Response.json({ authenticated: false, state: 'review_required' }));
  const harness = view(); await harness.submit();
  const verified = harness.events.find(([name]) => name === 'verified');
  assert.equal(verified[2].ready, false); assert.match(verified[2].notice, /aprobación de vinculación/);
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
