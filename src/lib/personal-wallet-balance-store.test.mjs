import assert from 'node:assert/strict';
import test from 'node:test';
import { createPersonalWalletBalanceStore, personalWalletBalanceSessionKey } from './personal-wallet-balance-store.mjs';

const value = (walletAddress = `0x${'1'.repeat(40)}`, balanceAtomic = '10000000', polygon = '7000000') => ({ walletAddress,
  balances: [{ network: 'ethereum', balanceAtomic, nativeBalanceAtomic: '0', observedAt: '2026-11-11T02:00:00Z' },
    { network: 'polygon', balanceAtomic: polygon, nativeBalanceAtomic: '0', observedAt: '2026-11-11T02:00:00Z' }] });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test('temporary gateway errors recover automatically and visible balances refresh without reconnecting the SDK', async () => {
  let calls = 0, time = 0;
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const store = createPersonalWalletBalanceStore({ read: async () => {
    if (++calls === 1) throw Error('company_payment_unavailable'); return value();
  }, now: () => time, retryDelays: [15], refreshIntervalMs: 20, documentTarget: document });
  const close = store.subscribe('member', () => {});
  await store.refresh('member'); assert.equal(store.get('member').balanceAtomic, null);
  await new Promise(done => setTimeout(done, 40)); assert.equal(store.get('member').balanceAtomic, '10000000');
  assert.equal(calls, 2); time = 6000;
  await new Promise(done => setTimeout(done, 35)); assert.equal(calls, 3);
  document.visibilityState = 'hidden'; time = 12000;
  await new Promise(done => setTimeout(done, 35)); assert.equal(calls, 3); close();
});

test('cache scope distinguishes subjects even when their displayed email is identical', () => {
  assert.equal(personalWalletBalanceSessionKey(null), '');
  assert.notEqual(personalWalletBalanceSessionKey({ subject: 'A', email: 'member@example.test' }), personalWalletBalanceSessionKey({ subject: 'B', email: 'member@example.test' }));
});

test('linking a wallet during an old unlinked read queues one fresh owner lookup', async () => {
  const pending = deferred(); let calls = 0;
  const store = createPersonalWalletBalanceStore({ read: async () => {
    if (++calls === 1) return pending.promise; return value();
  } });
  const close = store.subscribe('member', () => {}); const first = store.refresh('member', false);
  await Promise.resolve(); void store.refresh('member'); void store.refresh('member');
  pending.resolve(value(undefined, '0')); await first;
  await new Promise(done => setImmediate(done));
  assert.equal(calls, 2); assert.equal(store.get('member').balanceAtomic, '10000000'); close();
});

test('sidebar and wallet coalesce balance reads; refresh shows confirmed zero and errors never masquerade as zero', async () => {
  const pending = deferred(); let calls = 0, fail = false, current = value();
  const store = createPersonalWalletBalanceStore({ read: async () => { calls++; if (fail) throw Error('company_payment_rpc_unavailable'); return calls === 1 ? pending.promise : current; } });
  const closeA = store.subscribe('member-A', () => {}), closeB = store.subscribe('member-A', () => {});
  const first = store.refresh('member-A', false), second = store.refresh('member-A', false);
  assert.equal(first, second); assert.equal(store.get('member-A').loading, true);
  pending.resolve(current); await first; assert.equal(calls, 1); assert.equal(store.get('member-A').balanceAtomic, '10000000');
  assert.equal(store.get('member-A', 'polygon').balanceAtomic, '7000000');
  await store.refresh('member-A', false); assert.equal(calls, 1);
  current = value(undefined, '0'); await store.refresh('member-A'); assert.equal(store.get('member-A').balanceAtomic, '0');
  fail = true; await store.refresh('member-A'); assert.equal(store.get('member-A').balanceAtomic, null);
  assert.equal(store.get('member-A').error, 'company_payment_rpc_unavailable');
  closeA(); closeB(); assert.equal(store.get('member-A').balanceAtomic, null);
});

test('logout and owner changes cancel old reads and late results cannot populate another session', async () => {
  const pending = deferred(), signals = []; let call = 0;
  const store = createPersonalWalletBalanceStore({ read: async ({ signal }) => { signals.push(signal); return ++call === 1 ? pending.promise : value(`0x${'2'.repeat(40)}`, '7000000'); } });
  const closeA = store.subscribe('member-A', () => {}); const old = store.refresh('member-A');
  await Promise.resolve(); closeA(); assert.equal(signals[0].aborted, true);
  const closeB = store.subscribe('member-B', () => {}); await store.refresh('member-B');
  pending.resolve(value()); await old;
  assert.equal(store.get('member-A').balanceAtomic, null);
  assert.equal(store.get('member-B').balanceAtomic, '7000000');
  assert.equal(store.get('member-B').walletAddress, `0x${'2'.repeat(40)}`); closeB();
});

test('returning from checkout refreshes visible balances once without wallet signatures', async () => {
  const browser = new EventTarget(), document = Object.assign(new EventTarget(), { visibilityState: 'visible' }); let calls = 0, time = 0;
  const store = createPersonalWalletBalanceStore({ read: async () => { calls++; return value(undefined, String(calls * 1000000)); }, now: () => time, windowTarget: browser, documentTarget: document });
  const close = store.subscribe('member', () => {}); await store.refresh('member');
  time = 6000;
  browser.dispatchEvent(new Event('focus')); browser.dispatchEvent(new Event('pageshow')); document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(done => setTimeout(done, 300)); assert.equal(calls, 2); assert.equal(store.get('member').balanceAtomic, '2000000');
  document.visibilityState = 'hidden'; browser.dispatchEvent(new Event('focus'));
  await new Promise(done => setTimeout(done, 300)); assert.equal(calls, 2); close();
});

test('repeated focus events reuse a recent read instead of queueing a new lookup on each return', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const browser = new EventTarget(), document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  let calls = 0, time = 0;
  const store = createPersonalWalletBalanceStore({ read: async () => { calls++; return value(); }, now: () => time,
    windowTarget: browser, documentTarget: document });
  const close = store.subscribe('member', () => {}); t.after(close);
  await store.refresh('member', false);
  for (let turn = 0; turn < 10; turn++) {
    browser.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange'));
    time += 300; t.mock.timers.tick(300); await new Promise(done => setImmediate(done));
  }
  assert.equal(calls, 1);
  time = 6000; browser.dispatchEvent(new Event('pageshow')); t.mock.timers.tick(250);
  await new Promise(done => setImmediate(done)); assert.equal(calls, 2);
});

test('focus during a pending read does not queue another read, but a confirmed balance change does', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const browser = new EventTarget(), document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const pending = deferred(); let calls = 0;
  const store = createPersonalWalletBalanceStore({ read: async () => ++calls === 1 ? pending.promise : value(),
    windowTarget: browser, documentTarget: document });
  const close = store.subscribe('member', () => {}); t.after(close);
  const first = store.refresh('member', false); await Promise.resolve();
  browser.dispatchEvent(new Event('focus')); t.mock.timers.tick(250);
  pending.resolve(value()); await first; await new Promise(done => setImmediate(done));
  assert.equal(calls, 1);
  browser.dispatchEvent(new Event('vp:personal-wallet-balance-changed')); t.mock.timers.tick(250);
  await new Promise(done => setImmediate(done)); assert.equal(calls, 2);
});

test('repeated focus after a failed read respects the automatic cooldown without replaying failed requests', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const browser = new EventTarget(), document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  let calls = 0, time = 0;
  const store = createPersonalWalletBalanceStore({ read: async () => { calls++; throw Error('company_payment_rpc_unavailable'); },
    now: () => time, retryDelays: [], windowTarget: browser, documentTarget: document });
  const close = store.subscribe('member', () => {}); t.after(close); await store.refresh('member', false);
  for (let turn = 0; turn < 10; turn++) {
    browser.dispatchEvent(new Event('focus')); time += 300; t.mock.timers.tick(300);
    await new Promise(done => setImmediate(done));
  }
  assert.equal(calls, 1);
});
