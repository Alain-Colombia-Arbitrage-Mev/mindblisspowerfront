import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as model from './registration-model.mjs';
import * as contacts from './contact-phone-model.mjs';
import * as emailOtp from '../../lib/email-otp-client.mjs';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from './registration-view-test-harness.mjs';

const contactView = ({ id, label, value }) => React.createElement('div', null, label, React.createElement('input', { id, value: value.national, readOnly: true }));
const passwordField = ({ visible: _visible, onToggle: _onToggle, ...props }) => registrationFieldStub(props);
const valid = { fullName: 'Synthetic Member', email: 'member@example.test', password: 'Synthetic Long Password 123', confirmPassword: 'Synthetic Long Password 123', acceptsPrivacy: true };
function view(cooldown = { active: false, label: '', start() {} }) {
  return registrationViewHarness('./BetterAuthRegisterForm.jsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'lucide-react': { ArrowLeft: () => null, CheckCircle2: () => null, Mail: () => null, UserPlus: () => null },
    '../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
    '@/lib/useResendCooldown': { useResendCooldown: () => cooldown, suggestEmailFix: () => '' },
    '@/lib/referral-attribution': { bindReferralCodeToEmail() {} },
    '@/lib/email-otp-client.mjs': emailOtp,
    './RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub, RegistrationPassword: passwordField },
    './ContactPhoneField': { default: contactView },
    './contact-phone-model.mjs': contacts,
    './registration-model.mjs': model,
  });
}
const props = { initialSearch: 'ref=MP-REFERRAL&side=R' };
function enterValid(harness, values = valid) {
  let tree = harness.render(props);
  for (const [id, value] of Object.entries(values)) {
    const field = find(tree, node => node?.props?.id === id);
    field.props.onChange(id.startsWith('contact') ? value : { target: { value, checked: value } });
    tree = harness.render(props);
  }
  return tree;
}
const submit = tree => find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
const signupAck = () => Response.json({ ok: true, mode: 'better-auth', email: valid.email, userConfirmed: false, requiresConfirmation: true, resendAfter: 300 });

test('registration remains email-only with the existing two-step design and optional contacts, never a phone challenge', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('render must not send messages or create an account'));
  const harness = view();
  const html = renderToStaticMarkup(harness.render());
  assert.match(html, /Paso 1 de 2/);
  assert.match(html, /Crear cuenta y verificar correo/);
  assert.match(html, /Contacto opcional/);
  assert.match(html, /sin validar el teléfono ni enviar mensajes/);
  assert.doesNotMatch(html, /phoneConsent|Validar teléfono|código SMS|phoneNumberVerified/);
  assert.doesNotMatch(html, /checked=""/);
});

test('the login continuation consumes its one-time email but starts at details with empty credentials and unchecked consent, without a message request', t => {
  const previous = globalThis.window, data = new Map();
  globalThis.window = { sessionStorage: { getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  const destination = model.registrationRedirect('new@example.test', 'MP-REFERRED', 'R', window);
  t.mock.method(globalThis, 'fetch', () => assert.fail('arriving at registration must not create an account or send a code'));
  const harness = view(), props = { initialSearch: new URL(destination, 'https://example.test').search };
  harness.render(props);
  const tree = harness.render(props), html = renderToStaticMarkup(tree);
  assert.equal(find(tree, node => node?.props?.id === 'email').props.value, 'new@example.test');
  assert.equal(find(tree, node => node?.props?.id === 'password').props.value, '');
  assert.equal(find(tree, node => node?.props?.id === 'confirmPassword').props.value, '');
  assert.equal(find(tree, node => node?.props?.id === 'acceptsPrivacy').props.checked, false);
  assert.match(html, /Paso 1 de 2/);
  assert.match(html, /Completa tu registro y verifica tu correo/);
  assert.match(html, /No se enviará ningún código hasta/);
  assert.match(html, /MP-REFERRED/);
  assert.equal(data.size, 0);
  assert.equal(model.consumeRegistrationPrefill(window), '');
  harness.unmount();
});

test('an untrusted registration reason is a hint only and cannot skip details or validate email and identity', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('a query hint must not send an email or claim an account'));
  const harness = view(), props = { initialSearch: 'reason=registration-required&verified=1&registered=1&role=admin' };
  harness.render(props);
  const tree = harness.render(props), html = renderToStaticMarkup(tree);
  assert.equal(find(tree, node => node?.props?.id === 'email').props.value, '');
  assert.match(html, /Paso 1 de 2/);
  assert.doesNotMatch(html, /Correo verificado correctamente|Ir al acceso/);
  assert.equal(find(tree, node => node?.props?.id === 'acceptsPrivacy').props.checked, false);
  harness.unmount();
});

test('blank contacts do not block signup and do not add contact or verification claims to its request', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => { calls.push({ path, body: JSON.parse(options.body) }); return signupAck(); });
  const harness = view(); await submit(enterValid(harness));
  assert.deepEqual(calls, [{ path: '/api/auth/register', body: { fullName: valid.fullName, email: valid.email, password: valid.password, acceptsPrivacy: true,
    referralCode: 'MP-REFERRAL', preferredSide: 'R' } }]);
  const html = renderToStaticMarkup(harness.render(props));
  assert.match(html, /Paso 2 de 2/); assert.match(html, /Verifica tu correo/);
  assert.equal(harness.state[1].password, ''); assert.equal(harness.state[1].confirmPassword, '');
});

test('optional phone and WhatsApp are separate canonical contacts, with no SMS request or implicit consent', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => { calls.push({ path, body: JSON.parse(options.body) }); return signupAck(); });
  const harness = view();
  await submit(enterValid(harness, { ...valid, contactPhone: { country: 'CO', national: '300 123 4567' }, contactWhatsapp: { country: 'ES', national: '612 345 678' } }));
  assert.equal(calls.length, 1); assert.equal(calls[0].path, '/api/auth/register');
  assert.equal(calls[0].body.contactPhone, '+573001234567');
  assert.equal(calls[0].body.contactWhatsapp, '+34612345678');
  for (const key of ['phoneNumber', 'phoneConsent', 'phoneNumberVerified', 'whatsappSameAsPhone', 'proof', 'code']) assert.equal(Object.hasOwn(calls[0].body, key), false);
});

test('using the same WhatsApp number requires the explicit checkbox and tracks the current phone', async t => {
  let body;
  t.mock.method(globalThis, 'fetch', async (_path, options) => { body = JSON.parse(options.body); return signupAck(); });
  const harness = view();
  const tree = enterValid(harness, { ...valid, contactPhone: { country: 'CO', national: '3001234567' }, contactWhatsapp: { country: 'ES', national: '612345678' }, whatsappSameAsPhone: true });
  assert.equal(find(tree, node => node?.props?.id === 'contactWhatsapp'), undefined);
  await submit(tree);
  assert.equal(body.contactWhatsapp, body.contactPhone);
  assert.equal(body.contactWhatsapp, '+573001234567');
});

test('invalid optional contacts stop signup instead of dropping or silently altering the number', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('invalid optional contact must not reach the API'));
  const previousDocument = globalThis.document;
  globalThis.document = { getElementById: () => ({ focus() {} }) };
  t.after(() => { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });
  for (const changes of [{ contactPhone: { country: 'CO', national: '+34612345678' } }, { contactWhatsapp: { country: 'CO', national: '3001234567 ext 9' } }, { whatsappSameAsPhone: true }]) {
    const harness = view(); await submit(enterValid(harness, { ...valid, ...changes }));
    const tree = harness.render(props);
    assert.ok(find(tree, node => node?.props?.error));
    assert.match(renderToStaticMarkup(tree), /Paso 1 de 2/);
  }
});

test('every account must explicitly confirm email after signup, without auto-login or phone fallback', async t => {
  const paths = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    if (path === '/api/auth/register') return signupAck();
    assert.deepEqual(JSON.parse(options.body), { email: valid.email, code: '001234' });
    return Response.json({ ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: true });
  });
  const harness = view(); await submit(enterValid(harness));
  let tree = harness.render(props);
  assert.match(renderToStaticMarkup(tree), /Verifica tu correo/);
  find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
  await submit(harness.render(props));
  tree = harness.render(props);
  assert.deepEqual(paths, ['/api/auth/register', '/api/auth/register/confirm']);
  assert.match(renderToStaticMarkup(tree), /El correo está verificado/);
  assert.match(renderToStaticMarkup(tree), /Correo verificado correctamente/);
  assert.match(renderToStaticMarkup(tree), /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(renderToStaticMarkup(tree), /Código al correo/);
  assert.match(renderToStaticMarkup(tree), /si tu acceso fue preparado para una cuenta anterior/);
  assert.match(renderToStaticMarkup(tree), /Si creaste una contraseña al registrarte/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /Entra con la contraseña que creaste|no necesitas otro código/);
  assert.match(renderToStaticMarkup(tree), /mode=code/);
  assert.match(renderToStaticMarkup(tree), /vinculación requiere aprobación/);
});

test('registration cannot show verified success from URL hints, send success, an invalid code or an ambiguous response', async t => {
  for (const [status, payload] of [[400, { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: true }],
    [503, { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: true }],
    [200, { ok: true }], [200, { ok: true, mode: 'better-auth', userConfirmed: false, needsLogin: true }]]) {
    const paths = [];
    t.mock.method(globalThis, 'fetch', async path => { paths.push(path); return Response.json(payload, { status }); });
    const harness = view(), resume = { initialSearch: 'email=member%40example.test&resume=1&verified=true&registered=1' };
    let tree = harness.render(resume);
    assert.doesNotMatch(renderToStaticMarkup(tree), /Correo verificado correctamente/);
    find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
    await submit(harness.render(resume));
    tree = harness.render(resume);
    assert.doesNotMatch(renderToStaticMarkup(tree), /Correo verificado correctamente|El correo está verificado/);
    assert.deepEqual(paths, ['/api/auth/register/confirm']);
  }
});

test('an existing registration resumes email confirmation without collecting or verifying a phone', () => {
  const html = renderToStaticMarkup(view().render({ initialSearch: 'email=member%40example.test&resume=1' }));
  assert.match(html, /Verifica tu correo/);
  assert.doesNotMatch(html, /Contacto opcional|contactPhone|contactWhatsapp|SMS/);
});

test('confirmed signup delivery failure resumes pending verification without another signup, automatic email or retained password', async t => {
  const paths = [], waits = [];
  const cooldown = { active: false, label: 'Reenviar en 5:00', start(seconds) { waits.push(seconds); this.active = true; } };
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json({ code: 'EMAIL_DELIVERY_UNAVAILABLE', registrationPending: true, email: valid.email, requiresConfirmation: true, retryAfter: 300 },
      { status: 503, headers: { 'retry-after': '300' } });
  });
  const harness = view(cooldown);
  await submit(enterValid(harness));
  const tree = harness.render(props), html = renderToStaticMarkup(tree);
  assert.deepEqual(paths, ['/api/auth/register']);
  assert.deepEqual(waits, [300]);
  assert.equal(harness.state[1].password, '');
  assert.equal(harness.state[1].confirmPassword, '');
  assert.match(html, /Paso 2 de 2/);
  assert.match(html, /no pudimos enviar el código/);
  assert.match(html, /No crees otra cuenta/);
  assert.match(html, /El reenvío es manual/);
  assert.doesNotMatch(html, /El correo está verificado|recibirás un código|código enviado/);
  const resend = find(tree, node => node?.props?.children === 'Reenviar en 5:00');
  assert.equal(resend.props.disabled, true);
  await resend.props.onClick();
  assert.deepEqual(paths, ['/api/auth/register']);
});

test('unconfirmed and mismatched delivery failures do not claim a pending registration or erase credentials as accepted', async t => {
  for (const [status, body] of [[503, { code: 'REGISTRATION_UNAVAILABLE' }], [503, { code: 'EMAIL_DELIVERY_UNAVAILABLE',
    registrationPending: true, email: 'other@example.test', requiresConfirmation: true }], [200, { code: 'EMAIL_DELIVERY_UNAVAILABLE',
    registrationPending: true, email: valid.email, requiresConfirmation: true }]]) {
    const paths = [];
    t.mock.method(globalThis, 'fetch', async path => { paths.push(path); return Response.json(body, { status }); });
    const harness = view(); await submit(enterValid(harness));
    assert.deepEqual(paths, ['/api/auth/register']);
    assert.equal(harness.state[1].password, valid.password);
    assert.match(renderToStaticMarkup(harness.render(props)), /Paso 1 de 2/);
  }
});

test('real registration and explicit resend handlers wait 30 seconds, but received-code verification remains 12 seconds', async t => {
  const deadlines = [], paths = [];
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, 'timeout', milliseconds => { deadlines.push(milliseconds); return timeout(milliseconds); });
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    if (path === '/api/auth/register') return signupAck();
    return Response.json(JSON.parse(options.body).resend === true
      ? { ok: true, mode: 'better-auth', resendAfter: 300 }
      : { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: true });
  });
  const harness = view();
  await submit(enterValid(harness));
  let tree = harness.render(props);
  await find(tree, node => node?.props?.children === 'Solicitar otro código').props.onClick();
  tree = harness.render(props);
  find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
  await submit(harness.render(props));
  assert.deepEqual(deadlines, [30000, 30000, 12000]);
  assert.deepEqual(paths, ['/api/auth/register', '/api/auth/register/confirm', '/api/auth/register/confirm']);
});
