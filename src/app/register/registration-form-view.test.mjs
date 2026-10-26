import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as model from './registration-model.mjs';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from './registration-view-test-harness.mjs';

const phoneView = () => React.createElement('div', { 'data-registration-phone': true });
const passwordField = ({ visible, onToggle, ...props }) => registrationFieldStub(props);
const valid = { fullName: 'Synthetic Member', email: 'member@example.test', password: 'Synthetic Long Password 123', confirmPassword: 'Synthetic Long Password 123',
  phoneNumber: '+573001234567', acceptsPrivacy: true, phoneConsent: true };
function view(dynamicCalls = []) {
  return registrationViewHarness('./BetterAuthRegisterForm.jsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/dynamic': { default: (loader, options) => { dynamicCalls.push({ loader, options }); return phoneView; } },
    'lucide-react': { ArrowLeft: () => null, CheckCircle2: () => null, Mail: () => null, UserPlus: () => null },
    '../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
    '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, label: '', start() {} }), suggestEmailFix: () => '' },
    '@/lib/referral-attribution': { bindReferralCodeToEmail() {} },
    './RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub, RegistrationPassword: passwordField },
    './RegistrationPhoneVerification': { default: phoneView },
    './registration-model.mjs': model,
  });
}
const props = { registrationSmsRequired: true, initialSearch: 'ref=MP-REFERRAL&side=R' };
function enterValid(harness, values = valid) {
  let tree = harness.render(props);
  for (const [id, value] of Object.entries(values)) {
    const field = find(tree, node => node?.props?.id === id);
    field.props.onChange({ target: { value, checked: value } });
  }
  return harness.render(props);
}
const form = tree => find(tree, node => node?.type === 'form');
const submit = tree => form(tree).props.onSubmit({ preventDefault() {} });

test('SMS-disabled registration keeps the existing two-step design, with no phone controls or side effects', () => {
  const harness = view();
  const html = renderToStaticMarkup(harness.render());
  assert.match(html, /Paso 1 de 2/);
  assert.match(html, /Crear cuenta y verificar correo/);
  assert.doesNotMatch(html, /phoneNumber|phoneConsent|SMS|data-registration-phone/);
});

test('registration phone code stays behind an on-demand component boundary with an accessible pending state', async () => {
  const dynamicCalls = [];
  const harness = view(dynamicCalls);
  harness.render();
  assert.equal(dynamicCalls.length, 1);
  assert.equal(typeof dynamicCalls[0].loader, 'function');
  // The real dynamic import resolves only when requested, not when the initial
  // registration details or the email-confirmation step is rendered.
  assert.match(String(dynamicCalls[0].loader), /RegistrationPhoneVerification/);
  const html = renderToStaticMarkup(dynamicCalls[0].options.loading());
  assert.match(html, /role="status"/); assert.match(html, /aria-live="polite"/);
  assert.match(html, /Cargando validación del teléfono/);
  const loaded = await dynamicCalls[0].loader();
  assert.equal(loaded.default, phoneView);
});

test('SMS-required registration begins with unchecked specific consent and creates no account before phone acknowledgement', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('phone step cannot create an account'));
  const harness = view();
  const initial = renderToStaticMarkup(harness.render(props));
  assert.match(initial, /Paso 1 de 3/);
  assert.match(initial, /No autorizo publicidad, WhatsApp ni inicio de sesión por SMS/);
  assert.doesNotMatch(initial, /checked=""/);
  await submit(enterValid(harness));
  const tree = harness.render(props);
  assert.equal(form(tree), undefined);
  const phone = find(tree, node => node?.type === phoneView);
  assert.deepEqual({ email: phone.props.email, phoneNumber: phone.props.phoneNumber, consent: phone.props.consent },
    { email: valid.email, phoneNumber: valid.phoneNumber, consent: true });
});

test('only matching phone acknowledgement enables signup, which never forwards proof or verified flags', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, body: JSON.parse(options.body) });
    return Response.json({ ok: true, mode: 'better-auth', email: valid.email, userConfirmed: false, requiresConfirmation: true, resendAfter: 300 });
  });
  const harness = view(); await submit(enterValid(harness));
  let phone = find(harness.render(props), node => node?.type === phoneView);
  phone.props.onVerified({ email: 'other@example.test', phoneNumber: valid.phoneNumber, verifiedAt: Date.now() });
  assert.ok(find(harness.render(props), node => node?.type === phoneView));
  phone.props.onVerified({ email: valid.email, phoneNumber: valid.phoneNumber, verifiedAt: Date.now() });
  await submit(harness.render(props));
  assert.deepEqual(calls, [{ path: '/api/auth/register', body: { fullName: valid.fullName, email: valid.email, password: valid.password, acceptsPrivacy: true,
    referralCode: 'MP-REFERRAL', preferredSide: 'R', phoneNumber: valid.phoneNumber } }]);
  assert.equal(harness.state[9], null);
  const html = renderToStaticMarkup(harness.render(props));
  assert.match(html, /Paso 3 de 3/); assert.match(html, /Verifica tu correo/);
  assert.equal(harness.state[1].password, ''); assert.equal(harness.state[1].confirmPassword, '');
});

test('changed email, changed phone, withdrawn consent and expired phone proof require a new explicit phone step', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('stale verification cannot create an account'));
  for (const changed of ['email', 'phoneNumber', 'phoneConsent', 'expired']) {
    const harness = view(); await submit(enterValid(harness));
    const phone = find(harness.render(props), node => node?.type === phoneView);
    phone.props.onVerified({ email: valid.email, phoneNumber: valid.phoneNumber, verifiedAt: Date.now() - (changed === 'expired' ? 300001 : 0) });
    let tree = harness.render(props);
    if (changed !== 'expired') {
      const value = changed === 'email' ? 'changed@example.test' : changed === 'phoneNumber' ? '+573009999999' : false;
      find(tree, node => node?.props?.id === changed).props.onChange({ target: { value, checked: value } });
      assert.equal(harness.state[9], null);
      tree = harness.render(props);
      if (changed === 'phoneConsent') {
        find(tree, node => node?.props?.id === changed).props.onChange({ target: { checked: true } });
        tree = harness.render(props);
      }
    }
    await submit(tree);
    assert.ok(find(harness.render(props), node => node?.type === phoneView));
  }
});

test('spent or invalid proof responses return to phone verification without retrying signup or sending SMS', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ code: 'REGISTRATION_PHONE_REQUIRED' }, { status: 409 }); });
  const harness = view(); await submit(enterValid(harness));
  find(harness.render(props), node => node?.type === phoneView).props.onVerified({ email: valid.email, phoneNumber: valid.phoneNumber, verifiedAt: Date.now() });
  await submit(harness.render(props));
  assert.equal(calls, 1); assert.equal(harness.state[9], null);
  const tree = harness.render(props);
  assert.ok(find(tree, node => node?.type === phoneView));
  assert.match(renderToStaticMarkup(tree), /No enviaremos un SMS automáticamente/);
});

test('a registration already awaiting email confirmation stays on its existing explicit confirmation flow', () => {
  const harness = view();
  const html = renderToStaticMarkup(harness.render({ registrationSmsRequired: true, initialSearch: 'email=member%40example.test&resume=1' }));
  assert.match(html, /Verifica tu correo/);
  assert.doesNotMatch(html, /data-registration-phone/);
});
