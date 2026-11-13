import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { ADMINISTRATIVE_OFFRAMP_PATH as path, administrativeOfframpUnits, administrativeOfframpPrepareInput,
  administrativeOfframpAcknowledgement, administrativeOfframpSessionUrl, administrativeOfframpStatus, administrativeOfframpHistory } from './administrative-offramp-session-contract.mjs';
import { prepareAdministrativeOfframpSession, readAdministrativeOfframpSession, readAdministrativeOfframpSessionHistory } from './administrative-offramp-session-client.mjs';
import { handleAdministrativeOfframpSession } from './administrative-offramp-session-bff.mjs';

const reference = '11111111-1111-4111-8111-111111111111', otherReference = '22222222-2222-4222-8222-222222222222';
const address = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`, origin = 'https://wallet.mindblisspower.com';
const input = { requestId: reference, country: 'MX', destinationCurrencyCode: 'MXN', amount: '100', serviceProvider: 'TRANSAK', paymentMethodType: 'PAYOUT_TO_CARD' };
const common = { flow: 'administrative_offramp', walletKind: 'administrative', environment: 'sandbox', reference,
  source: { address, asset: 'USDT', network: 'polygon', chainId: 137 }, sourceAmount: '100', country: 'MX', destinationCurrencyCode: 'MXN',
  serviceProvider: 'TRANSAK', paymentMethodType: 'PAYOUT_TO_CARD', quotedDestinationAmount: 1900.25, createdAt: '2026-11-12T12:00:00.000Z',
  execution: { canBroadcast: false, canFund: false, mode: 'sandbox_no_funds' } };
const ack = { ...common, status: 'session_created', checkoutUrl: 'https://sb.meldcrypto.com/?token=synthetic.test-token' };
const status = { ...common, requestStatus: 'session_created', confirmation: { source: 'none', state: 'unconfirmed', testMode: true } };
const verified = { ...status, confirmation: { source: 'meld_sandbox_api', state: 'confirmed', testMode: true, transactionId: 'sandbox-test', providerStatus: 'SETTLED',
  destinationAmount: '1900.25', updatedAt: '2026-11-12T12:10:00.000Z' } };
const history = { flow: 'administrative_offramp', walletKind: 'administrative', environment: 'sandbox', records: [status, { ...verified, reference: otherReference }] };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin, AUTH_BFF_SHARED_SECRET: 's'.repeat(32), BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const request = (suffix, body = undefined) => new Request(`${origin}${path}${suffix}`, { method: body === undefined ? 'GET' : 'POST', headers: {
  cookie: 'better-auth.session_token=synthetic', origin, 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '198.51.100.10', ...(body === undefined ? {} : { 'content-type': 'application/json' }),
}, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

test('SELL prepare accepts exactly six quoted context fields and no sender, target URL, token, ownership or execution authority', () => {
  assert.deepEqual(administrativeOfframpPrepareInput(input), input); assert.equal(administrativeOfframpUnits('0.000001'), 1n);
  for (const extra of [{ sourceAddress: address }, { walletAddress: address }, { checkoutUrl: 'https://evil.example' }, { canFund: true }, { nativeSessionId: 'other' }, { tokenAddress: other }]) assert.equal(administrativeOfframpPrepareInput({ ...input, ...extra }), null);
  for (const amount of ['0', '1.0000001', '-1', '1e3', '1,5', 1, '1000000000.000001']) assert.equal(administrativeOfframpPrepareInput({ ...input, amount }), null);
  assert.equal(administrativeOfframpPrepareInput({ ...input, country: 'US', destinationCurrencyCode: 'MXN' }), null);
});

test('SELL provider handoff accepts only the sandbox MELD token URL, never direct provider, substituted recipient or encoded query fields', () => {
  assert.equal(administrativeOfframpSessionUrl(ack.checkoutUrl), ack.checkoutUrl);
  for (const url of ['https://meldcrypto.com/?token=x', 'https://sb.meldcrypto.com.evil.example/?token=x', 'https://sb.meldcrypto.com:443/?token=x',
    'https://user@sb.meldcrypto.com/?token=x', 'https://sb.meldcrypto.com/?token=x&token=y', 'https://sb.meldcrypto.com/?token=x&walletAddress=other',
    'https://sb.meldcrypto.com/?token=%78', 'https://sb.meldcrypto.com/?token=x#paid', 'https://sb.meldcrypto.com/?wt=x', 'https://global-stg.transak.com/?apiKey=x&sessionId=y',
    'https://sb.meldcrypto.com/path?token=x', 'javascript:alert(1)']) {
    assert.equal(administrativeOfframpSessionUrl(url), null); assert.equal(administrativeOfframpAcknowledgement({ ...ack, checkoutUrl: url }), null);
  }
});

test('SELL contracts keep sandbox source and no-fund authority fixed and never infer payment from request preparation or browser hints', () => {
  assert.ok(administrativeOfframpAcknowledgement(ack)); assert.ok(administrativeOfframpAcknowledgement({ ...ack, quotedDestinationAmount: null }));
  assert.equal(administrativeOfframpStatus({ ...status, success: true, paid: true }).confirmation.state, 'unconfirmed');
  assert.equal(administrativeOfframpStatus(verified).confirmation.destinationAmount, '1900.25'); assert.ok(administrativeOfframpHistory(history));
  for (const change of [{ walletKind: 'personal' }, { environment: 'production' }, { source: { ...common.source, network: 'ethereum', chainId: 1 } },
    { execution: { ...common.execution, canFund: true } }, { execution: { ...common.execution, canBroadcast: true } }, { execution: { ...common.execution, mode: 'production' } }]) {
    assert.equal(administrativeOfframpAcknowledgement({ ...ack, ...change }), null); assert.equal(administrativeOfframpStatus({ ...status, ...change }), null);
  }
  for (const confirmation of [{ ...verified.confirmation, source: 'none' }, { ...verified.confirmation, testMode: false }, { ...verified.confirmation, providerStatus: 'PENDING' },
    { ...verified.confirmation, destinationAmount: '0' }, { ...verified.confirmation, transactionId: '..' }]) assert.equal(administrativeOfframpStatus({ ...verified, confirmation }), null);
  assert.equal(administrativeOfframpHistory({ ...history, records: [status, status] }), null);
});

test('browser binds every SELL ACK field, source owner and decimal units before a caller can navigate to its returned checkout', async t => {
  for (const change of [{ reference: otherReference }, { source: { ...common.source, address: other } }, { country: 'US', destinationCurrencyCode: 'USD' },
    { sourceAmount: '101' }, { serviceProvider: 'BANXA' }, { paymentMethodType: 'BANK_TRANSFER' }, { checkoutUrl: 'https://evil.example' }]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ ...ack, ...change })); await assert.rejects(prepareAdministrativeOfframpSession(input, address));
  }
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...ack, sourceAmount: '100.000000' }));
  assert.equal((await prepareAdministrativeOfframpSession(input, address)).sourceAmount, '100.000000', 'atomic equality is exact without float conversion');
});

test('SELL browser reads and writes use only their fixed native routes, no retries, no recipient field and no provider transmission API', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => { calls.push({ url, init }); return Response.json(url.endsWith('/prepare') ? ack : url.endsWith('/history') ? history : status); });
  await prepareAdministrativeOfframpSession(input, address); await readAdministrativeOfframpSession(reference, address); await readAdministrativeOfframpSessionHistory(address);
  assert.deepEqual(calls.map(call => call.url), [`${path}/prepare`, `${path}/status?reference=${reference}`, `${path}/history`]);
  assert.deepEqual(JSON.parse(calls[0].init.body), input); assert.ok(calls.every(call => call.init.credentials === 'same-origin' && call.init.cache === 'no-store' && call.init.redirect === 'error'));
  t.mock.method(globalThis, 'fetch', async () => { calls.push({}); return Response.json({ error: 'administrative_offramp_unconfigured' }, { status: 503 }); });
  await assert.rejects(prepareAdministrativeOfframpSession(input, address), /administrative_offramp_unconfigured/); assert.equal(calls.length, 4);
  const controller = new AbortController(); controller.abort(); await assert.rejects(prepareAdministrativeOfframpSession(input, address, { signal: controller.signal }), { name: 'AbortError' }); assert.equal(calls.length, 4);
});

test('SELL status and history readers reject other owner addresses or swapped references', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...status, reference: otherReference })); await assert.rejects(readAdministrativeOfframpSession(reference, address));
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...status, source: { ...common.source, address: other } })); await assert.rejects(readAdministrativeOfframpSession(reference, address));
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...history, records: [{ ...status, source: { ...common.source, address: other } }] })); await assert.rejects(readAdministrativeOfframpSessionHistory(address));
});

test('SELL BFF pins exact wallet Origin and signs native POST body; GETs stay private and never forward browser-injected ownership metadata', async () => {
  let calls = 0;
  for (const [action, suffix, body, data] of [['prepare', '/prepare', input, ack], ['status', `/status?reference=${reference}`, undefined, status], ['history', '/history', undefined, history]]) {
    const response = await handleAdministrativeOfframpSession(request(suffix, body), action, { env, serviceRequest: async (url, init) => {
      calls++; assert.equal(url, `${env.BETTER_AUTH_BACKEND_URL}${path}${suffix}`); const h = new Headers(init.headers); assert.equal(h.get('origin'), origin); assert.equal(h.get('cookie'), 'better-auth.session_token=synthetic');
      if (body) { const hash = value => createHash('sha256').update(value).digest('hex');
        assert.equal(h.get('x-vp-auth-signature'), createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', `${path}/prepare`, h.get('x-vp-auth-timestamp'), h.get('x-vp-auth-client-ip'), hash(h.get('cookie')), hash(init.body)].join('\n')).digest('hex')); }
      return { ok: true, data: { ...data, apiKey: 'not-projected' } };
    } });
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.ok(!JSON.stringify(await response.json()).includes('not-projected'));
    const spoofed = request(suffix, body); spoofed.headers.set('x-vp-act-as', 'other'); assert.equal((await handleAdministrativeOfframpSession(spoofed, action, { env })).status, 403);
  }
  assert.equal(calls, 3);
});

test('SELL BFF rejects app origin, missing cookies, malformed status references and any extra prepare key before Core', async () => {
  const never = async () => assert.fail('must not request Core');
  for (const body of [{ ...input, walletAddress: other }, { ...input, callbackUrl: 'https://evil.example' }]) assert.equal((await handleAdministrativeOfframpSession(request('/prepare', body), 'prepare', { env, serviceRequest: never })).status, 400);
  for (const query of [`reference=${reference}&reference=${reference}`, `reference=${reference}&walletAddress=${other}`, 'reference=bad']) assert.equal((await handleAdministrativeOfframpSession(request(`/status?${query}`), 'status', { env, serviceRequest: never })).status, 400);
  const anonymous = new Request(`${origin}${path}/history`); assert.equal((await handleAdministrativeOfframpSession(anonymous, 'history', { env, serviceRequest: never })).status, 401);
  const app = new Request(`https://app.mindblisspower.com${path}/history`, { headers: { cookie: 'better-auth.session_token=x' } }); assert.equal((await handleAdministrativeOfframpSession(app, 'history', { env, serviceRequest: never })).status, 404);
});

test('SELL BFF refuses changed ACK context and financial execution flags instead of passing a provider URL through', async () => {
  for (const change of [{ sourceAmount: '101' }, { serviceProvider: 'BANXA' }, { paymentMethodType: 'LOCAL_BANK_TRANSFER' }, { reference: otherReference }, { checkoutUrl: 'https://sb.meldcrypto.com/?token=x&recipient=other' },
    { execution: { ...common.execution, canFund: true } }]) {
    const response = await handleAdministrativeOfframpSession(request('/prepare', input), 'prepare', { env, serviceRequest: async () => ({ ok: true, data: { ...ack, ...change } }) }); assert.equal(response.status, 502);
  }
});

test('raw status references cannot smuggle a query separator through helper interpolation', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(status); });
  await assert.rejects(readAdministrativeOfframpSession(`${reference}&extra=x`, address), /invalid_request/);
  assert.equal(calls, 0);
  const response = await handleAdministrativeOfframpSession(request(`/status?reference=${reference}%26extra%3Dx`), 'status', { env,
    serviceRequest: async () => { calls++; return { ok: true, data: status }; } });
  assert.equal(response.status, 400); assert.equal(calls, 0);
});
