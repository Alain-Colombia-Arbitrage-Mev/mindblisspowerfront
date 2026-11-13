import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { readNOWPaymentsPurchases, resumeNOWPaymentsPurchase, cancelNOWPaymentsPurchase } from './nowpayments-purchases.mjs';
import { readNOWPaymentsReceipt } from './nowpayments-receipt.mjs';
import { requestProfile } from '../app/dashboard/profile/profile-model.mjs';

const order = '10000000-0000-4000-8000-000000000001';
const profile = { first_name: 'Synthetic', last_name: 'Person', phone: '', country: '', payout_wallet_usdc: '' };
const pending = { provider: 'nowpayments', order_id: order, state: 'pending', payment_confirmed: false,
  signature_validated: false, provider_verified: false, persisted: false, fulfillment_status: 'awaiting_payment' };
function olderSignal(t) {
  for (const name of ['any', 'timeout']) {
    const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, name);
    Object.defineProperty(AbortSignal, name, { configurable: true, value: undefined });
    t.after(() => Object.defineProperty(AbortSignal, name, descriptor));
  }
}

test('private purchase/status/profile clients work without newer Safari AbortSignal APIs and send each action once', async t => {
  olderSignal(t);
  const scheduled = globalThis.setTimeout, unschedule = globalThis.clearTimeout, timers = new Set(), calls = [];
  t.mock.method(globalThis, 'setTimeout', (...args) => { const id = scheduled(...args); timers.add(id); return id; });
  t.mock.method(globalThis, 'clearTimeout', id => { timers.delete(id); return unschedule(id); });
  const controller = new AbortController();
  const response = data => ({ signal: controller.signal, fetchImpl: async (url, init) => {
    calls.push([url, init]); assert.equal(init.credentials, 'same-origin'); assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'error'); assert.ok(init.signal instanceof AbortSignal); return Response.json(data);
  } });
  assert.equal((await readNOWPaymentsPurchases(response({ provider: 'nowpayments', purpose: 'membership', purchases: [], has_more: false }))).purchases.length, 0);
  assert.equal((await resumeNOWPaymentsPurchase(order, response({ provider: 'nowpayments', order_id: order,
    url: 'https://nowpayments.io/payment/?iid=123', reused: true, fulfillment_status: 'awaiting_payment', total_usd: '50.00', fee_usd: '0.00' }))).order_id, order);
  assert.equal((await cancelNOWPaymentsPurchase(order, response({ order_id: order, state: 'cancelled_local',
    provider_invoice_revoked: false, late_payment_policy: 'review_required' }))).state, 'cancelled_local');
  assert.deepEqual(await readNOWPaymentsReceipt(order, response(pending)), pending);
  assert.equal((await requestProfile('GET', undefined, response(profile))).name, 'Synthetic Person');
  assert.equal((await requestProfile('POST', { name: 'Synthetic Person' }, response({ ok: true, profile }))).name, 'Synthetic Person');
  assert.equal(calls.length, 6); assert.equal(timers.size, 0);
  assert.deepEqual(calls.map(([, init]) => init.method || 'GET'), ['GET', 'POST', 'POST', 'GET', 'GET', 'POST']);
  assert.deepEqual(JSON.parse(calls[1][1].body), { order_id: order });
  assert.deepEqual(JSON.parse(calls[2][1].body), { order_id: order });
});

test('mobile actions propagate caller cancellation and never retry an ambiguous mutation', async t => {
  olderSignal(t);
  for (const run of [options => cancelNOWPaymentsPurchase(order, options), options => requestProfile('POST', { name: 'Synthetic' }, options)]) {
    const controller = new AbortController(); let calls = 0;
    const pending = run({ signal: controller.signal, fetchImpl: async (_url, { signal }) => {
      calls++; return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }));
    } });
    controller.abort(); await assert.rejects(pending); assert.equal(calls, 1);
  }
});

test('active checkout and profile components do not regress to unsupported AbortSignal static APIs', () => {
  for (const file of ['../app/dashboard/packages/ActivatePackageButton.jsx', '../app/dashboard/_components/executive-pages/ProfileDashboardPage.jsx']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /AbortSignal\.(?:any|timeout)\(/); assert.match(source, /browserRequestDeadline/);
    assert.match(source, /finally.*deadline\.dispose\(\)/s);
  }
});
