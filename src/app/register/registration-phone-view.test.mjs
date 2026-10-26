import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as model from './registration-phone-model.mjs';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from './registration-view-test-harness.mjs';

const sent = { ok: true, flowId: 'synthetic-registration-flow-001', resendAfter: 60, expiresIn: 300 };
const contact = { email: 'member@example.test', phoneNumber: '+573001234567', consent: true };
const flush = () => new Promise(resolve => setImmediate(resolve));
function view(request = async () => ({ response: new Response(), payload: sent })) {
  const cooldowns = [];
  const harness = registrationViewHarness('./RegistrationPhoneVerification.jsx', {
    'lucide-react': { ArrowLeft: () => null },
    '@/lib/useResendCooldown': { useResendCooldown: seconds => ({ active: false, label: '', start: value => cooldowns.push(value ?? seconds) }) },
    './RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub },
    './registration-phone-model.mjs': { ...model, requestRegistrationPhone: request },
  });
  return { ...harness, cooldowns };
}
function sendButton(tree) { return find(tree, node => node?.type === registrationButtonStub && node.props.type === 'button'); }

test('registration phone view sends nothing on mount and preserves scoped non-login SMS copy', () => {
  const harness = view(() => assert.fail('SMS must be explicit'));
  const html = renderToStaticMarkup(harness.render({ ...contact, onVerified() {}, onBack() {} }));
  assert.match(html, /El inicio de sesión seguirá usando tu correo/);
  assert.match(html, /No autorizas publicidad ni WhatsApp/);
  assert.match(html, /Enviar código SMS para validar mi teléfono/);
  harness.unmount();
});

test('actual registration send handler locks duplicate clicks and uses only the registration contact and consent', async () => {
  let finish;
  const calls = [];
  const harness = view((action, input) => { calls.push({ action, input }); return new Promise(resolve => { finish = resolve; }); });
  const props = { ...contact, onVerified() { assert.fail('send cannot verify'); }, onBack() {} };
  const button = sendButton(harness.render(props));
  button.props.onClick(); button.props.onClick();
  assert.deepEqual(calls, [{ action: 'send', input: { ...contact, consentVersion: model.REGISTRATION_PHONE_CONSENT } }]);
  finish({ response: new Response(), payload: sent }); await flush();
  assert.ok(find(harness.render(props), node => node?.type === 'form'));
  assert.deepEqual(harness.cooldowns, [60, 60]);
  harness.unmount();
});

test('malformed successful sends and rate limits never expose verification controls', async () => {
  for (const result of [{ response: new Response(), payload: {} }, { response: new Response(null, { status: 429, headers: { 'retry-after': '180' } }), payload: { error: 'private diagnostic' } }]) {
    const harness = view(async () => result);
    const props = { ...contact, onVerified() { assert.fail('no proof'); }, onBack() {} };
    sendButton(harness.render(props)).props.onClick(); await flush();
    const tree = harness.render(props);
    assert.equal(find(tree, node => node?.type === 'form'), undefined);
    assert.match(renderToStaticMarkup(tree), /no está disponible|varios intentos/);
    if (result.response.status === 429) assert.equal(harness.cooldowns.at(-1), 180);
    harness.unmount();
  }
});

test('verified contact advances only after exact acknowledgement; unknown or mismatched responses never do', async () => {
  for (const payload of [{}, { ok: true, verified: true, purpose: 'sign-in', ...contact },
    { ok: true, verified: true, purpose: 'registration', email: contact.email, phoneNumber: '+573009999999' },
    { ok: true, verified: true, purpose: 'registration', email: contact.email, phoneNumber: contact.phoneNumber }]) {
    const acknowledgements = [];
    const calls = [];
    const harness = view(async (action, input) => { calls.push({ action, input }); return { response: new Response(), payload: action === 'send' ? sent : payload }; });
    const props = { ...contact, onVerified: value => acknowledgements.push(value), onBack() {} };
    sendButton(harness.render(props)).props.onClick(); await flush();
    let tree = harness.render(props);
    find(tree, node => node?.type === registrationFieldStub).props.onChange({ target: { value: '001234' } });
    tree = harness.render(props);
    find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} }); await flush();
    assert.deepEqual(calls[1], { action: 'verify', input: { email: contact.email, phoneNumber: contact.phoneNumber, flowId: sent.flowId, code: '001234' } });
    assert.equal(acknowledgements.length, payload.purpose === 'registration' && payload.phoneNumber === contact.phoneNumber ? 1 : 0);
    if (acknowledgements.length) assert.deepEqual(Object.keys(acknowledgements[0]).sort(), ['email', 'phoneNumber', 'verifiedAt']);
    harness.unmount();
  }
});

test('contact changes and unmount cancel requests and suppress late successful SMS responses', async () => {
  for (const unmount of [false, true]) {
    let finish, signal;
    const harness = view((action, input, options) => { signal = options.signal; return new Promise(resolve => { finish = resolve; }); });
    const props = { ...contact, onVerified() { assert.fail('stale response verified'); }, onBack() {} };
    sendButton(harness.render(props)).props.onClick();
    if (unmount) harness.unmount();
    else harness.render({ ...props, email: 'changed@example.test' });
    assert.equal(signal.aborted, true);
    finish({ response: new Response(), payload: sent }); await flush();
    assert.equal(harness.state[0], null);
    harness.unmount();
  }
});

test('a late verification acknowledgement cannot validate a different contact or an unmounted registration step', async () => {
  for (const changed of ['email', 'phoneNumber', 'unmount']) {
    let finish, signal;
    const acknowledgements = [];
    const harness = view(async (action, input, options) => {
      if (action === 'send') return { response: new Response(), payload: sent };
      signal = options.signal;
      return new Promise(resolve => { finish = resolve; });
    });
    const props = { ...contact, onVerified: value => acknowledgements.push(value), onBack() {} };
    sendButton(harness.render(props)).props.onClick(); await flush();
    find(harness.render(props), node => node?.type === registrationFieldStub).props.onChange({ target: { value: '001234' } });
    find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
    if (changed === 'unmount') harness.unmount();
    else harness.render({ ...props, [changed]: changed === 'email' ? 'changed@example.test' : '+573009999999' });
    assert.equal(signal.aborted, true);
    finish({ response: new Response(), payload: { ok: true, verified: true, purpose: 'registration', email: contact.email, phoneNumber: contact.phoneNumber } });
    await flush(); assert.deepEqual(acknowledgements, []);
    harness.unmount();
  }
});

test('an expired pending code cannot call verification or silently send a replacement SMS', async t => {
  let clock = 1700000000000;
  t.mock.method(Date, 'now', () => clock);
  const calls = [];
  const harness = view(async action => { calls.push(action); return { response: new Response(), payload: sent }; });
  const props = { ...contact, onVerified() { assert.fail('expired code verified'); }, onBack() {} };
  sendButton(harness.render(props)).props.onClick(); await flush();
  find(harness.render(props), node => node?.type === registrationFieldStub).props.onChange({ target: { value: '001234' } });
  clock += 300001;
  find(harness.render(props), node => node?.type === 'form').props.onSubmit({ preventDefault() {} }); await flush();
  assert.deepEqual(calls, ['send']);
  assert.match(renderToStaticMarkup(harness.render(props)), /El código SMS venció/);
  harness.unmount();
});
