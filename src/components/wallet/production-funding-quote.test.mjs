import assert from 'node:assert/strict';
import test from 'node:test';
import { registrationViewHarness } from '../../app/register/registration-view-test-harness.mjs';
import * as selection from '../../lib/production-funding-selection.mjs';

const address = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`;
const base = { ownerSubject: 'quote-owner-a', address, ready: true, valid: true, blocked: false,
  input: { country: 'MX', sourceCurrencyCode: 'MXN', amount: 200, paymentMethodType: 'SPEI' } };
const deferred = () => { let resolve, reject; return { promise: new Promise((yes, no) => { resolve = yes; reject = no; }), resolve, reject }; };
const flush = async () => { for (let i = 0; i < 3; i++) await new Promise(resolve => setImmediate(resolve)); };
function fixture(t, handler = async input => ({ ...input, requestedAmount: input.amount, destination: { address }, quotes: [{ serviceProvider: 'ONRAMPMONEY' }] })) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1800000000000 });
  const calls = [], failures = []; let enabled = true, props = base;
  const h = registrationViewHarness('../../components/wallet/useProductionFundingQuote.jsx', {
    '@/lib/production-funding-selection.mjs': selection,
    '@/lib/wallet-production-funding-client.mjs': { quoteProductionFunding: async (...args) => { calls.push(args); return handler(...args); } },
  });
  const render = (next = props) => h.render(props = { ...next, canRun: () => enabled, failureKey: error => { failures.push(error); return 'noQuote'; } });
  t.after(() => h.unmount());
  return { calls, failures, render, unmount: () => h.unmount(),
    async tick(ms) { t.mock.timers.tick(ms); await flush(); return render(); },
    enable(value) { enabled = value; } };
}

test('valid owned input debounces exactly one quote, preserving local fiat units without opening checkout or requesting auth', async t => {
  const h = fixture(t); h.render(); assert.equal((await h.tick(499)).loading, true); assert.equal(h.calls.length, 0);
  const quoted = await h.tick(1); assert.equal(h.calls.length, 1); assert.equal(quoted.quote.requestedAmount, 200);
  assert.deepEqual(h.calls[0][0], base.input); assert.equal(h.calls[0][1], address); assert.equal(h.calls[0][2].ownerSubject, base.ownerSubject);
  for (let i = 0; i < 5; i++) h.render({ ...base, input: { ...base.input } }); await h.tick(60000); assert.equal(h.calls.length, 1);
});

test('typing, currency and method changes cancel older debounce timers and only quote the final valid selection', async t => {
  const h = fixture(t); h.render(); await h.tick(250);
  h.render({ ...base, input: { ...base.input, amount: 1000 } }); await h.tick(250); assert.equal(h.calls.length, 0);
  h.render({ ...base, input: { country: 'CO', sourceCurrencyCode: 'COP', amount: 42300, paymentMethodType: 'PSE' } });
  await h.tick(500); assert.equal(h.calls.length, 1); assert.equal(h.calls[0][0].amount, 42300); assert.equal(h.calls[0][0].sourceCurrencyCode, 'COP');
});

test('unready, malformed, retired or unmounted scopes cannot dispatch a captured automatic quote', async t => {
  const h = fixture(t); h.render({ ...base, ready: false }); await h.tick(1000); assert.equal(h.calls.length, 0);
  h.render({ ...base, valid: false }); await h.tick(1000); assert.equal(h.calls.length, 0);
  h.render({ ...base, ownerSubject: '' }); await h.tick(1000); assert.equal(h.calls.length, 0);
  h.render(base); h.enable(false); await h.tick(500); assert.equal(h.calls.length, 0);
  h.enable(true); h.render({ ...base, input: { ...base.input, amount: 201 } }); h.unmount(); t.mock.timers.tick(1000); await flush(); assert.equal(h.calls.length, 0);
});

test('a late previous owner or address quote is ignored after cancellation and never becomes a provider option', async t => {
  const pending = deferred(), h = fixture(t, () => pending.promise); h.render(); await h.tick(500);
  const oldSignal = h.calls[0][2].signal; h.render({ ...base, ownerSubject: 'quote-owner-b', address: other });
  assert.equal(oldSignal.aborted, true); pending.resolve({ destination: { address }, quotes: [{ serviceProvider: 'BANXA' }] }); await flush();
  assert.equal(h.render().quote, null); assert.equal(h.failures.length, 0);
});

test('provider rejection is not retried by renders, timers or a busy-state transition; retry requires its explicit action', async t => {
  let rejected = true;
  const h = fixture(t, async input => { if (rejected) throw Error('no valid quote'); return { requestedAmount: input.amount, quotes: [] }; });
  h.render(); assert.equal((await h.tick(500)).error, 'noQuote');
  h.render({ ...base, blocked: true }); h.render(base); await h.tick(10000); assert.equal(h.calls.length, 1);
  const failed = h.render(); rejected = false; failed.retry(); h.render(); const retry = await h.tick(500);
  assert.equal(h.calls.length, 2); assert.equal(retry.error, ''); assert.ok(retry.quote);
});

test('cached owned prices expire without polling, and exact selection reuse does not refetch or extend their original TTL', async t => {
  const h = fixture(t); h.render(); const first = (await h.tick(500)).quote;
  h.render({ ...base, input: { ...base.input, amount: 300 } }); await h.tick(500); assert.equal(h.calls.length, 2);
  h.render(base); const restored = h.render(); assert.equal(restored.quote.receivedAt, first.receivedAt);
  assert.equal(h.calls.length, 2); const expired = await h.tick(120001);
  assert.equal(expired.quote, null); assert.equal(expired.error, 'quoteExpired'); assert.equal(h.calls.length, 2);
});

test('an already dispatched quote interrupted by another action cannot silently repeat when that action finishes', async t => {
  const wait = deferred(), h = fixture(t, () => wait.promise); h.render(); await h.tick(500);
  h.render({ ...base, blocked: true }); assert.equal(h.calls[0][2].signal.aborted, true);
  h.render(base); await h.tick(1000); assert.equal(h.calls.length, 1); assert.equal(h.render().error, 'unavailable');
  wait.resolve({ quotes: [{ serviceProvider: 'BANXA' }] }); await flush(); assert.equal(h.render().quote, null);
});

test('failed and cancelled estimates share a bounded cache instead of retaining every attempted selection', async t => {
  const h = fixture(t, async () => { throw Error('no valid quote'); });
  for (let i = 0; i < 33; i++) {
    h.render({ ...base, input: { ...base.input, amount: 200 + i } });
    assert.equal((await h.tick(500)).error, 'noQuote');
  }
  assert.equal(h.calls.length, 33);
  h.render({ ...base, input: { ...base.input, amount: 232 } });
  await h.tick(500); assert.equal(h.calls.length, 33);
  h.render(base); await h.tick(500);
  assert.equal(h.calls.length, 34, 'the oldest failed selection was evicted after 32 newer entries');
  assert.equal(h.render().error, 'noQuote');
});
