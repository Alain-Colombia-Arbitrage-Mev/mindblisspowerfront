import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { personalWalletBalanceSessionKey } from '../../../../lib/personal-wallet-balance-store.mjs';
import { formatPersonalCompanyPaymentAmount } from '../../../../lib/personal-company-payment-values.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const require = createRequire(import.meta.url), wallet = `0x${'1'.repeat(40)}`, hash = `0x${'a'.repeat(64)}`;
const firstId = '11111111-1111-4111-8111-111111111111', secondId = '22222222-2222-4222-8222-222222222222';
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const event = patch => ({ eventId: firstId, paymentId: firstId, attemptId: null, source: 'client_reported', event: 'broadcast_observed',
  chainId: 1, walletAddress: wallet, amountAtomic: '10000000', transactionHash: hash, code: null, canonicalStatus: 'confirmed',
  recordedAt: '2026-11-10T12:00:00.000Z', ...patch });

function harness(read = async () => ({ walletKind: 'personal', events: [], nextCursor: null }), locale = 'es') {
  const slots = [], effects = [], calls = [];
  let cursor = 0, dirty = true, tree, address = wallet, session = { subject: 'owner-A', email: 'owner@example.test' };
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]));
  const hooks = {
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useState(value) {
      const index = cursor++, cell = slots[index] ??= { value: typeof value === 'function' ? value() : value };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update;
        if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } };
      return [cell.value, cell.set];
    },
    useCallback(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.value = callback; cell.deps = deps; } return cell.value; },
    useEffect(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); }); } },
  };
  const source = readFileSync(new URL('./CompanyPaymentActivity.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const mocks = {
    react: hooks,
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale, t: key => translateMessage(locale, key) }) },
    '@/lib/member-session-context': { useMemberSession: () => session },
    '@/lib/personal-wallet-balance-store.mjs': { personalWalletBalanceSessionKey },
    '@/lib/personal-company-payment-values.mjs': { formatPersonalCompanyPaymentAmount },
    '@/lib/company-payment-client.mjs': { async readCompanyPaymentActivity(options) { calls.push(options); return read(options); } },
    'lucide-react': { RefreshCw: () => null },
    './company-payment.module.css': { default: new Proxy({}, { get: (_target, name) => name }) },
  };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react/jsx-runtime') return require(id);
    assert.ok(Object.hasOwn(mocks, id), `Unexpected activity dependency: ${id}`); return mocks[id];
  }, module, module.exports);
  const render = () => { cursor = 0; dirty = false; tree = module.exports.default({ walletAddress: address }); };
  const api = {
    get tree() { return tree; }, calls,
    async flush() { for (let turn = 0, quiet = 0; turn < 40; turn++) {
      if (dirty) render(); while (effects.length) effects.shift()();
      await new Promise(resolve => setImmediate(resolve));
      if (dirty || effects.length) quiet = 0; else if (++quiet === 2) return tree;
    } assert.fail('Activity did not settle'); },
    async open(value = true) { tree.props.onToggle({ currentTarget: { open: value } }); return this.flush(); },
    async owner(nextSession, nextAddress = address, flush = true) { session = nextSession; address = nextAddress; dirty = true;
      if (!flush) { render(); return tree; } return this.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); },
  };
  return api;
}
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => all(child, predicate))];
const text = node => typeof node === 'string' ? node : React.Children.toArray(node?.props?.children).map(text).join('');
const button = (tree, label) => all(tree, node => node?.type === 'button' && text(node) === label)[0];

test('activity loads only after opening and wallet reports cannot display a backend payment confirmation', async t => {
  const h = harness(async () => ({ walletKind: 'personal', events: [event()], nextCursor: null })); t.after(() => h.unmount());
  await h.flush(); assert.equal(h.calls.length, 0);
  await h.open(); assert.equal(h.calls.length, 1); assert.equal(h.calls[0].limit, 20);
  assert.deepEqual(Object.keys(h.calls[0]).sort(), ['limit', 'signal']);
  const html = renderToStaticMarkup(h.tree);
  assert.ok(html.includes('10 USDT')); assert.ok(html.includes('Ethereum'));
  assert.ok(html.includes(translateMessage('es', 'companyPayment.activityClient')));
  assert.ok(!html.includes(translateMessage('es', 'companyPayment.confirmedTitle')));
  const link = all(h.tree, node => node?.type === 'a')[0];
  assert.equal(link.props.href, `https://etherscan.io/tx/${hash}`); assert.equal(link.props.rel, 'noreferrer noopener');
  await h.open(false); await h.open(); assert.equal(h.calls.length, 1, 'reopening an already loaded journal fetched eagerly');
});

test('canonical Ethereum and Polygon records show distinct networks and source labels in all four locales', async () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const h = harness(async () => ({ walletKind: 'personal', events: [event({ source: 'canonical', event: 'confirmed', chainId: 137 })], nextCursor: null }), locale);
    try {
      await h.flush(); await h.open();
      const html = renderToStaticMarkup(h.tree);
      assert.ok(html.includes('Polygon')); assert.ok(html.includes(translateMessage(locale, 'companyPayment.activityCanonical')));
      assert.ok(html.includes(translateMessage(locale, 'companyPayment.confirmedTitle')));
      assert.equal(all(h.tree, node => node?.type === 'a')[0].props.href, `https://polygonscan.com/tx/${hash}`);
      assert.ok(!html.includes('companyPayment.activity'));
    } finally { h.unmount(); }
  }
});

test('keyset pagination appends older records, deduplicates event IDs and keeps prior records after a query failure', async t => {
  let reads = 0;
  const h = harness(async () => {
    if (++reads === 1) return { walletKind: 'personal', events: [event()], nextCursor: firstId };
    if (reads === 2) return { walletKind: 'personal', events: [event(), event({ eventId: secondId, event: 'wallet_rejected', transactionHash: null })], nextCursor: secondId };
    throw Error('offline');
  }); t.after(() => h.unmount());
  await h.flush(); await h.open();
  button(h.tree, translateMessage('es', 'companyPayment.activityMore')).props.onClick(); await h.flush();
  assert.equal(h.calls[1].cursor, firstId); assert.equal(all(h.tree, node => node?.type === 'li').length, 2);
  button(h.tree, translateMessage('es', 'companyPayment.activityMore')).props.onClick(); await h.flush();
  assert.equal(all(h.tree, node => node?.type === 'li').length, 2);
  assert.equal(all(h.tree, node => node?.props?.role === 'alert').length, 1);
  assert.equal(h.calls.length, 3, 'an activity failure caused an automatic retry loop');
});

test('closing, logout and owner changes abort reads and immediately hide old data and ignore late acknowledgements', async t => {
  const pending = deferred(); let reads = 0;
  const h = harness(async () => ++reads === 1 ? { walletKind: 'personal', events: [event()], nextCursor: firstId } : pending.promise); t.after(() => h.unmount());
  await h.flush(); await h.open();
  button(h.tree, translateMessage('es', 'companyPayment.activityMore')).props.onClick(); await h.flush();
  const signal = h.calls[1].signal;
  await h.owner({ subject: 'owner-B', email: 'owner@example.test' }, wallet, false);
  assert.ok(!renderToStaticMarkup(h.tree).includes(hash));
  await h.flush(); assert.equal(signal.aborted, true); assert.equal(h.tree.props.open, false);
  pending.resolve({ walletKind: 'personal', events: [event()], nextCursor: null }); await h.flush();
  assert.ok(!renderToStaticMarkup(h.tree).includes(hash));
  await h.owner(null); await h.open(); assert.equal(h.calls.length, 2);
  assert.ok(!renderToStaticMarkup(h.tree).includes(hash));
});

test('closing an unfinished query aborts it and reopening explicitly starts a fresh read', async t => {
  const pending = deferred(); let reads = 0;
  const h = harness(async () => ++reads === 1 ? pending.promise : { walletKind: 'personal', events: [], nextCursor: null }); t.after(() => h.unmount());
  await h.flush(); await h.open(); const signal = h.calls[0].signal;
  await h.open(false); assert.equal(signal.aborted, true);
  await h.open(); assert.equal(h.calls.length, 2);
  pending.resolve({ walletKind: 'personal', events: [event()], nextCursor: null }); await h.flush();
  assert.equal(all(h.tree, node => node?.type === 'li').length, 0);
  assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'companyPayment.activityEmpty')));
});

test('a private service acknowledgement for another bound wallet never displays its amount, hash or cursor', async t => {
  const h = harness(async () => ({ walletKind: 'personal', events: [event({ walletAddress: `0x${'2'.repeat(40)}` })], nextCursor: firstId })); t.after(() => h.unmount());
  await h.flush(); await h.open();
  const html = renderToStaticMarkup(h.tree);
  assert.ok(!html.includes(hash)); assert.ok(!html.includes('10 USDT'));
  assert.equal(all(h.tree, node => node?.type === 'li').length, 0);
  assert.equal(all(h.tree, node => node?.props?.role === 'alert').length, 1);
  assert.equal(button(h.tree, translateMessage('es', 'companyPayment.activityMore')), undefined);
});

test('a confirmed historical snapshot identifies its import date without inventing a transfer confirmation date', async () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const h = harness(async () => ({ walletKind: 'personal', events: [event({ source: 'canonical', event: 'snapshot', canonicalStatus: 'confirmed' })], nextCursor: null }), locale);
    try {
      await h.flush(); await h.open(); const html = renderToStaticMarkup(h.tree);
      assert.ok(html.includes(translateMessage(locale, 'companyPayment.activitySnapshot')));
      assert.ok(html.includes(translateMessage(locale, 'companyPayment.activitySnapshotCopy')));
      assert.ok(!html.includes(translateMessage(locale, 'companyPayment.confirmedTitle')));
      assert.equal(all(h.tree, node => node?.type === 'time')[0].props.dateTime, '2026-11-10T12:00:00.000Z');
    } finally { h.unmount(); }
  }
});
