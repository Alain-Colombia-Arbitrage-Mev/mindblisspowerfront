import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { companyPaymentEventInput, companyPaymentEventAck, companyPaymentEventView, companyPaymentEventPage, companyPaymentEventQuery } from './company-payment-events.mjs';
import { handleCompanyPaymentJournal } from './company-payment-bff.mjs';
import { recordCompanyPaymentEvent, readCompanyPaymentActivity } from './company-payment-client.mjs';
import { PERSONAL_COMPANY_PAYMENT, POLYGON_COMPANY_PAYMENT } from './personal-company-payment-values.mjs';

const paymentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', eventId = 'bbbbbbbb-bbbb-5bbb-8bbb-bbbbbbbbbbbb';
const attemptId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', otherId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const transactionHash = `0x${'e'.repeat(64)}`;
const input = { eventId, paymentId, attemptId, event: 'broadcast_observed', transactionHash };
const timestamp = '2026-11-11T04:00:00.000Z';
const ack = { walletKind: 'personal', eventId, paymentId, attemptId, source: 'client_reported', event: input.event, recordedAt: timestamp };
const event = { ...ack, ...POLYGON_COMPANY_PAYMENT, walletAddress: `0x${'1'.repeat(40)}`, amountAtomic: '28433366',
  transactionHash, code: null, canonicalStatus: null };
const page = { walletKind: 'personal', events: [event], nextCursor: null };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), NODE_ENV: 'production',
  AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', PERSONAL_COMPANY_PAYMENTS_ENABLED: 'true' };
const noTransport = async () => assert.fail('invalid journal request reached transport');
function request({ method = 'POST', path = 'events', query = '', body = input, headers = {} } = {}) {
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/company-payments/${path}${query}`, { method,
    headers: { cookie: 'tracking=not-forwarded; better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN,
      'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10', ...headers },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
}

test('journal input cannot assert ownership, a confirmed status, token, amount, signature or arbitrary errors', () => {
  assert.deepEqual(companyPaymentEventInput(input), input);
  for (const patch of [{ event: 'confirmed' }, { source: 'canonical' }, { canonicalStatus: 'confirmed' }, { walletAddress: event.walletAddress },
    { chainId: 137 }, { amountAtomic: '1' }, { signature: 'secret' }, { code: 'private error contents' }, { transactionHash: transactionHash.toUpperCase() },
    { event: 'wallet_prompt_opened' }, { attemptId: null }]) assert.equal(companyPaymentEventInput({ ...input, ...patch }), null);
  const { transactionHash: _hash, ...missing } = input;
  assert.equal(companyPaymentEventInput(missing), null);
});

test('journal projections distinguish client reports from canonical receipts and honest historical snapshots', () => {
  const { walletKind: _kind, ...expected } = event;
  assert.deepEqual(companyPaymentEventView(event), expected);
  assert.equal(companyPaymentEventView({ ...event, source: 'canonical', event: 'confirmed', attemptId: null, canonicalStatus: 'confirmed' }).event, 'confirmed');
  assert.equal(companyPaymentEventView({ ...event, source: 'canonical', event: 'snapshot', attemptId: null, canonicalStatus: 'submitted' }).event, 'snapshot');
  for (const patch of [{ source: 'client_reported', event: 'confirmed' }, { canonicalStatus: 'confirmed' }, { ...PERSONAL_COMPANY_PAYMENT, tokenAddress: event.tokenAddress },
    { source: 'canonical', event: 'confirmed', canonicalStatus: 'prepared' }, { recipientAddress: event.walletAddress }, { code: 'raw stack' }]) {
    assert.equal(companyPaymentEventView({ ...event, ...patch }), null);
  }
  assert.equal(companyPaymentEventPage({ ...page, events: [event, event] }), null);
  assert.equal(companyPaymentEventPage({ ...page, nextCursor: otherId }), null);
  assert.equal(companyPaymentEventPage({ ...page, events: [event, { ...event, eventId: otherId, walletAddress: `0x${'2'.repeat(40)}` }] }), null);
  assert.equal(companyPaymentEventAck({ ...ack, attemptId: null }, input), null);
});

test('pagination cannot smuggle another owner, duplicate or encoded selector into the journal', () => {
  assert.deepEqual(companyPaymentEventQuery(`?paymentId=${paymentId}&limit=50&cursor=${eventId}`, 'events'),
    { paymentId, limit: 50, query: `?paymentId=${paymentId}&limit=50&cursor=${eventId}` });
  for (const query of ['?limit=51', '?limit=01', '?owner=x', '?limit=20&limit=20', `?cursor=${eventId}&limit=20`, '?limit=%32%30', `?paymentId=${paymentId}`]) {
    assert.equal(companyPaymentEventQuery(query, 'activity'), null);
  }
});

test('journal mutation retains private session HMAC, strips private upstream fields and never confirms a payment', async () => {
  const response = await handleCompanyPaymentJournal(request(), 'recordEvent', { env, serviceRequest: async (url, init) => {
    assert.equal(url, `${env.BETTER_AUTH_BACKEND_URL}/api/member/company-payments/events`);
    assert.equal(init.headers.cookie, 'better-auth.session_token=synthetic');
    assert.deepEqual(JSON.parse(init.body), input);
    const sha = value => createHash('sha256').update(value).digest('hex');
    assert.equal(init.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST',
      '/api/member/company-payments/events', init.headers['x-vp-auth-timestamp'], '198.51.100.10', sha(init.headers.cookie), sha(init.body)].join('\n')).digest('hex'));
    return { ok: true, data: { ...ack, rawSignature: 'private', userId: 'private' } };
  } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), ack);
  const forged = await handleCompanyPaymentJournal(request(), 'recordEvent', { env, serviceRequest: async () => ({ ok: true, data: { ...ack, source: 'canonical' } }) });
  assert.equal(forged.status, 502);
});

test('journal rejects foreign origins, absent sessions, unsupported methods and elevated bodies before transport', async () => {
  for (const [changed, status] of [[{ headers: { cookie: '' } }, 401], [{ headers: { origin: 'https://wallet.mindblisspower.com' } }, 403],
    [{ headers: { 'sec-fetch-site': 'same-site' } }, 403], [{ headers: { 'content-length': '2049' } }, 413], [{ body: { ...input, event: 'confirmed' } }, 400],
    [{ query: '?owner=other' }, 400], [{ method: 'GET' }, 405]]) {
    assert.equal((await handleCompanyPaymentJournal(request(changed), 'recordEvent', { env, serviceRequest: noTransport })).status, status);
  }
  assert.equal((await handleCompanyPaymentJournal(request(), 'recordEvent', { env: { ...env, AUTH_PUBLIC_ORIGIN: 'https://wallet.mindblisspower.com' }, serviceRequest: noTransport })).status, 404);
});

test('activity reads use the backend pathname HMAC protocol and strictly forward owned pagination', async () => {
  for (const [action, path, query, data] of [['activityHistory', 'activity', '?limit=20', page], ['eventHistory', 'events', `?paymentId=${paymentId}&limit=20`, { ...page, paymentId }]]) {
    const response = await handleCompanyPaymentJournal(request({ method: 'GET', path, query }), action, { env, serviceRequest: async (url, init) => {
      assert.equal(url, `${env.BETTER_AUTH_BACKEND_URL}/api/member/company-payments/${path}${query}`);
      assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
      const sha = value => createHash('sha256').update(value).digest('hex');
      assert.equal(init.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([
        'GET', `/api/member/company-payments/${path}`, init.headers['x-vp-auth-timestamp'], '198.51.100.10', sha(init.headers.cookie), sha('')].join('\n')).digest('hex'));
      return { ok: true, data };
    } });
    assert.equal(response.status, 200); assert.equal((await response.json()).events.length, 1);
  }
});

test('audit delivery retries only a transient transport once with stable UUID and never resends a payment', async () => {
  const original = globalThis.fetch; let calls = 0;
  try {
    globalThis.fetch = async (path, init) => { calls++; assert.equal(path, '/api/member/company-payments/events');
      assert.deepEqual(JSON.parse(init.body), input); if (calls === 1) throw new TypeError('network'); return Response.json(ack); };
    assert.deepEqual(await recordCompanyPaymentEvent(input), ack); assert.equal(calls, 2);
    for (const status of [400, 401, 403, 409, 429]) {
      calls = 0; globalThis.fetch = async () => { calls++; return Response.json({ error: 'company_payment_unavailable' }, { status }); };
      await assert.rejects(recordCompanyPaymentEvent(input)); assert.equal(calls, 1);
    }
    calls = 0; await assert.rejects(recordCompanyPaymentEvent(input, { isActive: () => false }), { name: 'AbortError' }); assert.equal(calls, 0);
    globalThis.fetch = async path => { assert.equal(path, '/api/member/company-payments/activity?limit=20'); return Response.json(page); };
    assert.equal((await readCompanyPaymentActivity()).events.length, 1);
  } finally { globalThis.fetch = original; }
});
