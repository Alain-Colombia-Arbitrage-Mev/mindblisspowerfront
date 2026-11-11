import assert from 'node:assert/strict';
import test from 'node:test';
import { readCompanyPaymentHistory, readCompanyPaymentStatus, writeCompanyPayment } from './company-payment-client.mjs';
import { PERSONAL_COMPANY_PAYMENT } from './personal-company-payment-values.mjs';

const paymentId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const otherId = 'd8a4c010-cc33-44da-a297-8b3c6440f492';
const hash = `0x${'a'.repeat(64)}`;
const ack = (patch = {}) => ({ paymentId, walletKind: 'personal', walletAddress: `0x${'1'.repeat(40)}`, ...PERSONAL_COMPANY_PAYMENT,
  amountAtomic: '9007199254740993123456', status: 'prepared', createdAt: '2026-11-11T10:00:00.000Z', expiresAt: '2026-11-11T10:15:00.000Z',
  transactionHash: null, blockHash: null, blockNumber: null, confirmations: 0, requiredConfirmations: 12, failureReason: null,
  abandonedAt: null, membershipAssignment: 'pending', ...patch });
const input = { requestId: paymentId, amountAtomic: ack().amountAtomic };

test('prepare sends exact atomic units only to the same-origin personal endpoint without a wallet/provider fallback', async () => {
  const original = globalThis.fetch, calls = [];
  try {
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json({ ...ack(), privateKey: 'synthetic-private' }); };
    assert.deepEqual(await writeCompanyPayment('prepare', input), ack());
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, '/api/member/company-payments/prepare');
    assert.equal(calls[0].init.method, 'POST');
    assert.deepEqual(JSON.parse(calls[0].init.body), input);
    assert.equal(calls[0].init.credentials, 'same-origin');
    assert.equal(calls[0].init.cache, 'no-store');
    assert.equal(calls[0].init.redirect, 'error');
    assert.equal(calls[0].init.headers['content-type'], 'application/json');
  } finally { globalThis.fetch = original; }
});

test('changed request ID, exact amount, transaction hash or fixed receipt policy fails closed', async () => {
  const original = globalThis.fetch;
  try {
    for (const patch of [{ paymentId: otherId }, { amountAtomic: '1' }, { recipientAddress: `0x${'2'.repeat(40)}` },
      { tokenAddress: `0x${'2'.repeat(40)}` }, { walletKind: 'administrative' }, { membershipAssignment: 'activated' }]) {
      globalThis.fetch = async () => Response.json(ack(patch));
      await assert.rejects(writeCompanyPayment('prepare', input), { message: 'company_payment_unavailable' });
    }
    globalThis.fetch = async () => Response.json(ack({ status: 'submitted', transactionHash: `0x${'b'.repeat(64)}` }));
    await assert.rejects(writeCompanyPayment('submit', { paymentId, transactionHash: hash }), { message: 'company_payment_unavailable' });
    globalThis.fetch = async () => Response.json(ack({ paymentId: otherId }));
    await assert.rejects(readCompanyPaymentStatus(paymentId), { message: 'company_payment_unavailable' });
  } finally { globalThis.fetch = original; }
});

test('failed and ambiguous POSTs are never retried, including a transaction hash already broadcast by the wallet', async () => {
  const original = globalThis.fetch;
  try {
    for (const [action, body] of [['prepare', input], ['submit', { paymentId, transactionHash: hash }], ['verify', { paymentId }], ['abandon', { paymentId }]]) {
      for (const outcome of ['unavailable', 'network', 'malformed']) {
        let calls = 0;
        globalThis.fetch = async () => { calls++; if (outcome === 'network') throw new TypeError('private transport failed');
          return outcome === 'malformed' ? new Response('not-json', { status: 502 }) : Response.json({ error: 'company_payment_rpc_unavailable' }, { status: 503 }); };
        await assert.rejects(writeCompanyPayment(action, body));
        assert.equal(calls, 1, `${action}/${outcome} must not replay a write`);
      }
    }
  } finally { globalThis.fetch = original; }
});

test('private provider/database details and oversized success bodies never reach callers', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ error: 'postgresql://synthetic-private@internal/database', details: 'private' }, { status: 503 });
    await assert.rejects(writeCompanyPayment('prepare', input), { message: 'company_payment_unavailable' });
    globalThis.fetch = async () => Response.json({ ...ack(), private: 'x'.repeat(65537) });
    await assert.rejects(writeCompanyPayment('prepare', input), { message: 'company_payment_unavailable' });
    globalThis.fetch = async () => Response.json({ error: 'company_payment_pending_exists', details: 'private' }, { status: 409 });
    await assert.rejects(writeCompanyPayment('prepare', input), { message: 'company_payment_pending_exists' });
  } finally { globalThis.fetch = original; }
});

test('history and status recover only personal receipt evidence while confirmed membership remains pending', async () => {
  const original = globalThis.fetch, calls = [];
  const confirmed = ack({ status: 'confirmed', transactionHash: hash, blockHash: `0x${'b'.repeat(64)}`, blockNumber: '80000000', confirmations: 12 });
  try {
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json(path.endsWith('/history')
      ? { walletKind: 'personal', membershipAssignment: 'pending', records: [confirmed] } : confirmed); };
    assert.deepEqual((await readCompanyPaymentHistory()).records, [confirmed]);
    assert.deepEqual(await readCompanyPaymentStatus(paymentId), confirmed);
    assert.ok(calls.every(call => call.init.method === 'GET' && call.init.body === undefined && call.init.cache === 'no-store'));
    assert.equal(calls[1].path, `/api/member/company-payments/status?paymentId=${paymentId}`);
    assert.equal((await writeCompanyPayment('verify', { paymentId })).membershipAssignment, 'pending');
    globalThis.fetch = async () => Response.json({ walletKind: 'administrative', membershipAssignment: 'pending', records: [confirmed] });
    await assert.rejects(readCompanyPaymentHistory(), { message: 'company_payment_unavailable' });
  } finally { globalThis.fetch = original; }
});

test('malformed local input never sends a request, and cancelled late acknowledgements cannot publish', async () => {
  const original = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json(ack()); };
    await assert.rejects(writeCompanyPayment('prepare', { ...input, subject: 'another-user' }), { message: 'invalid_request' });
    await assert.rejects(readCompanyPaymentStatus('invalid'), { message: 'invalid_request' });
    await assert.rejects(readCompanyPaymentStatus([paymentId]), { message: 'invalid_request' });
    await assert.rejects(readCompanyPaymentStatus(paymentId.toUpperCase()), { message: 'invalid_request' });
    assert.equal(calls, 0);
    let resolve;
    const deferred = new Promise(done => { resolve = done; });
    const controller = new AbortController();
    globalThis.fetch = async (_path, init) => { calls++; assert.ok(init.signal); return deferred; };
    const pending = writeCompanyPayment('prepare', input, { signal: controller.signal });
    controller.abort(); resolve(Response.json(ack()));
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('cancellation wins over a late failure so an old wallet context cannot publish its error', async () => {
  const original = globalThis.fetch;
  try {
    let resolve;
    const deferred = new Promise(done => { resolve = done; });
    globalThis.fetch = async () => deferred;
    const controller = new AbortController();
    const pending = writeCompanyPayment('submit', { paymentId, transactionHash: hash }, { signal: controller.signal });
    controller.abort();
    resolve(Response.json({ error: 'company_payment_rpc_unavailable' }, { status: 503 }));
    await assert.rejects(pending, { name: 'AbortError' });
  } finally { globalThis.fetch = original; }
});

test('abandon sends only the receipt ID and requires an acknowledged timestamp on an unchanged prepared draft', async () => {
  const original = globalThis.fetch;
  const abandoned = ack({ abandonedAt: '2026-11-11T10:01:00.000Z' });
  try {
    let calls = 0;
    globalThis.fetch = async (path, init) => { calls++; assert.equal(path, '/api/member/company-payments/abandon');
      assert.equal(init.method, 'POST'); assert.deepEqual(JSON.parse(init.body), { paymentId }); return Response.json(abandoned); };
    assert.deepEqual(await writeCompanyPayment('abandon', { paymentId }), abandoned);
    assert.equal(calls, 1);
    for (const value of [ack(), { ...abandoned, status: 'confirmed', transactionHash: hash, blockHash: `0x${'b'.repeat(64)}`, blockNumber: '80000000', confirmations: 12 }]) {
      globalThis.fetch = async () => Response.json(value);
      await assert.rejects(writeCompanyPayment('abandon', { paymentId }), { message: 'company_payment_unavailable' });
    }
  } finally { globalThis.fetch = original; }
});
