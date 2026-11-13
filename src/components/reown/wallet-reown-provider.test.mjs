import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as config from '../../lib/wallet-reown-config.mjs';
import * as connection from '../../lib/wallet-reown-connection.mjs';
import * as deadline from '../../lib/browser-request-deadline.mjs';

const require = createRequire(import.meta.url), a = { subject: 'synthetic-a', email: 'same@example.test' }, b = { ...a, subject: 'synthetic-b' };
const address = `0x${'1'.repeat(40)}`;
function compile(file, dependencies, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(id => {
    if (id === 'react/jsx-runtime') return require(id);
    assert.ok(Object.hasOwn(dependencies, id), id); return dependencies[id];
  }, module, module.exports, ...Object.values(globals));
  return module.exports;
}
const context = compile('./WalletReownContext.jsx', { react: React });

test('the context outside its lazy provider is safe and makes no SDK or authentication requests', () => {
  let value;
  function Probe() { value = context.useWalletReown(); return React.createElement('span', null, value.status); }
  assert.equal(renderToStaticMarkup(React.createElement(Probe)), '<span>unavailable</span>');
  assert.deepEqual({ configured: value.configured, address: value.address, provider: value.provider, connected: value.isConnected },
    { configured: false, address: '', provider: null, connected: false });
});

function fixture(t, { member = a, connected = false, fingerprint = '', projectId = 'a'.repeat(32), reset = true } = {}) {
  let currentMember = member, provider = null;
  const values = new Map(fingerprint ? [['mindbliss.wallet-reown.owner.v1', fingerprint]] : []);
  const browser = { location: { origin: config.WALLET_REOWN_ORIGIN }, sessionStorage: {
    getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'window'); Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  t.after(() => { if (saved) Object.defineProperty(globalThis, 'window', saved); else delete globalThis.window; });
  const state = [], refs = [], effects = [], callbacks = [], memos = [], queue = [], logout = new Set(), replaced = new Set(), events = new Map();
  let si = 0, ri = 0, ei = 0, ci = 0, mi = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hooks = { ...React,
    useState(initial) { const index = si++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }]; },
    useRef(initial) { return refs[ri++] ||= { current: initial }; },
    useCallback(callback, deps) { const index = ci++; if (!same(callbacks[index]?.deps, deps)) callbacks[index] = { deps, callback }; return callbacks[index].callback; },
    useMemo(callback, deps) { const index = mi++; if (!same(memos[index]?.deps, deps)) memos[index] = { deps, value: callback() }; return memos[index].value; },
    useEffect(effect, deps) { const index = ei++, previous = effects[index]; if (!same(previous?.deps, deps)) queue.push(() => {
      previous?.cleanup?.(); effects[index] = { deps, effect, cleanup: effect() };
    }); } };
  const calls = { create: [], open: 0, close: 0, disconnect: 0, rpc: [] }, sdk = { initialized: true, open: false }, account = { address: connected ? address : '', isConnected: connected };
  const raw = { request: async input => { calls.rpc.push(input); return input.method === 'eth_chainId' ? '0x89' : [address]; },
    on: (event, listener) => events.set(event, listener), removeListener: event => events.delete(event) };
  provider = connected ? raw : null;
  const sdkInstance = { updateOptions() {}, disconnect: async () => { calls.disconnect++; if (reset) { account.address = ''; account.isConnected = false; provider = null; } },
    close: async () => { calls.close++; } };
  const dependencies = { react: hooks,
    '@reown/appkit/react': { createAppKit: options => { calls.create.push(options); return sdkInstance; }, useAppKit: () => ({ open: async () => { calls.open++; sdk.open = true; }, close: sdkInstance.close }),
      useAppKitAccount: () => account, useAppKitNetwork: () => ({ chainId: 137 }), useAppKitProvider: () => ({ walletProvider: provider }), useAppKitState: () => sdk },
    '@reown/appkit-adapter-ethers': { EthersAdapter: class {} }, '@reown/appkit/networks': { polygon: { id: 137 } },
    '@/lib/member-session-context': { useMemberSession: () => currentMember }, '@/lib/member-logout-sync.mjs': { subscribeMemberLogout: fn => { logout.add(fn); return () => logout.delete(fn); } },
    '@/lib/member-session-sync.mjs': { subscribeMemberSessionReplacement: fn => { replaced.add(fn); return () => replaced.delete(fn); } },
    '@/lib/browser-request-deadline.mjs': deadline, '@/lib/wallet-reown-config.mjs': config, '@/lib/wallet-reown-connection.mjs': connection,
    './WalletReownContext': context };
  const environment = { env: { NODE_ENV: 'production', NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID: projectId } };
  const source = compile('./WalletReownProvider.jsx', dependencies, { window: browser, process: environment });
  let value;
  const render = () => { si = ri = ei = ci = mi = 0; value = source.ConfiguredWalletReownProvider({ children: null }).props.value;
    while (queue.length) queue.shift()(); return value; };
  const unmount = () => { for (const effect of effects) effect?.cleanup?.(); };
  t.after(unmount);
  const ready = async () => { const until = Date.now() + 1500;
    do { render(); await new Promise(resolve => setTimeout(resolve, 1)); render(); } while (value.isRestoring && Date.now() < until);
    assert.equal(value.isRestoring, false); return value;
  };
  return { calls, browser, raw, sdk, source, ready, render, unmount, events,
    initialRenderer: window => compile('./WalletReownProvider.jsx', { ...dependencies, react: React }, { window, process: environment }).default,
    replay: () => { for (const effect of effects) effect?.cleanup?.(); for (const effect of effects) if (effect) effect.cleanup = effect.effect(); },
    setMember: next => { currentMember = next; }, connect: () => { account.address = address; account.isConnected = true; provider = raw; },
    logout: () => { for (const callback of [...logout]) callback(); }, replace: () => { for (const callback of [...replaced]) callback(); },
    get value() { return value; } };
}

test('module initialization is once, guarded by the dedicated project, and rendering never opens authentication', async t => {
  const h = fixture(t); h.render(); await h.ready(); h.render(); h.render();
  assert.equal(h.calls.create.length, 1); assert.deepEqual(h.calls.create[0].networks, [{ id: 137 }]);
  assert.equal(h.calls.open, 0); assert.equal(h.calls.rpc.length, 0); assert.equal(h.value.isConnected, false);
  await h.value.connectWallet(); assert.equal(h.calls.open, 1); h.connect();
  const value = h.render(); assert.equal(value.isConnected, true); assert.equal(value.address, address);
  assert.equal(h.calls.rpc.length, 0, 'a connection never triggers a signature or OTP itself');
});

test('missing dedicated configuration renders only the safe default context and never creates AppKit', t => {
  const h = fixture(t, { projectId: '' });
  const tree = h.source.default({ children: 'native app content' });
  assert.equal(h.calls.create.length, 0); assert.equal(tree.props.value, context.WALLET_REOWN_UNAVAILABLE);
  assert.equal(tree.props.children, 'native app content');
});

test('SSR and the first browser render expose the same safe context and markup before mounted SDK hooks', t => {
  const h = fixture(t), Server = h.initialRenderer(undefined), Browser = h.initialRenderer(h.browser);
  function Probe() { const value = context.useWalletReown(); return React.createElement('p', null, `${value.status}:${value.address}:${value.isConnected}`); }
  const render = Component => renderToStaticMarkup(React.createElement(Component, null, React.createElement(Probe)));
  assert.equal(render(Server), '<p>unavailable::false</p>'); assert.equal(render(Browser), render(Server));
  assert.equal(h.calls.open, 0); assert.equal(h.calls.disconnect, 0); assert.equal(h.calls.rpc.length, 0);
});

test('StrictMode effect replay preserves a same-owner active session without opening or resetting the wallet', async t => {
  const fingerprint = await connection.walletReownOwnerFingerprint(connection.walletReownOwnerKey(a));
  const h = fixture(t, { connected: true, fingerprint }); h.render(); h.replay(); await h.ready();
  assert.equal(h.value.isConnected, true); assert.equal(h.calls.disconnect, 0); assert.equal(h.calls.open, 0); assert.equal(h.calls.rpc.length, 0);
});

test('a same-owner reload restores the SDK connection without asking to connect or signing again', async t => {
  const fingerprint = await connection.walletReownOwnerFingerprint(connection.walletReownOwnerKey(a));
  const h = fixture(t, { connected: true, fingerprint }); h.render(); await h.ready();
  assert.equal(h.value.isConnected, true); assert.equal(h.calls.disconnect, 0); assert.equal(h.calls.open, 0); assert.equal(h.calls.rpc.length, 0);
});

test('changing subjects with the same email hides the previous connection immediately and retires its captured provider', async t => {
  const fingerprint = await connection.walletReownOwnerFingerprint(connection.walletReownOwnerKey(a));
  const h = fixture(t, { connected: true, fingerprint }); h.render(); await h.ready(); const old = h.value.provider;
  h.setMember(b); assert.equal(h.render().isConnected, false); assert.equal(h.value.provider, null);
  await assert.rejects(old.request({ method: 'eth_accounts' }), /session_changed/);
  await h.ready(); assert.equal(h.calls.disconnect, 1); assert.equal(h.calls.open, 0); assert.equal(h.value.address, '');
});

test('an unmarked SDK wallet that fails to disconnect cannot be silently adopted by a new native user', async t => {
  const h = fixture(t, { member: b, connected: true, reset: false }); h.render(); await h.ready();
  assert.equal(h.value.isConnected, false); await assert.rejects(h.value.connectWallet(), /session_changed/);
  assert.equal(h.calls.open, 0); assert.equal(h.calls.rpc.length, 0);
});

test('logout and native replacement signals retire captured providers before any later RPC or funding use', async t => {
  const fingerprint = await connection.walletReownOwnerFingerprint(connection.walletReownOwnerKey(a));
  const h = fixture(t, { connected: true, fingerprint }); h.render(); await h.ready(); const old = h.value.provider;
  h.replace(); await assert.rejects(old.request({ method: 'personal_sign', params: ['ownership', address] }), /session_changed/);
  assert.equal(h.render().isConnected, false); h.logout(); assert.equal(h.calls.rpc.length, 0);
});

test('account events immediately retire the connection and its old manual callback', async t => {
  const fingerprint = await connection.walletReownOwnerFingerprint(connection.walletReownOwnerKey(a));
  const h = fixture(t, { connected: true, fingerprint }); h.render(); await h.ready();
  const old = h.value.provider, oldConnect = h.value.connectWallet;
  h.events.get('accountsChanged')([`0x${'2'.repeat(40)}`]);
  await assert.rejects(old.request({ method: 'eth_accounts' }), /session_changed/);
  await assert.rejects(oldConnect(), /unavailable/);
  assert.equal(h.calls.open, 0); assert.equal(h.calls.rpc.length, 0);
});

test('an unsupported chain event retires the connection before another ownership request', async t => {
  const fingerprint = await connection.walletReownOwnerFingerprint(connection.walletReownOwnerKey(a));
  const h = fixture(t, { connected: true, fingerprint }); h.render(); await h.ready(); const old = h.value.provider;
  h.events.get('chainChanged')('0x1');
  await assert.rejects(old.request({ method: 'personal_sign', params: ['ownership', address] }), /session_changed/);
  assert.equal(h.render().isConnected, false); assert.equal(h.calls.rpc.length, 0);
});
