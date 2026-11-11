import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { personalWalletBalanceSessionKey } from '../../lib/personal-wallet-balance-store.mjs';
import { rememberWalletSetupAfterAuth, consumeWalletSetupAfterAuth, resumeWalletSetupAfterAuth, clearWalletSetupAfterAuth } from '../../lib/wallet-setup-handoff.mjs';
import { translateMessage } from '../../i18n/translate.mjs';

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('./PostAuthWalletSetup.jsx', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const memberA = { subject: 'synthetic-owner-A', email: 'member-a@example.test' };
const memberB = { subject: 'synthetic-owner-B', email: 'member-b@example.test' };
const setupNow = 1_794_419_000_000;
const walletAddress = `0x${'1'.repeat(40)}`;
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
function browser(t) {
  let now = setupNow;
  t.mock.method(Date, 'now', () => now);
  const values = new Map();
  const target = { sessionStorage: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key),
  } };
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: target });
  t.after(() => original ? Object.defineProperty(globalThis, 'window', original) : delete globalThis.window);
  t.mock.method(globalThis, 'fetch', () => assert.fail('Setup tests cannot contact authentication, payment or wallet services'));
  return { target, values, setTime(value) { now = value; } };
}
const all = (node, predicate) => !React.isValidElement(node) ? []
  : [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => all(child, predicate))];
const primary = tree => all(tree, node => node.type === 'button' && node.props.className?.includes('primary'))[0];
const named = (tree, key, locale = 'es') => all(tree, node => node.type === 'button' && node.props.children === translateMessage(locale, key))[0];
const requestFor = (member, createdAt = setupNow) => ({ email: member.email, subject: member.subject, ownerKey: personalWalletBalanceSessionKey(member), createdAt });

/** Actual hook and JSX; requests remain synthetic and effect cleanup is observable. */
function harness({ mode = 'hook', member = memberA, reown = {}, readBinding = async () => ({ linked: false, address: '' }), locale = 'es' } = {}) {
  const slots = [], queued = [], reads = [], calls = [], finishes = [];
  let cursor = 0, dirty = true, current, unmounted = false, lateUpdates = 0, consumes = 0, currentMember = member;
  const request = requestFor(memberA), finish = owner => finishes.push(owner);
  const account = { configured: true, isConnected: false, address: '', linkStatus: 'unlinked',
    connectWallet: async () => { calls.push('connect'); }, chooseWallet: async () => { calls.push('choose'); }, openConnect: async () => { assert.fail('Initial setup must not enter an onramp operation'); },
    linkWallet: async () => { calls.push('link'); }, refreshLink: async () => { calls.push('refresh'); }, ...reown };
  const changed = (left, right) => !left || !right || left.length !== right.length || left.some((value, index) => !Object.is(value, right[index]));
  const hooks = { ...React,
    useRef(value) { return slots[cursor++] ??= { current: value }; },
    useState(initial) {
      const cell = slots[cursor++] ??= { value: typeof initial === 'function' ? initial() : initial };
      cell.set ??= update => {
        if (unmounted) { lateUpdates++; return; }
        const next = typeof update === 'function' ? update(cell.value) : update;
        if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; }
      };
      return [cell.value, cell.set];
    },
    useCallback(callback, dependencies) {
      const cell = slots[cursor++] ??= {};
      if (changed(cell.dependencies, dependencies)) { cell.dependencies = dependencies; cell.value = callback; }
      return cell.value;
    },
    useEffect(effect, dependencies) {
      const cell = slots[cursor++] ??= {};
      if (changed(cell.dependencies, dependencies)) {
        cell.dependencies = dependencies; cell.effect = effect; queued.push(() => { cell.cleanup?.(); cell.cleanup = effect(); });
      }
    },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
    if (name === '@/lib/member-session-context') return { useMemberSession: () => currentMember };
    if (name === '@/lib/personal-wallet-balance-store.mjs') return { personalWalletBalanceSessionKey };
    if (name === '@/lib/wallet-setup-handoff.mjs') return { consumeWalletSetupAfterAuth: value => { consumes++; return consumeWalletSetupAfterAuth(value); }, resumeWalletSetupAfterAuth, clearWalletSetupAfterAuth };
    if (name === '@/lib/wallet-binding.mjs') return { readWalletBinding: options => { reads.push(options); return readBinding(options); } };
    if (name === '@/i18n/LanguageProvider') return { useI18n: () => ({ t: (key, variables) => translateMessage(locale, key, variables) }) };
    if (name === './ReownContext') return { useReownWallet: () => account };
    assert.fail(`Unexpected setup authentication/signing/payment dependency: ${name}`);
  }, module, module.exports);
  function render() { cursor = 0; dirty = false; current = mode === 'hook' ? module.exports.usePostAuthWalletSetup(currentMember)
    : module.exports.default({ request, onFinish: finish }); }
  const view = { reads, calls, finishes, account, get value() { return current; }, get consumes() { return consumes; }, get lateUpdates() { return lateUpdates; },
    async flush() {
      for (let turn = 0, quiet = 0; turn < 50; turn++) {
        if (!unmounted && dirty) render(); while (!unmounted && queued.length) queued.shift()();
        await new Promise(resolve => setImmediate(resolve));
        if (!unmounted && (dirty || queued.length)) quiet = 0; else if (++quiet === 3) return current;
      }
      assert.fail('Setup did not settle');
    },
    async session(next) { currentMember = next; dirty = true; return view.flush(); },
    async patch(next) { Object.assign(account, next); dirty = true; return view.flush(); },
    async rerender() { dirty = true; return view.flush(); },
    async replayEffects() { for (const cell of slots) if (cell?.effect) cell.cleanup?.();
      for (const cell of slots) if (cell?.effect) cell.cleanup = cell.effect(); return view.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); unmounted = true; },
  };
  return view;
}

test('a UI hint without a complete dashboard session cannot read bindings or authenticate', async t => {
  const tab = browser(t); rememberWalletSetupAfterAuth(memberA.email);
  const view = harness({ member: null }); t.after(() => view.unmount()); await view.flush();
  assert.equal(view.value.request, null); assert.equal(view.reads.length, 0); assert.equal(view.consumes, 0); assert.equal(tab.values.size, 1);
  await view.session({ email: memberA.email }); assert.equal(view.reads.length, 0); assert.equal(tab.values.size, 1);
  await view.session(memberA); assert.deepEqual(view.value.request, requestFor(memberA)); assert.equal(view.reads.length, 1);
  assert.equal(tab.values.size, 1); assert.deepEqual(view.calls, []);
});

test('only a fresh matching hint and authoritative unlinked response request setup', async t => {
  browser(t); const ordinary = harness(); t.after(() => ordinary.unmount()); await ordinary.flush();
  assert.equal(ordinary.reads.length, 0); assert.equal(ordinary.value.request, null);
  rememberWalletSetupAfterAuth(memberB.email); const foreign = harness(); t.after(() => foreign.unmount()); await foreign.flush();
  assert.equal(foreign.reads.length, 0); assert.equal(foreign.value.request, null);
  for (const result of [{ linked: true, address: walletAddress }, { linked: undefined }, { address: walletAddress }]) {
    rememberWalletSetupAfterAuth(memberA.email); const view = harness({ readBinding: async () => result }); await view.flush();
    assert.equal(view.reads.length, 1); assert.equal(view.value.request, null); assert.deepEqual(view.calls, []); view.unmount();
  }
  rememberWalletSetupAfterAuth(memberA.email); const missing = harness(); t.after(() => missing.unmount()); await missing.flush();
  assert.deepEqual(missing.value.request, requestFor(memberA)); assert.deepEqual(missing.calls, []);
});

test('a failed lookup is never an absent wallet and rerender cannot retry it automatically', async t => {
  browser(t); rememberWalletSetupAfterAuth(memberA.email);
  const view = harness({ readBinding: async () => { throw Error('Synthetic failure'); } }); t.after(() => view.unmount());
  await view.flush(); await view.rerender(); assert.equal(view.reads.length, 1); assert.equal(view.value.request, null); assert.deepEqual(view.calls, []);
});

test('StrictMode replays the lookup without losing or consuming the hint twice', async t => {
  browser(t); rememberWalletSetupAfterAuth(memberA.email); const replies = [deferred(), deferred()];
  const view = harness({ readBinding: () => replies[view.reads.length - 1].promise }); t.after(() => view.unmount()); await view.flush();
  assert.equal(view.consumes, 1); await view.replayEffects(); assert.equal(view.consumes, 1); assert.equal(view.reads.length, 2);
  assert.equal(view.reads[0].signal.aborted, true); replies[0].resolve({ linked: false }); await view.flush(); assert.equal(view.value.request, null);
  replies[1].resolve({ linked: false }); await view.flush(); assert.deepEqual(view.value.request, requestFor(memberA)); assert.deepEqual(view.calls, []);
});

test('a late former-owner lookup cannot replace the next owner or dismiss its request', async t => {
  browser(t); rememberWalletSetupAfterAuth(memberA.email); const replies = [deferred(), deferred()];
  const view = harness({ readBinding: () => replies[view.reads.length - 1].promise }); t.after(() => view.unmount()); await view.flush();
  rememberWalletSetupAfterAuth(memberB.email); await view.session(memberB); assert.equal(view.reads[0].signal.aborted, true);
  replies[0].resolve({ linked: false }); await view.flush(); assert.equal(view.value.request, null);
  replies[1].resolve({ linked: false }); await view.flush(); assert.deepEqual(view.value.request, requestFor(memberB));
  view.value.finish(requestFor(memberA).ownerKey, setupNow); await view.flush(); assert.ok(view.value.request);
  view.value.finish(requestFor(memberB).ownerKey, setupNow); await view.flush(); assert.equal(view.value.request, null);
});

test('unmount aborts lookup and ignores late unlinked results', async t => {
  browser(t); rememberWalletSetupAfterAuth(memberA.email); const reply = deferred(), view = harness({ readBinding: () => reply.promise });
  await view.flush(); view.unmount(); assert.equal(view.reads[0].signal.aborted, true); reply.resolve({ linked: false }); await view.flush();
  assert.equal(view.value.request, null); assert.equal(view.lateUpdates, 0);
});

test('a bound wallet skips setup without another connection or ownership signature', async t => {
  browser(t); const view = harness({ mode: 'controller', reown: { linkStatus: 'linked', linkedAddress: walletAddress } });
  t.after(() => view.unmount()); await view.flush(); await view.rerender();
  assert.deepEqual(view.finishes, [requestFor(memberA).ownerKey]); assert.deepEqual(view.calls, []);
});

test('a pending binding lookup cannot open authentication or claim a missing wallet', async t => {
  browser(t); const view = harness({ mode: 'controller', reown: { linkStatus: 'loading' } }); t.after(() => view.unmount());
  await view.flush(); assert.deepEqual(view.calls, []); await view.patch({ linkStatus: 'linked', linkedAddress: walletAddress });
  assert.deepEqual(view.finishes, [requestFor(memberA).ownerKey]); assert.deepEqual(view.calls, []);
});

test('initial disconnected setup opens once then waits for explicit verification without creating a payment', async t => {
  browser(t); const connection = deferred(); let opens = 0;
  const view = harness({ mode: 'controller', reown: { connectWallet() { opens++; return connection.promise; } } });
  t.after(() => view.unmount()); await view.flush(); await view.rerender(); assert.equal(opens, 1); assert.deepEqual(view.calls, []);
  await view.patch({ isConnected: true, address: walletAddress }); connection.resolve({ connected: true }); await view.flush();
  assert.ok(renderToStaticMarkup(view.value).includes(walletAddress)); assert.ok(named(view.value, 'funding.verifyWallet'));
  assert.deepEqual(view.calls, []); assert.deepEqual(view.finishes, []);
});

test('already connected initial wallets require one explicit proof and never reconnect automatically', async t => {
  browser(t); const proof = deferred();
  const view = harness({ mode: 'controller', reown: { isConnected: true, address: walletAddress,
    linkWallet() { view.calls.push('link'); return proof.promise; } } }); t.after(() => view.unmount()); await view.flush();
  assert.deepEqual(view.calls, []); const verify = primary(view.value); verify.props.onClick(); verify.props.onClick(); await view.flush();
  assert.deepEqual(view.calls, ['link']); assert.deepEqual(view.finishes, []); proof.resolve({ linked: true, address: walletAddress }); await view.flush();
  assert.deepEqual(view.finishes, [requestFor(memberA).ownerKey]);
});

test('StrictMode callers share the provider connection and never auto-sign ownership', async t => {
  browser(t); const connection = deferred(); let callers = 0, opened = false, opens = 0;
  const view = harness({ mode: 'controller', reown: { connectWallet() { callers++; if (!opened) { opened = true; opens++; } return connection.promise; } } });
  t.after(() => view.unmount()); await view.flush(); await view.replayEffects(); assert.equal(callers, 2); assert.equal(opens, 1);
  await view.patch({ isConnected: true, address: walletAddress }); connection.resolve(); await view.flush();
  assert.deepEqual(view.calls, []); assert.deepEqual(view.finishes, []); assert.ok(named(view.value, 'funding.verifyWallet'));
});

test('cancelled and failed initial authentication expose retry and decline without background linking', async t => {
  browser(t);
  for (const failure of [new DOMException('Cancelled', 'AbortError'), Error('Synthetic provider failure')]) {
    const view = harness({ mode: 'controller', reown: { connectWallet: async () => { throw failure; } } }); await view.flush();
    assert.equal(all(view.value, node => node.props?.role === 'alert').length, 1); assert.deepEqual(view.calls, []); assert.deepEqual(view.finishes, []);
    named(view.value, 'recharge.notNow').props.onClick(); view.unmount(); assert.deepEqual(view.finishes, [requestFor(memberA).ownerKey]); assert.equal(view.lateUpdates, 0);
  }
});

test('declining setup fences a stale verification click after unmount', async t => {
  browser(t); const view = harness({ mode: 'controller', reown: { isConnected: true, address: walletAddress } }); await view.flush();
  const verify = primary(view.value); named(view.value, 'recharge.notNow').props.onClick(); view.unmount(); verify.props.onClick(); await view.flush();
  assert.deepEqual(view.calls, []); assert.equal(view.lateUpdates, 0); assert.deepEqual(view.finishes, [requestFor(memberA).ownerKey]);
});

test('owner changes fence pending connection, proof and wallet choice completions', async t => {
  browser(t);
  for (const stage of ['connect', 'link', 'choose']) {
    const pending = deferred(), view = harness({ mode: 'controller', reown: { isConnected: stage !== 'connect', address: stage !== 'connect' ? walletAddress : '',
      connectWallet: () => pending.promise, linkWallet: () => pending.promise, chooseWallet: () => pending.promise } });
    await view.flush(); if (stage === 'link') { primary(view.value).props.onClick(); await view.flush(); }
    if (stage === 'choose') { named(view.value, 'funding.chooseWallet').props.onClick(); await view.flush(); }
    await view.session(memberB); assert.equal(view.value, null); pending.resolve({ linked: true, address: walletAddress }); await view.flush();
    assert.equal(view.value, null); assert.deepEqual(view.finishes, []); view.unmount();
  }
});

test('choosing another wallet is explicit and duplicate-locked without disconnect or automatic proof', async t => {
  browser(t); const choice = deferred();
  const view = harness({ mode: 'controller', reown: { isConnected: true, address: walletAddress,
    chooseWallet() { view.calls.push('choose'); return choice.promise; }, disconnect: () => assert.fail('Cannot auto-disconnect') } });
  t.after(() => view.unmount()); await view.flush(); assert.deepEqual(view.calls, []);
  const choose = named(view.value, 'funding.chooseWallet'); choose.props.onClick(); choose.props.onClick(); await view.flush(); assert.deepEqual(view.calls, ['choose']);
  const nextAddress = `0x${'2'.repeat(40)}`; await view.patch({ address: nextAddress }); choice.resolve(); await view.flush();
  assert.ok(renderToStaticMarkup(view.value).includes(nextAddress)); assert.deepEqual(view.calls, ['choose']); assert.deepEqual(view.finishes, []);
});

test('cancelling explicit wallet choice exposes retry without silently connecting or linking', async t => {
  browser(t); const view = harness({ mode: 'controller', reown: { isConnected: true, address: walletAddress,
    chooseWallet: async () => { throw new DOMException('Cancelled', 'AbortError'); } } }); t.after(() => view.unmount());
  await view.flush(); named(view.value, 'funding.chooseWallet').props.onClick(); await view.flush();
  assert.equal(all(view.value, node => node.props?.role === 'alert').length, 1); assert.deepEqual(view.calls, []); assert.deepEqual(view.finishes, []);
  assert.ok(named(view.value, 'walletPage.retryCheck')); assert.ok(named(view.value, 'recharge.notNow'));
});

test('unavailable configuration and binding errors cannot automatically authenticate a wallet', async t => {
  browser(t);
  for (const reown of [{ configured: false }, { linkStatus: 'error' }, { linkStatus: 'unavailable' }]) {
    const view = harness({ mode: 'controller', reown }); await view.flush(); assert.deepEqual(view.calls, []);
    assert.equal(all(view.value, node => node.props?.role === 'alert').length, 1); view.unmount();
  }
});

test('binding retry rechecks state without connecting, linking or signing', async t => {
  browser(t); const view = harness({ mode: 'controller', reown: { linkStatus: 'error' } }); t.after(() => view.unmount());
  await view.flush(); primary(view.value).props.onClick(); await view.flush(); assert.deepEqual(view.calls, ['refresh']); assert.deepEqual(view.finishes, []);
});

test('a wallet owned by another account shows safe guidance and explicit wallet choice without retrying its proof', async t => {
  browser(t);
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const view = harness({ mode: 'controller', locale, reown: { isConnected: true, address: walletAddress,
      linkWallet() { view.calls.push('link'); throw Object.assign(Error('synthetic-private-owner@example.test'), { code: 'wallet_address_in_use' }); },
    } });
    await view.flush(); primary(view.value).props.onClick(); await view.flush(); await view.rerender();
    const html = renderToStaticMarkup(view.value);
    assert.ok(html.includes(translateMessage(locale, 'funding.walletAlreadyUsed')));
    assert.ok(!html.includes('synthetic-private-owner')); assert.deepEqual(view.calls, ['link']); assert.deepEqual(view.finishes, []);
    const choose = named(view.value, 'funding.chooseWallet', locale); assert.ok(choose);
    choose.props.onClick(); await view.flush(); assert.deepEqual(view.calls, ['link', 'choose']); assert.deepEqual(view.finishes, []);
    view.unmount();
  }
});

test('all locales distinguish connected initial wallets from verified backend ownership', async t => {
  browser(t);
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const view = harness({ mode: 'controller', locale, reown: { isConnected: true, address: walletAddress } }); await view.flush();
    const html = renderToStaticMarkup(view.value); assert.ok(html.includes(translateMessage(locale, 'funding.prepareWallet')));
    assert.ok(html.includes(translateMessage(locale, 'walletPage.connectedPendingCopy'))); assert.ok(named(view.value, 'funding.verifyWallet', locale));
    assert.ok(html.includes(walletAddress)); assert.deepEqual(view.calls, []); assert.deepEqual(view.finishes, []); view.unmount();
  }
});

test('a full remount resumes unfinished setup only after another authoritative absent-binding read', async t => {
  const tab = browser(t); rememberWalletSetupAfterAuth(memberA.email);
  const first = harness(); await first.flush(); assert.deepEqual(first.value.request, requestFor(memberA)); first.unmount();
  tab.setTime(setupNow + 60000);
  const pending = deferred(), reloaded = harness({ readBinding: () => pending.promise }); t.after(() => reloaded.unmount());
  await reloaded.flush(); assert.equal(reloaded.value.request, null); assert.equal(reloaded.reads.length, 1);
  assert.deepEqual(reloaded.calls, [], 'A pending marker is never wallet or payment authority');
  pending.resolve({ linked: false, address: '' }); await reloaded.flush();
  assert.deepEqual(reloaded.value.request, requestFor(memberA));
  assert.equal(JSON.parse([...tab.values.values()][0]).createdAt, setupNow);
  assert.deepEqual(reloaded.calls, []);
});

test('completed or declined setup cannot reopen after a full remount', async t => {
  const tab = browser(t);
  for (const result of ['dismissed', 'linked']) {
    rememberWalletSetupAfterAuth(memberA.email);
    const first = harness(); await first.flush(); first.unmount();
    if (result === 'dismissed') {
      const resumed = harness(); await resumed.flush();
      resumed.value.finish(requestFor(memberA).ownerKey, setupNow); await resumed.flush();
      assert.equal(resumed.value.request, null); resumed.unmount();
    } else {
      const completed = harness({ readBinding: async () => ({ linked: true, address: walletAddress }) });
      await completed.flush(); assert.equal(completed.value.request, null); completed.unmount();
    }
    assert.equal(tab.values.size, 0);
    const next = harness(); await next.flush(); assert.equal(next.reads.length, 0);
    assert.equal(next.value.request, null); assert.deepEqual(next.calls, []); next.unmount();
  }
});

test('expired or another-owner pending setup cannot reopen after a full remount', async t => {
  const tab = browser(t);
  for (const scenario of ['expired', 'other-subject', 'other-email']) {
    tab.setTime(setupNow); rememberWalletSetupAfterAuth(memberA.email);
    const first = harness(); await first.flush(); first.unmount();
    if (scenario === 'expired') tab.setTime(setupNow + 120000);
    const member = scenario === 'other-subject' ? { ...memberA, subject: memberB.subject }
      : scenario === 'other-email' ? memberB : memberA;
    const reloaded = harness({ member }); await reloaded.flush();
    assert.equal(reloaded.reads.length, 0); assert.equal(reloaded.value.request, null); assert.deepEqual(reloaded.calls, []);
    assert.equal(tab.values.size, 0); reloaded.unmount();
    const original = harness(); await original.flush(); assert.equal(original.value.request, null); original.unmount();
  }
});

test('a stale same-owner completion cannot dismiss a later pending handoff generation', async t => {
  const tab = browser(t); rememberWalletSetupAfterAuth(memberA.email);
  const first = harness(); await first.flush(); const finish = first.value.finish;
  tab.setTime(setupNow + 100); rememberWalletSetupAfterAuth(memberA.email);
  const next = harness(); await next.flush(); assert.deepEqual(next.value.request, requestFor(memberA, setupNow + 100));
  finish(requestFor(memberA).ownerKey, setupNow); await first.flush();
  assert.equal(first.value.request, null); first.unmount(); next.unmount();
  const reloaded = harness(); t.after(() => reloaded.unmount()); await reloaded.flush();
  assert.deepEqual(reloaded.value.request, requestFor(memberA, setupNow + 100));
});

test('a restored wallet from another embedded account is never displayed or offered for ownership proof', async t => {
  browser(t); const connect = deferred();
  const view = harness({ mode: 'controller', reown: { isConnected: true, address: walletAddress, walletIdentityMismatch: true,
    connectWallet() { view.calls.push('connect'); return connect.promise; } } }); t.after(() => view.unmount());
  await view.flush(); let html = renderToStaticMarkup(view.value);
  assert.ok(!html.includes(walletAddress)); assert.ok(html.includes(memberA.email)); assert.deepEqual(view.calls, ['connect']);
  connect.reject(Error('Synthetic account selection failed')); await view.flush();
  html = renderToStaticMarkup(view.value); assert.ok(!html.includes(walletAddress));
  assert.ok(named(view.value, 'funding.chooseWallet')); assert.equal(named(view.value, 'funding.verifyWallet'), undefined);
  assert.equal(all(view.value, node => node.type === 'button' && node.props.children === translateMessage('es', 'funding.chooseWallet')).length, 1);
  primary(view.value).props.onClick(); await view.flush();
  assert.deepEqual(view.calls, ['connect', 'choose']); assert.deepEqual(view.finishes, []);
  assert.ok(!renderToStaticMarkup(view.value).includes(walletAddress));
});

test('restoring the same owner after a missing projection rechecks binding before showing an older setup request', async t => {
  browser(t); rememberWalletSetupAfterAuth(memberA.email); const pending = deferred(); let reads = 0;
  const view = harness({ readBinding: () => ++reads === 1 ? Promise.resolve({ linked: false }) : pending.promise });
  t.after(() => view.unmount()); await view.flush(); assert.ok(view.value.request);
  await view.session(null); assert.equal(view.value.request, null);
  await view.session(memberA); assert.equal(view.value.request, null); assert.equal(reads, 2);
  pending.resolve({ linked: true, address: walletAddress }); await view.flush();
  assert.equal(view.value.request, null); assert.deepEqual(view.calls, []);
});
