import assert from 'node:assert/strict';
import test from 'node:test';
import { startAdministrativeMeldOnramp } from './administrative-onramp-client.mjs';

const input = { requestId: 'd8a4c010-cc33-44da-a297-8b3c6440f491', address: `0x${'b'.repeat(40)}`,
  amount: 100, countryCode: 'US', paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TRANSAK' };
const session = () => ({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld', status: 'session_created',
  checkoutReference: input.requestId, requestedAmount: 100, createdAt: '2026-11-10T15:00:00.000Z',
  checkoutUrl: 'https://sb.meldcrypto.com/widget?token=synthetic-signed-session&opaque=value' });

test('administrative funding opens the exact sandbox session URL without rebuilding token or payment parameters', async () => {
  const controller = new AbortController();
  const opened = [];
  let calls = 0;
  const result = await startAdministrativeMeldOnramp(input, {
    signal: controller.signal,
    createSession: async (body, options) => {
      calls++; assert.equal(options.signal, controller.signal);
      assert.deepEqual(body, { requestId: input.requestId, walletAddress: input.address, country: 'US', amount: 100,
        serviceProvider: 'TRANSAK', paymentMethodType: 'CREDIT_DEBIT_CARD' });
      return session();
    }, openCheckout: url => opened.push(url),
  });
  assert.equal(calls, 1); assert.equal(result.environment, 'sandbox');
  assert.deepEqual(opened, [session().checkoutUrl]);
});

test('leaving before the administrative session replies prevents a late checkout', async () => {
  const controller = new AbortController();
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const operation = startAdministrativeMeldOnramp(input, { signal: controller.signal, createSession: async () => pending,
    openCheckout: () => assert.fail('aborted checkout opened') });
  controller.abort(); resolve(session());
  await assert.rejects(operation, { name: 'AbortError' });
});

test('personal/live acknowledgements and untrusted URL origins cannot open administrative tests', async () => {
  for (const response of [{ ...session(), walletKind: 'personal' }, { ...session(), environment: 'production' },
    { ...session(), status: 'complete' }, { ...session(), checkoutUrl: 'https://meldcrypto.com/?wt=live' },
    { ...session(), checkoutUrl: 'https://evil.test/?wt=bad' }, { ...session(), checkoutUrl: 'https://sb.meldcrypto.com:8443/?wt=bad' },
    { ...session(), requestedAmount: 101 }]) {
    await assert.rejects(startAdministrativeMeldOnramp(input, { createSession: async () => response,
      openCheckout: () => assert.fail('untrusted checkout opened') }));
  }
});

test('a failed sandbox request never opens a payment page or claims a completed purchase', async () => {
  await assert.rejects(startAdministrativeMeldOnramp(input, {
    createSession: async () => { throw new Error('sandbox_route_unavailable'); },
    openCheckout: () => assert.fail('failed checkout opened'),
  }), { message: 'sandbox_route_unavailable' });
});
