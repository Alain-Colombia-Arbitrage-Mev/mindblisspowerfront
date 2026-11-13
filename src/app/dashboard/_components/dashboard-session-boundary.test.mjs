import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import ts from 'typescript';
import * as sync from '../../../lib/member-logout-sync.mjs';
import * as sessionSync from '../../../lib/member-session-sync.mjs';
import * as session from '../../../lib/member-session-boundary.mjs';
import { logoutMember } from '../../../lib/member-logout.mjs';
import { translateMessage } from '../../../i18n/translate.mjs';

const require = createRequire(import.meta.url);
const owner = { subject: 'synthetic-owner', email: 'member@example.test' };
const proof = (changes = {}) => Response.json({ authenticated: true, mode: 'better-auth', ...owner, ...changes });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
class HostNode {
  constructor(type, name, ownerDocument, text = '') {
    Object.assign(this, { nodeType: type, nodeName: name, tagName: name, localName: name.toLowerCase(), ownerDocument,
      parentNode: null, childNodes: [], attributes: new Map(), style: { setProperty(name, value) { this[name] = value; } },
      namespaceURI: 'http://www.w3.org/1999/xhtml', nodeValue: text });
  }
  appendChild(child) { child.parentNode?.removeChild(child); child.parentNode = this; this.childNodes.push(child); return child; }
  removeChild(child) { const index = this.childNodes.indexOf(child); assert.ok(index >= 0); this.childNodes.splice(index, 1); child.parentNode = null; return child; }
  insertBefore(child, before) { child.parentNode?.removeChild(child); const index = this.childNodes.indexOf(before); assert.ok(index >= 0); child.parentNode = this; this.childNodes.splice(index, 0, child); return child; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener() {}
  removeEventListener() {}
  get firstChild() { return this.childNodes[0] || null; }
  get textContent() { return this.nodeType === 3 ? this.nodeValue : this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) { this.childNodes = []; if (value !== '') this.appendChild(new HostNode(3, '#text', this.ownerDocument, String(value))); }
}
function compile() {
  const code = ts.transpileModule(readFileSync(new URL('./DashboardSessionBoundary.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} }, mocks = { react: React, 'react-dom': { flushSync }, 'react/jsx-runtime': require('react/jsx-runtime'),
    '@/lib/member-logout-sync.mjs': sync, '@/lib/member-session-sync.mjs': sessionSync, '@/lib/member-session-boundary.mjs': session,
    '@/i18n/LanguageProvider': { useI18n: () => ({ t: key => translateMessage('es', key) }) } };
  new Function('require', 'module', 'exports', code)(name => { assert.ok(Object.hasOwn(mocks, name), name); return mocks[name]; }, module, module.exports);
  return module.exports.default;
}
async function fixture(t, transport = async () => proof()) {
  const document = new HostNode(9, '#document', null); document.ownerDocument = document;
  document.createElement = name => new HostNode(1, name.toUpperCase(), document);
  document.createElementNS = (_namespace, name) => document.createElement(name);
  document.createTextNode = text => new HostNode(3, '#text', document, text);
  document.documentElement = document.appendChild(document.createElement('html'));
  document.body = document.documentElement.appendChild(document.createElement('body')); document.activeElement = document.body;
  const browser = new EventTarget(), destinations = [], calls = [], storage = new Map();
  Object.assign(browser, { document, Node: HostNode, HTMLElement: HostNode, HTMLIFrameElement: class {}, getSelection: () => null,
    location: { replace: path => destinations.push(path) },
    localStorage: { setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } });
  document.defaultView = browser;
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: browser, document, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  t.mock.method(globalThis, 'fetch', (path, options) => { calls.push({ path, options }); return transport(path, options); });
  const container = document.body.appendChild(document.createElement('div')), root = createRoot(container), Boundary = compile();
  let cleanups = 0;
  function Private() { React.useEffect(() => () => { cleanups++; }, []); return React.createElement('p', null, 'PRIVATE WALLET BALANCE'); }
  const render = async (identity = owner) => act(async () => root.render(React.createElement(Boundary, { owner: identity }, React.createElement(Private))));
  await render();
  t.after(async () => { await act(async () => root.unmount()); for (const [key, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  } });
  const emit = (type, attributes = {}) => { const event = new Event(type); for (const [key, value] of Object.entries(attributes)) Object.defineProperty(event, key, { value }); browser.dispatchEvent(event); };
  const remote = () => emit('storage', { key: 'mindbliss.member-logout.v1', newValue: 'confirmed-logout-v1' });
  return { browser, container, destinations, calls, render, emit, remote, get cleanups() { return cleanups; } };
}
const settle = () => act(async () => { await new Promise(resolve => setImmediate(resolve)); });
const allNodes = root => [root, ...root.childNodes.flatMap(allNodes)];

test('confirmed same-tab logout immediately unmounts private resources and retains one POST and hard navigation', async t => {
  const h = await fixture(t); let posts = 0, sdkCleanup = 0;
  const stop = sync.subscribeMemberLogout(() => { sdkCleanup++; }); t.after(stop);
  await act(async () => logoutMember({ fetchImpl: async () => { posts++; return Response.json({ ok: true }); },
    clearCaches() {}, navigate: path => h.browser.location.replace(path) }));
  assert.equal(posts, 1); assert.equal(h.cleanups, 1); assert.equal(sdkCleanup, 1);
  assert.doesNotMatch(h.container.textContent, /PRIVATE/); assert.deepEqual(h.destinations, ['/login']); assert.equal(h.calls.length, 0);
});

test('a remote confirmed logout hides data synchronously, retires once and cannot be reopened by browser events', async t => {
  const h = await fixture(t);
  await act(async () => { h.remote(); assert.doesNotMatch(h.container.textContent, /PRIVATE/); assert.equal(h.cleanups, 1); h.remote(); });
  await act(async () => { h.emit('pageshow', { persisted: true }); h.emit('focus'); });
  assert.deepEqual(h.destinations, ['/login']); assert.equal(h.calls.length, 0);
});

test('persisted pagehide masks the cached document, and restore waits for the original canonical owner', async t => {
  const pending = deferred(), h = await fixture(t, () => pending.promise);
  await act(async () => { h.emit('pagehide', { persisted: true }); assert.doesNotMatch(h.container.textContent, /PRIVATE/); });
  assert.equal(h.calls.length, 0);
  await act(async () => { h.emit('pageshow', { persisted: true }); h.emit('pageshow', { persisted: true }); });
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].path, '/api/auth/session?view=access');
  assert.doesNotMatch(h.container.textContent, /PRIVATE/);
  pending.resolve(proof()); await settle(); assert.match(h.container.textContent, /PRIVATE/); assert.deepEqual(h.destinations, []);
});

for (const changes of [{ subject: 'another-owner' }, { email: 'another@example.test' }, { authenticated: false }]) {
  test(`changed-account or anonymous restore ${JSON.stringify(changes)} cannot reveal the old document`, async t => {
    const h = await fixture(t, async () => proof(changes));
    await act(async () => h.emit('pageshow', { persisted: true }));
    assert.doesNotMatch(h.container.textContent, /PRIVATE/); assert.equal(h.cleanups, 1); assert.deepEqual(h.destinations, ['/login']);
  });
}

test('an unavailable restore stays masked and only an explicit retry can reveal a proven same-owner document', async t => {
  let attempts = 0;
  const h = await fixture(t, async () => ++attempts === 1 ? Response.json({ error: 'unavailable' }, { status: 503 }) : proof());
  await act(async () => h.emit('pageshow', { persisted: true }));
  assert.equal(attempts, 1); assert.doesNotMatch(h.container.textContent, /PRIVATE/); assert.deepEqual(h.destinations, []);
  const button = allNodes(h.container).find(node => node.tagName === 'BUTTON');
  const attributes = button[Object.keys(button).find(key => key.startsWith('__reactProps$'))];
  await act(async () => attributes.onClick());
  assert.equal(attempts, 2); assert.match(h.container.textContent, /PRIVATE/);
});

test('a late restore proof is cancelled by logout and ordinary renders and browser activity never poll', async t => {
  const pending = deferred(), h = await fixture(t, () => pending.promise);
  await h.render(); await act(async () => { h.emit('focus'); h.emit('pageshow', { persisted: false }); });
  assert.equal(h.calls.length, 0);
  await act(async () => h.emit('pageshow', { persisted: true }));
  await act(async () => h.remote()); assert.equal(h.calls[0].options.signal.aborted, true);
  pending.resolve(proof()); await settle(); assert.doesNotMatch(h.container.textContent, /PRIVATE/);
  assert.equal(h.calls.length, 1); assert.deepEqual(h.destinations, ['/login']);
});
