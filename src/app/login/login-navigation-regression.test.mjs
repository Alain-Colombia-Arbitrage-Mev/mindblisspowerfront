import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ts from 'typescript';
import * as otp from '../../lib/email-otp-client.mjs';
import * as attribution from '../../lib/referral-attribution.js';
import * as referralSync from '../../lib/referral-sync.mjs';
import * as registration from '../register/registration-model.mjs';
import * as auth from './better-auth-login.mjs';

const require = createRequire(import.meta.url);
const email = 'navigation-fixture@example.test';
const proof = () => ({ ok: true, user: { id: 'synthetic-user', email, emailVerified: true } });
const event = { preventDefault() {} };
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

// A deliberately small DOM host for the installed real ReactDOM renderer. No
// hook, scheduler, state, ref, effect or cleanup is replaced by this test.
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
  const destinations = [];
  const window = {
    document, Node: HostNode, HTMLElement: HostNode, HTMLIFrameElement: class {},
    location: { search: '', assign: path => destinations.push(path), replace: path => destinations.push(path) },
    addEventListener() {}, removeEventListener() {}, getSelection: () => null,
  };
  document.defaultView = window;
  return { window, document, destinations, container: document.body.appendChild(document.createElement('main')) };
}
function nodes(root, predicate) {
  return [root, ...root.childNodes.flatMap(child => nodes(child, () => true))].filter(predicate);
}
function props(node) {
  const key = Object.keys(node).find(key => key.startsWith('__reactProps$'));
  assert.ok(key, `Expected a React-owned ${node.nodeName}`);
  return node[key];
}
function component() {
  const mocks = {
    'react': React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/lib/useResendCooldown': { useResendCooldown: () => ({ active: false, label: '', start() {} }), isMicrosoftEmail: () => false, suggestEmailFix: () => '' },
    '@/lib/password': { checkPassword: () => ({ results: [] }), isValidPassword: () => true },
    '@/lib/referral-attribution': attribution,
    '@/lib/email-otp-client.mjs': otp,
    './BetterAuthPasswordLogin': { default: () => null },
    '@/lib/referral-sync.mjs': referralSync,
    './better-auth-login.mjs': auth,
    '../register/registration-model.mjs': registration,
  };
  const source = readFileSync(new URL('./MagicLinkLoginForm.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency: ${id}`);
    return mocks[id];
  }, module, module.exports);
  return module.exports.default;
}
async function view(t, response, { deniedStorage = false, initialRef = '' } = {}) {
  const host = dom(), saved = new Map();
  for (const [key, value] of Object.entries({ window: host.window, document: host.document, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  if (deniedStorage) for (const key of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(host.window, key, { get() { throw new Error('synthetic storage denied'); } });
  }
  const paths = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    return response(path, options);
  });
  const root = createRoot(host.container), Login = component();
  await act(async () => root.render(React.createElement(React.StrictMode, null,
    React.createElement(Login, { authMode: 'better-auth', initialEmail: email, initialRef }))));
  let mounted = true;
  const unmount = async () => { if (mounted) { await act(async () => root.unmount()); mounted = false; } };
  t.after(async () => {
    await unmount();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { ...host, paths, unmount,
    button(label) { return nodes(host.container, node => node.nodeName === 'BUTTON' && node.textContent === label)[0]; },
    async send() {
      const form = nodes(host.container, node => node.nodeName === 'FORM')[0];
      await act(async () => props(form).onSubmit(event));
    },
    async code() {
      const field = nodes(host.container, node => node.getAttribute('id') === 'login-code')[0];
      assert.ok(field);
      await act(async () => props(field).onChange({ target: { value: '001234' } }));
    },
    async confirm() {
      const form = nodes(host.container, node => node.nodeName === 'FORM')[0];
      await act(async () => props(form).onSubmit(event));
    },
  };
}
function response(path, session = { authenticated: true, mode: 'better-auth', email }) {
  if (path.endsWith('/send-verification-otp')) return Response.json({ ok: true });
  if (path === '/api/auth/sign-in/email-otp') return Response.json(proof());
  if (path === '/api/auth/session?view=access') return Response.json(session);
  if (path === '/api/member/referral-attribution') return Response.json({ ok: false }, { status: 503 });
  assert.fail(`Unexpected offline request: ${path}`);
}

test('real React StrictMode preserves mounted/ref state and navigates once after delayed canonical success', async t => {
  const started = deferred(), released = deferred();
  const ui = await view(t, path => {
    if (path === '/api/auth/session?view=access') { started.resolve(); return released.promise; }
    return response(path);
  });
  await ui.send(); await ui.code();
  let pending;
  await act(async () => {
    const form = nodes(ui.container, node => node.nodeName === 'FORM')[0];
    pending = props(form).onSubmit(event);
    await started.promise;
  });
  assert.match(ui.container.textContent, /Correo verificado correctamente/);
  assert.match(ui.container.textContent, /Comprobando acceso/);
  assert.deepEqual(ui.destinations, []);
  await act(async () => { released.resolve(response('/api/auth/session?view=access')); await pending; });
  assert.deepEqual(ui.destinations, ['/dashboard']);
  await act(async () => props(ui.button('Continuar al panel')).onClick());
  assert.deepEqual(ui.destinations, ['/dashboard']);
  assert.equal(ui.paths.filter(path => path === '/api/auth/sign-in/email-otp').length, 1);
});

test('a genuine access-only authorization outage remains closed but a manual recheck recovers without another OTP', async t => {
  let checks = 0;
  const ui = await view(t, path => path === '/api/auth/session?view=access' && checks++ === 0
    ? Response.json({ error: 'unavailable' }, { status: 503 }) : response(path));
  await ui.send(); await ui.code(); await ui.confirm();
  assert.match(ui.container.textContent, /Correo verificado correctamente/);
  assert.match(ui.container.textContent, /servicio de autorización no está disponible/);
  assert.ok(ui.button('Continuar al panel'));
  assert.deepEqual(ui.destinations, [], 'an unavailable canonical authorization lookup cannot confer access');
  await act(async () => props(ui.button('Continuar al panel')).onClick());
  assert.deepEqual(ui.destinations, ['/dashboard']);
  assert.equal(ui.paths.filter(path => path.endsWith('/send-verification-otp')).length, 1);
  assert.equal(ui.paths.filter(path => path === '/api/auth/sign-in/email-otp').length, 1);
});

test('payment-summary failure cannot block real React navigation through the independent canonical access view', async t => {
  const ui = await view(t, path => path === '/api/auth/session'
    ? Response.json({ error: 'synthetic_payment_summary_unavailable' }, { status: 503 }) : response(path));
  await ui.send(); await ui.code(); await ui.confirm();
  assert.deepEqual(ui.destinations, ['/dashboard']);
  assert.equal(ui.paths.includes('/api/auth/session'), false, 'login never requests the financial/default session view');
  assert.equal(ui.paths.filter(path => path === '/api/auth/session?view=access').length, 1);
  assert.doesNotMatch(ui.container.textContent, /synthetic_payment_summary_unavailable/);
});

test('real React unmount cancels a delayed session lookup and suppresses stale navigation', async t => {
  const started = deferred(), released = deferred();
  let requestSignal;
  const ui = await view(t, (path, options) => {
    if (path === '/api/auth/session?view=access') { requestSignal = options.signal; started.resolve(); return released.promise; }
    return response(path);
  });
  await ui.send(); await ui.code();
  let pending;
  await act(async () => {
    const form = nodes(ui.container, node => node.nodeName === 'FORM')[0];
    pending = props(form).onSubmit(event); await started.promise;
  });
  await ui.unmount();
  assert.equal(requestSignal.aborted, true);
  released.resolve(response('/api/auth/session?view=access')); await pending;
  assert.deepEqual(ui.destinations, []);
});

test('real referral storage denial and unavailable referral sync do not block canonical dashboard navigation', async t => {
  const ui = await view(t, path => response(path), { deniedStorage: true, initialRef: 'synthetic-sponsor' });
  await ui.send(); await ui.code(); await ui.confirm();
  assert.deepEqual(ui.destinations, ['/dashboard']);
  assert.equal(ui.paths.filter(path => path === '/api/member/referral-attribution').length, 1);
  assert.doesNotMatch(ui.container.textContent, /No se pudo conectar/);
});

test('anonymous or mismatched canonical identity cannot be turned into ready access by React rerenders', async t => {
  for (const session of [{ authenticated: false, mode: 'better-auth' },
    { authenticated: true, mode: 'better-auth', email: 'different@example.test' }]) {
    const ui = await view(t, path => response(path, session));
    await ui.send(); await ui.code(); await ui.confirm();
    assert.match(ui.container.textContent, /Continuar al panel/);
    assert.deepEqual(ui.destinations, []);
    await act(async () => props(ui.button('Continuar al panel')).onClick());
    assert.deepEqual(ui.destinations, []);
    await ui.unmount();
  }
});
