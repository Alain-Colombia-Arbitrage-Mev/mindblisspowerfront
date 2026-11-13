import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ts from 'typescript';
import * as cooldown from '../../lib/useResendCooldown.js';
import * as otp from '../../lib/email-otp-client.mjs';
import * as attribution from '../../lib/referral-attribution.js';
import * as referralSync from '../../lib/referral-sync.mjs';
import * as registration from '../register/registration-model.mjs';
import * as contacts from '../register/contact-phone-model.mjs';
import * as recovery from '../forgot-password/password-recovery-model.mjs';
import * as auth from './better-auth-login.mjs';
import * as deadline from '../../lib/browser-request-deadline.mjs';
import * as walletSetup from '../../lib/wallet-setup-handoff.mjs';
import * as sessionSync from '../../lib/member-session-sync.mjs';
import * as sessionRecovery from '../../lib/registration-session-recovery.mjs';

// Real installed ReactDOM/StrictMode and the actual recipient cooldown hook.
// Only host markup, browser facilities and HTTP transport are synthetic.
const require = createRequire(import.meta.url);
const email = 'fanout-fixture@example.test';
const event = { preventDefault() {} };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
class HostNode {
  constructor(type, name, ownerDocument, text = '') {
    this.nodeType = type;
    this.nodeName = name;
    this.tagName = name;
    this.localName = name.toLowerCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.childNodes = [];
    this.attributes = new Map();
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.namespaceURI = 'http://www.w3.org/1999/xhtml';
    this.nodeValue = text;
  }
  appendChild(child) {
    child.parentNode?.removeChild(child);
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }
  removeChild(child) {
    const index = this.childNodes.indexOf(child);
    assert.ok(index >= 0);
    this.childNodes.splice(index, 1);
    child.parentNode = null;
    return child;
  }
  insertBefore(child, before) {
    child.parentNode?.removeChild(child);
    const index = this.childNodes.indexOf(before);
    assert.ok(index >= 0);
    child.parentNode = this;
    this.childNodes.splice(index, 0, child);
    return child;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener() {}
  removeEventListener() {}
  focus() { this.ownerDocument.activeElement = this; }
  get firstChild() { return this.childNodes[0] || null; }
  get textContent() { return this.nodeType === 3 ? this.nodeValue : this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) {
    for (const child of this.childNodes) child.parentNode = null;
    this.childNodes = [];
    if (value !== '') this.appendChild(new HostNode(3, '#text', this.ownerDocument, String(value)));
  }
}
function dom() {
  const document = new HostNode(9, '#document', null);
  document.ownerDocument = document;
  document.createElement = name => new HostNode(1, name.toUpperCase(), document);
  document.createElementNS = (_namespace, name) => document.createElement(name);
  document.createTextNode = text => new HostNode(3, '#text', document, text);
  document.documentElement = document.appendChild(document.createElement('html'));
  document.body = document.documentElement.appendChild(document.createElement('body'));
  document.activeElement = document.body;
  const destinations = [], navigationMethods = [], sessionValues = new Map();
  const window = {
    document, Node: HostNode, HTMLElement: HostNode, HTMLIFrameElement: class {},
    sessionStorage: { getItem: key => sessionValues.get(key) ?? null, setItem: (key, value) => sessionValues.set(key, value), removeItem: key => sessionValues.delete(key) },
    location: { search: '', assign: path => { navigationMethods.push('assign'); destinations.push(path); },
      replace: path => { navigationMethods.push('replace'); destinations.push(path); } },
    addEventListener() {}, removeEventListener() {}, getSelection: () => null,
  };
  document.defaultView = window;
  return { window, document, destinations, navigationMethods, sessionValues, container: document.body.appendChild(document.createElement('main')) };
}
function nodes(root, predicate) {
  return [root, ...root.childNodes.flatMap(child => nodes(child, () => true))].filter(predicate);
}
function props(node) {
  const key = Object.keys(node).find(key => key.startsWith('__reactProps$'));
  assert.ok(key, `Expected a React-owned ${node.nodeName}`);
  return node[key];
}

function component(file) {
  const field = ({ inputRef, label, error, helper, visible: _visible, onToggle: _toggle, ...attributes }) =>
    React.createElement('label', null, label, React.createElement('input', { ...attributes, ref: inputRef }), error || helper);
  const fields = { RegistrationField: field, RegistrationPassword: field,
    RegistrationButton: ({ loading: _loading, children, ...attributes }) => React.createElement('button', attributes, children) };
  const mocks = {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: ({ children, ...attributes }) => React.createElement('a', attributes, children) },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
    '@/lib/useResendCooldown': cooldown, '@/lib/email-otp-client.mjs': otp,
    '@/lib/password': { checkPassword: () => ({ results: [] }), isValidPassword: () => true },
    '@/lib/referral-attribution': attribution, '@/lib/referral-sync.mjs': referralSync,
    '@/lib/browser-request-deadline.mjs': deadline, '@/lib/wallet-setup-handoff.mjs': walletSetup, '@/lib/member-session-sync.mjs': sessionSync,
    '@/lib/registration-session-recovery.mjs': sessionRecovery,
    './BetterAuthPasswordLogin': { default: () => null }, './SocialLoginButtons': { default: () => null },
    './better-auth-login.mjs': auth, '../register/registration-model.mjs': registration, './registration-model.mjs': registration,
    './RegistrationFields': fields, '../register/RegistrationFields': fields,
    './ContactPhoneField': { default: () => null }, './contact-phone-model.mjs': contacts,
    './password-recovery-model.mjs': recovery,
  };
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    assert.ok(Object.hasOwn(mocks, id), 'Unexpected offline dependency: ' + id); return mocks[id];
  }, module, module.exports);
  return module.exports.default;
}
function activityTarget(target) {
  const listeners = new Map();
  target.addEventListener = (type, listener) => { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(listener); };
  target.removeEventListener = (type, listener) => listeners.get(type)?.delete(listener);
  return type => { for (const listener of [...(listeners.get(type) || [])]) listener({ type }); };
}
async function fixture(t, transport) {
  const host = dom(), saved = new Map(), calls = [], timers = new Map();
  const windowEvent = activityTarget(host.window), documentEvent = activityTarget(host.document);
  let now = 1_800_000_000_000, nextTimer = 0, root;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'setInterval', (callback, milliseconds) => {
    assert.equal(milliseconds, 1000); const timer = ++nextTimer; timers.set(timer, callback); return timer;
  });
  t.mock.method(globalThis, 'clearInterval', timer => timers.delete(timer));
  for (const [key, value] of Object.entries({ window: host.window, document: host.document, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  t.mock.method(globalThis, 'fetch', (path, init) => {
    calls.push({ path, body: init?.body ? JSON.parse(init.body) : undefined }); return transport(path, init);
  });
  const unmount = async () => { if (root) { const current = root; root = undefined; await act(async () => current.unmount()); } };
  t.after(async () => { await unmount(); for (const [key, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  } });
  return { ...host, calls, timers, unmount,
    async mount(Form, attributes) { assert.equal(root, undefined); root = createRoot(host.container);
      await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Form, attributes)))); },
    async activity(seconds = 1) { await act(async () => {
      now += seconds * 1000; for (const callback of [...timers.values()]) callback();
      windowEvent('focus'); windowEvent('pageshow'); documentEvent('visibilitychange');
    }); },
    async change(id, value) { const field = nodes(host.container, node => node.getAttribute('id') === id)[0];
      assert.ok(field, 'Missing input ' + id); await act(async () => props(field).onChange({ target: { value, checked: value } })); },
    submit() { const form = nodes(host.container, node => node.nodeName === 'FORM')[0]; assert.ok(form); return props(form).onSubmit; },
  };
}
const scenarios = [
  { name: 'login', file: './MagicLinkLoginForm.jsx', initial: { authMode: 'better-auth', initialEmail: email },
    sendPath: '/api/auth/email-otp/send-verification-otp', verifyPath: '/api/auth/sign-in/email-otp', codeField: 'login-code',
    sendAck: () => Response.json({ ok: true }), verifyAck: () => Response.json({ ok: true, user: { id: 'synthetic-fixture-user', email, emailVerified: true } }) },
  { name: 'registration', file: '../register/BetterAuthRegisterForm.jsx', initial: {},
    sendPath: '/api/auth/register', verifyPath: '/api/auth/register/confirm', codeField: 'code',
    sendAck: () => Response.json({ ok: true, mode: 'better-auth', email, userConfirmed: false, requiresConfirmation: true, resendAfter: 300 }),
    verifyAck: () => Response.json({ ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true }) },
  { name: 'password recovery', file: '../forgot-password/BetterAuthPasswordRecovery.jsx', initial: { initialEmail: email },
    sendPath: '/api/auth/email-otp/request-password-reset', verifyPath: '/api/auth/email-otp/reset-password', codeField: 'recovery-otp',
    sendAck: () => Response.json({ ok: true }), verifyAck: () => Response.json({ ok: true }) },
];
for (const scenario of scenarios) {
  test(scenario.name + ': real StrictMode, cooldown ticks and browser activity never send unsolicited OTP; bursts dispatch once', async t => {
    const sending = deferred(), sent = deferred(), verifying = deferred(), verified = deferred();
    const ui = await fixture(t, path => {
      if (path === scenario.sendPath) { sending.resolve(); return sent.promise; }
      if (path === scenario.verifyPath) { verifying.resolve(); return verified.promise; }
      if (path === '/api/auth/session?view=access') return Response.json({ authenticated: true, mode: 'better-auth', email });
      assert.fail('Unexpected offline request: ' + path);
    });
    const Form = component(scenario.file);
    for (let i = 0; i < 3; i++) {
      await ui.mount(Form, scenario.initial); await ui.activity(); assert.equal(ui.calls.length, 0);
      await ui.unmount(); assert.equal(ui.timers.size, 0);
    }
    await ui.mount(Form, scenario.initial);
    if (scenario.name === 'registration') {
      await ui.change('fullName', 'Synthetic Member'); await ui.change('email', email); await ui.change('acceptsPrivacy', true);
    }
    const send = ui.submit(); let sendPending;
    await act(async () => { sendPending = send(event); await sending.promise;
      await Promise.all(Array.from({ length: 20 }, () => send(event))); });
    assert.equal(ui.calls.length, 1, 'twenty-one simultaneous send callbacks dispatch one request');
    await act(async () => { sent.resolve(scenario.sendAck()); await sendPending; });
    assert.equal(ui.timers.size, 1, 'the actual cooldown hook owns exactly one countdown timer after StrictMode replay');
    for (let i = 0; i < 10; i++) await ui.activity(10);
    assert.equal(ui.calls.length, 1, 'countdown, refocus, pageshow and visibility events never dispatch a code');
    const resend = nodes(ui.container, node => node.nodeName === 'BUTTON' && /^Reenviar en|^Solicitar de nuevo en/.test(node.textContent))[0];
    assert.ok(resend, 'a visible manual resend remains in its cooldown');
    assert.equal(props(resend).disabled, true);
    await act(async () => { await props(resend).onClick(event); });
    assert.equal(ui.calls.length, 1, 'even invoking the disabled resend callback cannot dispatch during cooldown');
    await ui.change(scenario.codeField, '001234');
    if (scenario.name === 'password recovery') {
      await ui.change('recovery-password', 'Synthetic-Password-123'); await ui.change('recovery-confirm-password', 'Synthetic-Password-123');
    }
    const confirm = ui.submit(); let verifyPending;
    await act(async () => { verifyPending = confirm(event); await verifying.promise;
      await Promise.all(Array.from({ length: 20 }, () => confirm(event))); });
    assert.equal(ui.calls.length, 2, 'twenty-one simultaneous verify callbacks dispatch one request');
    await act(async () => { verified.resolve(scenario.verifyAck()); await verifyPending; });
    const expected = [scenario.sendPath, scenario.verifyPath];
    if (scenario.name === 'login') expected.push('/api/auth/session?view=access');
    assert.deepEqual(ui.calls.map(call => call.path), expected);
    for (let i = 0; i < 3; i++) await ui.activity(120);
    assert.deepEqual(ui.calls.map(call => call.path), expected, 'completed authentication never resends or verifies itself again');
    assert.equal(ui.timers.size, 0, 'the elapsed countdown stops its timer without dispatching a code');
    assert.equal(ui.calls[0].body.email, email); assert.equal(ui.calls[1].body.email, email);
  });
}
test('registration resume and login registration-required redirect mount without requesting another email', async t => {
  const ui = await fixture(t, () => Response.json({ code: 'REGISTRATION_REQUIRED' }, { status: 400 }));
  await ui.mount(component('./MagicLinkLoginForm.jsx'), { authMode: 'better-auth', initialEmail: email });
  await act(async () => ui.submit()(event));
  assert.equal(ui.calls.length, 1); assert.match(ui.destinations[0], /^\/register\?reason=registration-required$/);
  await ui.unmount();
  await ui.mount(component('../register/BetterAuthRegisterForm.jsx'), { initialSearch: 'reason=registration-required' });
  assert.equal(ui.calls.length, 1); await ui.activity(301); assert.equal(ui.calls.length, 1);
  await ui.unmount();
  await ui.mount(component('../register/BetterAuthRegisterForm.jsx'), { initialSearch: 'email=' + encodeURIComponent(email) + '&resume=1' });
  assert.match(ui.container.textContent, /Verifica tu correo/);
  for (let i = 0; i < 3; i++) await ui.activity(120);
  assert.deepEqual(ui.calls.map(call => call.path), ['/api/auth/email-otp/send-verification-otp']);
});
