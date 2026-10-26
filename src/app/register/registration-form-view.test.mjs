import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as model from './registration-model.mjs';
import * as contacts from './contact-phone-model.mjs';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from './registration-view-test-harness.mjs';

const contactView = ({ id, label, value }) => React.createElement('div', null, label, React.createElement('input', { id, value: value.national, readOnly: true }));
const passwordField = ({ visible, onToggle, ...props }) => registrationFieldStub(props);
const valid = { fullName: 'Synthetic Member', email: 'member@example.test', password: 'Synthetic Long Password 123', confirmPassword: 'Synthetic Long Password 123', acceptsPrivacy: true };
function view() {
  return registrationViewHarness('./BetterAuthRegisterForm.jsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'lucide-react': { ArrowLeft: () => null, CheckCircle2: () => null, Mail: () => null, UserPlus: () => null },
    '../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
    '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, label: '', start() {} }), suggestEmailFix: () => '' },
    '@/lib/referral-attribution': { bindReferralCodeToEmail() {} },
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
  assert.match(renderToStaticMarkup(tree), /mode=password/);
  assert.match(renderToStaticMarkup(tree), /vinculación requiere aprobación/);
});

test('an existing registration resumes email confirmation without collecting or verifying a phone', () => {
  const html = renderToStaticMarkup(view().render({ initialSearch: 'email=member%40example.test&resume=1' }));
  assert.match(html, /Verifica tu correo/);
  assert.doesNotMatch(html, /Contacto opcional|contactPhone|contactWhatsapp|SMS/);
});
