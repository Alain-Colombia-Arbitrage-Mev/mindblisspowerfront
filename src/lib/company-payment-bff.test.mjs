import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { handleCompanyPayment } from './company-payment-bff.mjs';
import { PERSONAL_COMPANY_PAYMENT } from './personal-company-payment-values.mjs';

const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), NODE_ENV: 'production',
  AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', PERSONAL_COMPANY_PAYMENTS_ENABLED: 'true' };
const paymentId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const otherId = 'd8a4c010-cc33-44da-a297-8b3c6440f492';
const hash = `0x${'a'.repeat(64)}`;
const ack = (patch = {}) => ({ paymentId, walletKind: 'personal', walletAddress: `0x${'1'.repeat(40)}`, ...PERSONAL_COMPANY_PAYMENT,
  amountAtomic: '9007199254740993123456', status: 'prepared', createdAt: '2026-11-11T10:00:00.000Z', expiresAt: '2026-11-11T10:15:00.000Z',
  transactionHash: null, blockHash: null, blockNumber: null, confirmations: 0, requiredConfirmations: 12, failureReason: null,
  abandonedAt: null, membershipAssignment: 'pending', ...patch });
const input = { requestId: paymentId, amountAtomic: ack().amountAtomic };
function request(action, { body = input, headers = {}, method, query, raw } = {}) {
  const verb = method || (['history', 'status'].includes(action) ? 'GET' : 'POST');
  const suffix = query ?? (action === 'status' ? `?paymentId=${paymentId}` : '');
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/company-payments/${action}${suffix}`, { method: verb,
    headers: { cookie: 'tracking=private; better-auth.session_token=synthetic-session; __Secure-better-auth.session_data=synthetic-data; arbitrary=private',
      origin: env.AUTH_PUBLIC_ORIGIN, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
      'cf-connecting-ip': '198.51.100.10', authorization: 'Bearer browser-must-not-forward', 'x-forwarded-for': '203.0.113.99', ...headers },
    ...(verb === 'POST' ? { body: raw ?? JSON.stringify(body) } : {}) });
}
const forbiddenTransport = async () => assert.fail('rejected input reached private transport');

test('the native session, canonical body, path and trusted IP are HMAC-bound in exactly one private request', async () => {
  let calls = 0;
  const response = await handleCompanyPayment(request('prepare'), 'prepare', { env, serviceRequest: async (url, init) => {
    calls++;
    assert.equal(url, 'https://auth.core.internal/api/member/company-payments/prepare');
    assert.equal(init.method, 'POST'); assert.deepEqual(JSON.parse(init.body), input);
    assert.equal(init.headers.cookie, 'better-auth.session_token=synthetic-session; __Secure-better-auth.session_data=synthetic-data');
    assert.equal(init.headers.authorization, undefined); assert.equal(init.headers['x-forwarded-for'], undefined);
    assert.equal(init.headers['x-vp-auth-client-ip'], '198.51.100.10');
    assert.equal(init.headers.origin, env.AUTH_PUBLIC_ORIGIN);
    const timestamp = init.headers['x-vp-auth-timestamp'];
    assert.match(timestamp, /^\d+$/);
    const sha = value => createHash('sha256').update(value).digest('hex');
    assert.equal(init.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
      .update(['POST', '/api/member/company-payments/prepare', timestamp, '198.51.100.10', sha(init.headers.cookie), sha(init.body)].join('\n')).digest('hex'));
    return { ok: true, data: { ...ack(), subject: 'private-owner', privateKey: 'synthetic-private', membershipActivated: true } };
  } });
  assert.equal(calls, 1); assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(response.headers.get('set-cookie'), null); assert.deepEqual(await response.json(), ack());
});

test('reads bind the exact status query to HMAC and recover only safe personal evidence, never membership activation', async () => {
  const confirmed = ack({ status: 'confirmed', transactionHash: hash, blockHash: `0x${'b'.repeat(64)}`, blockNumber: '80000000', confirmations: 12 });
  for (const action of ['status', 'history']) {
    const expected = action === 'history' ? { walletKind: 'personal', membershipAssignment: 'pending', records: [confirmed] } : confirmed;
    const response = await handleCompanyPayment(request(action), action, { env, serviceRequest: async (url, init) => {
      const path = `/api/member/company-payments/${action}${action === 'status' ? `?paymentId=${paymentId}` : ''}`;
      assert.equal(url, `https://auth.core.internal${path}`); assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
      const sha = value => createHash('sha256').update(value).digest('hex');
      assert.equal(init.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
        .update(['GET', path, init.headers['x-vp-auth-timestamp'], '198.51.100.10', sha(init.headers.cookie), sha('')].join('\n')).digest('hex'));
      return { ok: true, data: expected };
    } });
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), expected);
  }
});

test('personal company APIs require a native cookie and enabled personal host, without administrative-domain fallback', async () => {
  for (const cookie of ['', 'tracking=synthetic', 'better-auth.session_data=synthetic', 'better-auth.session_token=']) {
    assert.equal((await handleCompanyPayment(request('prepare', { headers: { cookie } }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, 401);
  }
  assert.equal((await handleCompanyPayment(request('prepare'), 'prepare', { env: { ...env, PERSONAL_COMPANY_PAYMENTS_ENABLED: 'false' }, serviceRequest: forbiddenTransport })).status, 503);
  for (const origin of ['https://wallet.mindblisspower.com', 'https://app.mindblisspower.com.evil.test', 'https://other.test']) {
    assert.equal((await handleCompanyPayment(request('prepare'), 'prepare', { env: { ...env, AUTH_PUBLIC_ORIGIN: origin }, serviceRequest: forbiddenTransport })).status, 404);
  }
  for (const changed of [{ AUTH_BFF_SHARED_SECRET: 'short' }, { BETTER_AUTH_BACKEND_URL: 'https://user:secret@auth.core.internal' },
    { AUTH_PROVIDER: 'legacy' }, { AUTH_CLIENT_IP_HEADER: 'x-forwarded-for' }]) {
    assert.equal((await handleCompanyPayment(request('prepare'), 'prepare', { env: { ...env, ...changed }, serviceRequest: forbiddenTransport })).status, 503);
  }
  assert.equal((await handleCompanyPayment(request('prepare', { headers: { 'cf-connecting-ip': '' } }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, 503);
});

test('CSRF protection rejects foreign or same-site subdomain mutations and non-JSON content before transport', async () => {
  for (const headers of [{ origin: '' }, { origin: 'https://wallet.mindblisspower.com' }, { origin: 'https://evil.test' },
    { 'sec-fetch-site': 'same-site' }, { 'sec-fetch-site': 'cross-site' }]) {
    assert.equal((await handleCompanyPayment(request('prepare', { headers }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, 403);
  }
  assert.equal((await handleCompanyPayment(request('prepare', { headers: { 'content-type': 'text/plain' } }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, 415);
  assert.equal((await handleCompanyPayment(request('prepare', { method: 'GET' }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, 405);
  assert.equal((await handleCompanyPayment(request('history', { method: 'POST' }), 'history', { env, serviceRequest: forbiddenTransport })).status, 405);
});

test('strict body and query shapes cannot assign another owner, destination, asset, package or hash', async () => {
  for (const body of [{ ...input, subject: 'another-owner' }, { ...input, userId: 'another-owner' },
    { ...input, walletKind: 'administrative' }, { ...input, recipientAddress: `0x${'2'.repeat(40)}` }, { ...input, tokenAddress: `0x${'2'.repeat(40)}` },
    { ...input, packageId: 17 }, { ...input, chainId: 1 }, { ...input, amountAtomic: 20 }, { ...input, amountAtomic: '01' },
    { ...input, requestId: [paymentId] }]) {
    assert.equal((await handleCompanyPayment(request('prepare', { body }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, 400);
  }
  for (const query of [`?paymentId=${paymentId}&subject=another-owner`, `?paymentId=${paymentId}&paymentId=${otherId}`, '?paymentId=invalid', `?paymentId=%64${paymentId.slice(1)}`]) {
    assert.equal((await handleCompanyPayment(request('status', { query }), 'status', { env, serviceRequest: forbiddenTransport })).status, 400);
  }
  assert.equal((await handleCompanyPayment(request('history', { query: '?subject=another-owner' }), 'history', { env, serviceRequest: forbiddenTransport })).status, 400);
  assert.equal((await handleCompanyPayment(request('prepare', { query: '?walletKind=administrative' }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, 400);
});

test('oversized, malformed and invalid-UTF8 bodies are bounded and never invoke payment transport', async () => {
  for (const [raw, status] of [['{not-json', 400], ['x'.repeat(2049), 413], [new Uint8Array([0xc3, 0x28]), 400]]) {
    assert.equal((await handleCompanyPayment(request('prepare', { raw }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, status);
  }
  for (const length of ['2049', 'not-a-number']) {
    assert.equal((await handleCompanyPayment(request('prepare', { headers: { 'content-length': length } }), 'prepare', { env, serviceRequest: forbiddenTransport })).status, 413);
  }
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(2049)); }, cancel() { cancelled = true; } });
  const streamed = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/company-payments/prepare`, { method: 'POST', duplex: 'half',
    headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json' }, body: stream });
  assert.equal((await handleCompanyPayment(streamed, 'prepare', { env, serviceRequest: forbiddenTransport })).status, 413);
  assert.equal(cancelled, true);
});

test('acknowledgements cannot change request amount, destination, wallet kind, hash or payment identity', async () => {
  for (const data of [ack({ paymentId: otherId }), ack({ amountAtomic: '1' }), ack({ recipientAddress: `0x${'2'.repeat(40)}` }),
    ack({ tokenAddress: `0x${'2'.repeat(40)}` }), ack({ chainId: 137 }),
    ack({ chainId: 137, tokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' }), ack({ tokenDecimals: 18 }), ack({ walletKind: 'administrative' }),
    ack({ membershipAssignment: 'activated' }), ack({ paymentId: [paymentId] })]) {
    assert.equal((await handleCompanyPayment(request('prepare'), 'prepare', { env, serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
  const submitted = ack({ status: 'submitted', transactionHash: `0x${'c'.repeat(64)}` });
  assert.equal((await handleCompanyPayment(request('submit', { body: { paymentId, transactionHash: hash } }), 'submit', { env,
    serviceRequest: async () => ({ ok: true, data: submitted }) })).status, 502);
  assert.equal((await handleCompanyPayment(request('status'), 'status', { env,
    serviceRequest: async () => ({ ok: true, data: ack({ paymentId: otherId }) }) })).status, 502);
});

test('history rejects administrative context and duplicate receipts, without exporting upstream owner or private fields', async () => {
  const history = { walletKind: 'personal', membershipAssignment: 'pending', records: [ack()] };
  const response = await handleCompanyPayment(request('history'), 'history', { env,
    serviceRequest: async () => ({ ok: true, data: { ...history, subject: 'private', records: [{ ...ack(), subject: 'private' }] } }) });
  assert.deepEqual(await response.json(), history);
  for (const data of [{ ...history, walletKind: 'administrative' }, { ...history, records: [ack(), ack()] },
    { ...history, records: [ack({ membershipAssignment: 'activated' })] }]) {
    assert.equal((await handleCompanyPayment(request('history'), 'history', { env, serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
});

test('upstream failures expose only safe codes and possibly committed writes are never retried', async () => {
  for (const outcome of ['throw', 'unsafe-error', 'safe-error']) {
    let calls = 0;
    const response = await handleCompanyPayment(request('submit', { body: { paymentId, transactionHash: hash } }), 'submit', { env,
      serviceRequest: async () => { calls++; if (outcome === 'throw') throw new Error('private key and transport details');
        return { ok: false, status: outcome === 'safe-error' ? 409 : 503,
          data: { error: outcome === 'safe-error' ? 'company_payment_hash_reused' : 'postgresql://synthetic-private@internal/db', details: 'private' } }; } });
    assert.equal(calls, 1); assert.equal(response.status, outcome === 'safe-error' ? 409 : 503);
    assert.deepEqual(await response.json(), { error: outcome === 'safe-error' ? 'company_payment_hash_reused' : 'company_payment_unavailable' });
  }
});

test('the default private-service transport also performs one attempt for a failed submit', async () => {
  let calls = 0;
  const response = await handleCompanyPayment(request('submit', { body: { paymentId, transactionHash: hash } }), 'submit', { env,
    fetchImpl: async (url, init) => { calls++; assert.equal(url, 'https://auth.core.internal/api/member/company-payments/submit');
      assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'manual'); assert.equal(init.cache, 'no-store');
      assert.deepEqual(JSON.parse(init.body), { paymentId, transactionHash: hash });
      return Response.json({ error: 'company_payment_rpc_unavailable', details: 'synthetic-private' }, { status: 503 }); } });
  assert.equal(calls, 1); assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'company_payment_rpc_unavailable' });
});

test('six public route handlers expose only the expected read/mutation method and fixed BFF action', async () => {
  for (const action of ['prepare', 'submit', 'verify', 'abandon', 'status', 'history']) {
    const source = await readFile(new URL(`../app/api/member/company-payments/${action}/route.js`, import.meta.url), 'utf8');
    const verb = ['status', 'history'].includes(action) ? 'GET' : 'POST';
    assert.match(source, /export const runtime = ['"]nodejs['"]/);
    assert.match(source, /export const dynamic = ['"]force-dynamic['"]/);
    assert.match(source, new RegExp(`export const ${verb} = request => handleCompanyPayment\\(request, ['"]${action}['"]\\)`));
    assert.doesNotMatch(source, new RegExp(`export const ${verb === 'GET' ? 'POST' : 'GET'}\\s*=`));
  }
});

test('abandon has its own signed owner-scoped mutation and cannot succeed without a prepared abandonment acknowledgement', async () => {
  const abandoned = ack({ abandonedAt: '2026-11-11T10:01:00.000Z' });
  const response = await handleCompanyPayment(request('abandon', { body: { paymentId } }), 'abandon', { env,
    serviceRequest: async (url, init) => { assert.equal(url, 'https://auth.core.internal/api/member/company-payments/abandon');
      assert.deepEqual(JSON.parse(init.body), { paymentId });
      const sha = value => createHash('sha256').update(value).digest('hex');
      assert.equal(init.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
        .update(['POST', '/api/member/company-payments/abandon', init.headers['x-vp-auth-timestamp'], '198.51.100.10', sha(init.headers.cookie), sha(init.body)].join('\n')).digest('hex'));
      return { ok: true, data: abandoned }; } });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), abandoned);
  assert.equal((await handleCompanyPayment(request('abandon', { body: { paymentId, transactionHash: hash } }), 'abandon', { env, serviceRequest: forbiddenTransport })).status, 400);
  for (const data of [ack(), ack({ status: 'submitted', transactionHash: hash, abandonedAt: abandoned.abandonedAt })]) {
    assert.equal((await handleCompanyPayment(request('abandon', { body: { paymentId } }), 'abandon', { env,
      serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
});
