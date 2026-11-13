import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { ADMINISTRATIVE_MELD_CHECKOUT_PATH as path, meldCheckoutInput, meldCheckoutAcknowledgement, mintedMeldCheckoutUrl,
  meldCheckoutCapabilities, meldCheckoutStatus, meldCheckoutHistory, meldCheckoutReturn } from './administrative-meld-checkout-contract.mjs';
import { createAdministrativeMeldCheckout, startAdministrativeMeldCheckout, readAdministrativeMeldCheckoutCapabilities,
  readAdministrativeMeldCheckoutStatus, readAdministrativeMeldCheckoutHistory } from './administrative-meld-checkout-client.mjs';
import { handleAdministrativeMeldCheckout } from './administrative-meld-checkout-bff.mjs';
import { translateMessage } from '../i18n/translate.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491', address = `0x${'1'.repeat(40)}`;
const input = { requestId: reference, country: 'MX', sourceCurrencyCode: 'MXN', amount: 500 };
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const capability = { flow: 'meld_checkout', configured: false, environment: 'sandbox', asset: 'USDT', network: 'polygon', chainId: 137 };
const ack = { flow: 'meld_checkout', status: 'checkout_minted', checkoutReference: reference, country: 'MX', requestedAmount: 500, sourceCurrencyCode: 'MXN',
  destination, checkoutUrl: 'https://sb.meldcrypto.com/?wt=synthetic_test-link', createdAt: '2026-11-12T12:00:00Z' };
const proof = { state: 'confirmed', source: 'meld_sandbox_api', testMode: true, transactionId: 'synthetic-transaction', providerStatus: 'SETTLED',
  receivedAmount: '24.123456', confirmedAt: '2026-11-12T12:10:00Z', serviceProvider: 'BANXA', paymentMethodType: 'CREDIT_DEBIT_CARD' };
const status = { checkoutReference: reference, walletKind: 'administrative', environment: 'sandbox', provider: 'meld', checkoutType: 'meld_checkout', requestStatus: 'minted',
  country: 'MX', requestedAmount: 500, sourceCurrencyCode: 'MXN', destination, createdAt: ack.createdAt, confirmation: { state: 'unconfirmed', source: 'none', testMode: true } };
const history = { walletKind: 'administrative', environment: 'sandbox', provider: 'meld', checkoutType: 'meld_checkout', settlement: 'unconfirmed', records: [status] };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://wallet.mindblisspower.com', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
function request(action = '', body = undefined, origin = env.AUTH_PUBLIC_ORIGIN) {
  return new Request(`${origin}${path}${action}`, { method: body ? 'POST' : 'GET', headers: { cookie: 'better-auth.session_token=synthetic', origin,
    'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '198.51.100.10', ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}

test('general sandbox input has exactly four fields, strict fiat bounds and no browser-selected recipient or provider', () => {
  assert.deepEqual(meldCheckoutInput(input), input);
  for (const amount of [1, 50, 10_000_000]) assert.ok(meldCheckoutInput({ ...input, amount }));
  for (const amount of [0, 0.99, 10_000_000.01, 500.001, '500', Infinity]) assert.equal(meldCheckoutInput({ ...input, amount }), null);
  for (const country of ['US', 'MX', 'CO']) for (const amount of [50, 25_000]) assert.ok(meldCheckoutInput({ ...input, country, sourceCurrencyCode: 'USD', amount }));
  for (const change of [{ amount: 49.99, sourceCurrencyCode: 'USD' }, { amount: 25_000.01, sourceCurrencyCode: 'USD' }, { country: 'CO' }, { country: '' },
    { country: 'ES' }, { sourceCurrencyCode: 'COP' }, { walletAddress: address }, { destination }, { serviceProvider: 'BANXA' }, { paymentMethodType: 'CARD' }]) assert.equal(meldCheckoutInput({ ...input, ...change }), null);
});

test('only a literal opaque sandbox minted URL can be opened, and an old provider session ACK is not a minted link', () => {
  assert.equal(mintedMeldCheckoutUrl(ack.checkoutUrl), ack.checkoutUrl); assert.ok(meldCheckoutAcknowledgement(ack));
  for (const url of ['https://sb.meldcrypto.com?wt=x', 'https://meldcrypto.com/?wt=x', 'https://sb.meldcrypto.com:443/?wt=x', 'https://user@sb.meldcrypto.com/?wt=x',
    'https://sb.meldcrypto.com/?wt=x&wt=y', 'https://sb.meldcrypto.com/?wt=x&walletAddress=evil', 'https://sb.meldcrypto.com/?wt=x#success',
    'https://sb.meldcrypto.com/?wt=%78', 'https://sb.meldcrypto.com/?token=x', 'https://global-stg.transak.com/?apiKey=x&sessionId=y', `https://sb.meldcrypto.com/?wt=${'x'.repeat(4097)}`]) {
    assert.equal(mintedMeldCheckoutUrl(url), null); assert.equal(meldCheckoutAcknowledgement({ ...ack, checkoutUrl: url }), null);
  }
  for (const change of [{ status: 'session_created' }, { flow: 'reown' }, { destination: { ...destination, chainId: 1 } }, { destination: { ...destination, address: '' } }]) assert.equal(meldCheckoutAcknowledgement({ ...ack, ...change }), null);
});

test('cached and API-verified test results are separated from real settlement and legacy personal records', () => {
  assert.equal(meldCheckoutStatus(status).confirmation.state, 'unconfirmed'); assert.ok(meldCheckoutHistory(history));
  assert.equal(meldCheckoutStatus({ ...status, confirmation: proof }).confirmation.receivedAmount, '24.123456');
  for (const confirmation of [{ ...proof, source: 'none' }, { ...proof, testMode: false }, { ...proof, providerStatus: 'PENDING' }, { ...proof, receivedAmount: '0' },
    { ...proof, receivedAmount: '1.0000001' }, { ...proof, serviceProvider: 'BINANCECONNECT' }, { ...proof, paymentMethodType: '' }, { ...proof, transactionId: undefined }]) assert.equal(meldCheckoutStatus({ ...status, confirmation }), null);
  for (const change of [{ provider: 'reown' }, { walletKind: 'personal' }, { environment: 'production' }, { checkoutType: 'provider_session' }, { destination: { ...destination, network: 'ethereum', chainId: 1 } }]) {
    assert.equal(meldCheckoutStatus({ ...status, ...change }), null);
    assert.equal(meldCheckoutHistory({ ...history, records: [{ ...status, ...change }] }), null);
  }
  assert.equal(meldCheckoutHistory({ ...history, settlement: 'confirmed' }), null);
  assert.equal(meldCheckoutHistory({ ...history, records: [status, status] }), null);
});

test('capability and callback carry no payment authority or legacy reference namespace', () => {
  assert.deepEqual(meldCheckoutCapabilities({ ...capability, publicKey: 'not-projected' }), capability);
  assert.equal(meldCheckoutCapabilities({ ...capability, chainId: 1 }), null);
  assert.equal(meldCheckoutReturn(`?meldCheckoutReference=${reference}&success=true&amount=9999`), reference);
  for (const query of [`?checkoutReference=${reference}`, `?meldCheckoutReference=${reference}&checkoutReference=${reference}`,
    `?meldCheckoutReference=${reference}&meldCheckoutReference=${reference}`, '?meldCheckoutReference=invalid']) assert.equal(meldCheckoutReturn(query), null);
});

test('browser uses independent manual endpoints, never sends an address or legacy v2 header, and does not retry failures', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => { calls.push({ url, init }); return Response.json(url.endsWith('/capabilities') ? capability : url.includes('/status?') ? status : url.endsWith('/history') ? history : ack); });
  assert.equal((await readAdministrativeMeldCheckoutCapabilities()).configured, false);
  assert.equal((await createAdministrativeMeldCheckout(input)).requestedAmount, 500);
  await readAdministrativeMeldCheckoutStatus(reference, { expectedAddress: address }); await readAdministrativeMeldCheckoutHistory({ expectedAddress: address });
  assert.deepEqual(calls.map(call => call.url), [`${path}/capabilities`, path, `${path}/status?checkoutReference=${reference}`, `${path}/history`]);
  assert.deepEqual(JSON.parse(calls[1].init.body), input);
  assert.ok(calls.every(call => call.init.credentials === 'same-origin' && call.init.cache === 'no-store' && call.init.redirect === 'error' && !new Headers(call.init.headers).has('x-mindbliss-sandbox-contract')));
  t.mock.method(globalThis, 'fetch', async () => { calls.push({}); return Response.json({ error: 'wallet_funding_unconfigured' }, { status: 503 }); });
  await assert.rejects(createAdministrativeMeldCheckout(input), /wallet_funding_unconfigured/); assert.equal(calls.length, 5);
});

test('browser handoff checks exact intent and assigned address before opening, and cancellation blocks work', async t => {
  let opened = 0, creates = 0;
  for (const change of [{ requestedAmount: 501 }, { country: 'US' }, { sourceCurrencyCode: 'USD' }, { checkoutReference: '11111111-1111-4111-8111-111111111111' },
    { destination: { ...destination, address: `0x${'2'.repeat(40)}` } }, { checkoutUrl: 'https://evil.example/?wt=x' }]) {
    await assert.rejects(startAdministrativeMeldCheckout(input, { expectedAddress: address, createCheckout: async () => ({ ...ack, ...change }), openCheckout: () => opened++ }));
  }
  assert.equal(opened, 0);
  await startAdministrativeMeldCheckout(input, { expectedAddress: address, createCheckout: async body => { assert.deepEqual(body, input); return ack; }, openCheckout: url => { assert.equal(url, ack.checkoutUrl); opened++; } });
  assert.equal(opened, 1);
  const controller = new AbortController(); controller.abort();
  t.mock.method(globalThis, 'fetch', async () => { creates++; throw Error('must not reach transport'); });
  await assert.rejects(createAdministrativeMeldCheckout(input, { signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(startAdministrativeMeldCheckout(input, { expectedAddress: address, signal: controller.signal, createCheckout: async () => { creates++; return ack; } }), { name: 'AbortError' });
  await assert.rejects(readAdministrativeMeldCheckoutHistory({ expectedAddress: 'bad' }), /invalid_request/);
  assert.equal(creates, 0);
  await assert.rejects(startAdministrativeMeldCheckout(input, { expectedAddress: address, signal: new AbortController().signal,
    createCheckout: async (_body, { signal }) => { Object.defineProperty(signal, 'aborted', { value: true }); return ack; }, openCheckout: () => opened++ }), { name: 'AbortError' });
  assert.equal(opened, 1);
});

test('BFF is wallet-only, signs exactly the strict body and projects no keys, provider URLs or caller-selected destination fields', async () => {
  let calls = 0;
  const serviceRequest = async (url, init) => {
    calls++; assert.equal(url, `${env.BETTER_AUTH_BACKEND_URL}${path}`); assert.deepEqual(JSON.parse(init.body), input);
    const h = new Headers(init.headers), hash = value => createHash('sha256').update(value).digest('hex');
    const expected = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', path, h.get('x-vp-auth-timestamp'), h.get('x-vp-auth-client-ip'), hash(h.get('cookie')), hash(init.body)].join('\n')).digest('hex');
    assert.equal(h.get('x-vp-auth-signature'), expected); assert.equal(h.get('origin'), env.AUTH_PUBLIC_ORIGIN);
    assert.equal(h.get('x-mindbliss-sandbox-contract'), null);
    return { ok: true, data: { ...ack, publicKey: 'not-projected', internalCustomerId: 'not-projected' } };
  };
  const response = await handleAdministrativeMeldCheckout(request('', input), 'create', { env, serviceRequest });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), ack); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(calls, 1);
  for (const body of [{ ...input, address }, { ...input, serviceProvider: 'BANXA' }, { ...input, sourceCurrencyCode: 'COP' }]) assert.equal((await handleAdministrativeMeldCheckout(request('', body), 'create', { env, serviceRequest })).status, 400);
  assert.equal((await handleAdministrativeMeldCheckout(request('', input, 'https://app.mindblisspower.com'), 'create', { env, serviceRequest })).status, 421);
  assert.equal((await handleAdministrativeMeldCheckout(new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, { method: 'POST', headers: { origin: env.AUTH_PUBLIC_ORIGIN }, body: JSON.stringify(input) }), 'create', { env, serviceRequest })).status, 401);
  assert.equal(calls, 1);
});

test('BFF capability false is safe and disabled writes or reads propagate once without retry or fabricated success', async () => {
  let calls = 0;
  const pending = await handleAdministrativeMeldCheckout(request('/capabilities'), 'capabilities', { env, serviceRequest: async () => { calls++; return { ok: true, data: capability }; } });
  assert.equal(pending.status, 200); assert.deepEqual(await pending.json(), capability);
  for (const [action, suffix, body] of [['create', '', input], ['status', `/status?checkoutReference=${reference}`], ['history', '/history']]) {
    const response = await handleAdministrativeMeldCheckout(request(suffix, body), action, { env, serviceRequest: async () => { calls++; return { ok: false, status: 503, data: { error: 'wallet_funding_unconfigured', secret: 'not-projected' } }; } });
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'wallet_funding_unconfigured' });
  }
  assert.equal(calls, 4);
  for (const suffix of [`/status?checkoutReference=${reference}&checkoutReference=${reference}`, `/status?checkoutReference=${reference}&success=true`]) assert.equal((await handleAdministrativeMeldCheckout(request(suffix), 'status', { env, serviceRequest: () => { throw Error('must not call'); } })).status, 400);
});

test('every new BFF action pins the wallet Origin upstream and rejects impersonation before any request', async () => {
  let calls = 0;
  const cases = [['create', '', input, ack], ['capabilities', '/capabilities', undefined, capability],
    ['status', `/status?checkoutReference=${reference}`, undefined, status], ['history', '/history', undefined, history]];
  for (const [action, suffix, body, data] of cases) {
    const response = await handleAdministrativeMeldCheckout(request(suffix, body), action, { env, serviceRequest: async (_url, init) => {
      calls++; assert.equal(new Headers(init.headers).get('origin'), env.AUTH_PUBLIC_ORIGIN); return { ok: true, data };
    } });
    assert.equal(response.status, 200);
    const spoofed = request(suffix, body); spoofed.headers.set('x-vp-act-as', 'other-owner');
    assert.equal((await handleAdministrativeMeldCheckout(spoofed, action, { env, serviceRequest: async () => { calls++; throw Error('must not call'); } })).status, 403);
  }
  assert.equal(calls, 4);
});

test('BFF refuses mismatched intent, swapped reference and unverified proof from an upstream response', async () => {
  for (const data of [{ ...ack, requestedAmount: 501 }, { ...ack, checkoutUrl: 'https://sb.meldcrypto.com/?wt=x&address=evil' }]) {
    assert.equal((await handleAdministrativeMeldCheckout(request('', input), 'create', { env, serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
  for (const data of [{ ...status, checkoutReference: '11111111-1111-4111-8111-111111111111' }, { ...status, confirmation: { ...proof, testMode: false } }]) {
    assert.equal((await handleAdministrativeMeldCheckout(request(`/status?checkoutReference=${reference}`), 'status', { env, serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
});

test('general checkout notices and explicit sandbox copy exist in all supported locales', () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) for (const key of ['meldCheckoutAction', 'meldCheckoutConfiguration', 'meldCheckoutCapabilityError', 'meldCheckoutHelp', 'meldCheckoutHistory', 'meldCheckoutPrepared', 'meldCheckoutPreparedCopy']) assert.notEqual(translateMessage(locale, `funding.${key}`), `funding.${key}`);
});
