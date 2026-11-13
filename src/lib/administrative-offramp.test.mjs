import assert from 'node:assert/strict';
import test from 'node:test';
import { administrativeOfframpOptions, administrativeOfframpSelection } from './administrative-offramp-contract.mjs';
import { handleAdministrativeOfframpOptions } from './administrative-offramp-bff.mjs';
import { readAdministrativeOfframpOptions } from './administrative-offramp-client.mjs';
import { translateMessage } from '../i18n/translate.mjs';

const origin = 'https://wallet.mindblisspower.com', path = '/api/member/wallet-funding/administrative/offramp/options';
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: origin,
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const selection = { country: 'MX', destinationCurrencyCode: 'MXN' };
const value = () => ({ flow: 'offramp', walletKind: 'administrative', environment: 'sandbox', asset: 'USDT', network: 'polygon', chainId: 137,
  ...selection, routes: [{ serviceProvider: 'TRANSAK', paymentMethods: [{ method: 'PAYOUT_TO_CARD', currencyCode: 'MXN', minimumAmount: 187, maximumAmount: 466480 }] }],
  execution: { canCreateSession: false, canTransfer: false, reason: 'discovery_only' } });
const request = (query = 'country=MX&destinationCurrencyCode=MXN', headers = { cookie: 'better-auth.session_token=synthetic' }, method = 'GET') =>
  new Request(`${origin}${path}?${query}`, { headers, method });

test('offramp contract preserves payout limit units, available providers and explicit disabled execution', () => {
  const raw = { ...value(), secret: 'must_not_leak' };
  assert.equal(administrativeOfframpOptions(raw, selection).routes[0].paymentMethods[0].currencyCode, 'MXN');
  assert.equal('secret' in administrativeOfframpOptions(raw, selection), false);
  assert.deepEqual(administrativeOfframpOptions({ ...value(), routes: [] }, selection).routes, []);
  assert.equal(administrativeOfframpSelection('CO', 'MXN'), null);
  assert.equal(administrativeOfframpSelection('US', 'USD').country, 'US');
});

test('wrong wallet, network, environment, corridor and newly granted spending authority are rejected', () => {
  for (const change of [{ walletKind: 'personal' }, { network: 'ethereum' }, { chainId: 1 }, { environment: 'production' },
    { country: 'CO' }, { destinationCurrencyCode: 'USD' }, { execution: { canCreateSession: true, canTransfer: true } }]) {
    assert.equal(administrativeOfframpOptions({ ...value(), ...change }, selection), null);
  }
  const raw = value(); raw.routes[0].paymentMethods[0].currencyCode = 'USD';
  assert.equal(administrativeOfframpOptions(raw, selection), null);
});

test('anonymous requests, personal portal, POST, act-as and duplicate/forged parameters never reach Core', async () => {
  const never = async () => assert.fail('unauthorized upstream work');
  assert.equal((await handleAdministrativeOfframpOptions(request('', {}), { env, serviceRequest: never })).status, 401);
  assert.equal((await handleAdministrativeOfframpOptions(new Request(`https://app.mindblisspower.com${path}`), { env, serviceRequest: never })).status, 404);
  assert.equal((await handleAdministrativeOfframpOptions(request(undefined, undefined, 'POST'), { env, serviceRequest: never })).status, 405);
  assert.equal((await handleAdministrativeOfframpOptions(request(undefined, { cookie: 'better-auth.session_token=x', 'x-vp-act-as': 'other' }), { env, serviceRequest: never })).status, 403);
  for (const query of ['country=MX&country=US&destinationCurrencyCode=MXN', 'country=MX&destinationCurrencyCode=MXN&walletAddress=forged', 'country=CO&destinationCurrencyCode=MXN']) {
    assert.equal((await handleAdministrativeOfframpOptions(request(query), { env, serviceRequest: never })).status, 400);
  }
});

test('BFF makes one fixed authenticated GET and returns only the validated catalog', async () => {
  let calls = 0;
  const response = await handleAdministrativeOfframpOptions(request(), { env, serviceRequest: async (url, init) => {
    calls++;
    assert.equal(url, `https://auth.core.internal${path}?country=MX&destinationCurrencyCode=MXN`);
    assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    assert.equal(init.headers.origin, origin);
    assert.equal(init.headers.cookie, 'better-auth.session_token=synthetic');
    return { ok: true, status: 200, data: { ...value(), apiKey: 'must_not_leak' } };
  } });
  assert.equal(response.status, 200); assert.equal(calls, 1);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(JSON.stringify(await response.json()).includes('must_not_leak'), false);
});

test('provider failure remains an error and is never presented as an empty successful catalog', async () => {
  let calls = 0;
  const response = await handleAdministrativeOfframpOptions(request(), { env, serviceRequest: async () => { calls++; return { ok: false, status: 401, data: { error: 'secret_vendor_message' } }; } });
  assert.equal(response.status, 401); assert.equal(calls, 1);
  assert.deepEqual(await response.json(), { error: 'offramp_provider_unavailable' });
});

test('browser catalog lookup is exactly one read, with no retries, sessions or transfers', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls++; assert.equal(url, `${path}?country=MX&destinationCurrencyCode=MXN`); assert.equal(init.method, 'GET');
    assert.equal(init.body, undefined); assert.equal(init.credentials, 'same-origin'); return Response.json(value());
  });
  const result = await readAdministrativeOfframpOptions('MX', 'MXN');
  assert.equal(result.execution.canTransfer, false); assert.equal(calls, 1);
  await assert.rejects(readAdministrativeOfframpOptions('CO', 'MXN')); assert.equal(calls, 1);
});

test('offramp explanation and controls are translated in every supported language', () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) for (const field of ['title', 'copy', 'country', 'currency', 'check', 'empty', 'error', 'signerPending', 'sandbox']) {
    const key = `administrativeOfframp.${field}`;
    assert.notEqual(translateMessage(locale, key), key);
  }
});
