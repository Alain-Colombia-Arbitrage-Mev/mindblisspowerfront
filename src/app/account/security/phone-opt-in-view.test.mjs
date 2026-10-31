import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as model from './phone-opt-in-model.mjs';

const require = createRequire(import.meta.url);
const status = { available: true, consentVersion: model.SMS_CONSENT_VERSION, optedIn: false, phoneNumber: null, phoneNumberVerified: false };
function phoneComponent({ current = status, checking = false, requiresLogin = false, consent = false, pendingPhone = '', code = '', request = async () => ({ response: new Response(), payload: { ok: true, resendAfter: 60 } }) } = {}) {
  const states = [current, checking, requiresLogin, '+573001234567', consent, pendingPhone, code, '', '', '', false];
  const changes = [];
  let stateIndex = 0;
  let refIndex = 0;
  const mockedReact = { ...React, useCallback: fn => fn, useEffect: () => {}, useState: () => {
    const index = stateIndex++;
    changes[index] = [];
    return [states[index], value => changes[index].push(value)];
  }, useRef: value => ({ current: refIndex++ === 1 ? true : value }) };
  const source = readFileSync(new URL('./PhoneOptIn.jsx', import.meta.url), 'utf8');
  const codeSource = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  // Tests exercise the real component handlers; these render-only primitives do
  // not run browser side effects, native navigation, providers or live messages.
  const field = ({ id, label, value, onChange, disabled, type = 'text' }) => React.createElement('div', null,
    React.createElement('label', { htmlFor: id }, label), React.createElement('input', { id, type, value, onChange, disabled }));
  const mocks = {
    react: mockedReact, 'next/link': { default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
    'lucide-react': { CheckCircle2: () => null, ShieldCheck: () => null, Smartphone: () => null },
    '../../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
    '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, start: () => {}, label: '' }) },
    '../../register/RegistrationFields': { RegistrationField: field, RegistrationButton: ({ loading, children, ...props }) => React.createElement('button', props, children) },
    './phone-opt-in-model.mjs': { ...model, requestPhoneOptIn: request },
  };
  new Function('require', 'module', 'exports', codeSource)(id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return { Component: module.exports.default, changes };
}

function find(node, predicate) {
  if (predicate(node)) return node;
  return React.Children.toArray(node?.props?.children).map(child => find(child, predicate)).find(Boolean);
}

test('the real SMS view defaults to unchecked consent and cannot automatically submit or bundle marketing', () => {
  const { Component } = phoneComponent();
  const html = renderToStaticMarkup(React.createElement(Component));
  assert.match(html, /id="sms-consent"[^>]*type="checkbox"|type="checkbox"[^>]*id="sms-consent"/);
  assert.doesNotMatch(html, /checked=""/);
  assert.match(html, /No autorizo publicidad ni mensajes por WhatsApp/);
  assert.match(html, /no habilita un inicio de sesión por SMS/);
  assert.match(html, /disabled=""[^>]*>Autorizar y solicitar código SMS/);
});

test('unavailable, unsigned and failed states never render a working SMS send form', () => {
  for (const options of [{ current: { ...status, available: false } }, { current: null }, { current: null, requiresLogin: true }]) {
    const { Component } = phoneComponent(options);
    const html = renderToStaticMarkup(React.createElement(Component));
    assert.doesNotMatch(html, /id="sms-consent"|Autorizar y solicitar código SMS/);
    assert.match(html, /Continuar sin SMS/);
  }
});

test('the actual SMS send handler locks duplicate submissions and sends only explicit opt-in once', async () => {
  let finish;
  let started;
  const pending = new Promise(resolve => { finish = resolve; });
  const firstCall = new Promise(resolve => { started = resolve; });
  const calls = [];
  const { Component } = phoneComponent({ consent: true, request: async (action, input) => { calls.push({ action, input }); started(); return pending; } });
  const form = find(Component(), node => node?.type === 'form');
  form.props.onSubmit({ preventDefault() {} });
  await firstCall;
  form.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(calls, [{ action: 'send', input: { phoneNumber: '+573001234567', consent: true, consentVersion: model.SMS_CONSENT_VERSION } }]);
  finish({ response: new Response(), payload: { ok: true, resendAfter: 60 } });
  await pending;
});

test('verification uses the pending number, not an edited input, and never treats empty success as verified', async () => {
  const calls = [];
  const { Component, changes } = phoneComponent({ consent: true, pendingPhone: '+573009876543', code: '123456', request: async (action, input) => {
    calls.push({ action, input }); return { response: new Response(), payload: {} };
  } });
  const form = find(Component(), node => node?.type === 'form');
  form.props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, [{ action: 'verify', input: { phoneNumber: '+573009876543', code: '123456' } }]);
  assert.equal(changes[5].length, 0);
  assert.ok(changes[8].some(value => /No pudimos consultar/.test(value)));
});
