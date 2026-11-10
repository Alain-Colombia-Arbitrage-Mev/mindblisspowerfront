import assert from 'node:assert/strict';
import test from 'node:test';
import { startAdministrativeMeldOnramp } from './administrative-onramp-client.mjs';

const address = `0x${'b'.repeat(40)}`;
const input = { address, amount: 100, countryCode: 'CO', paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TOPPER' };
const checkoutReference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const intent = () => ({
  walletKind: 'administrative', checkoutReference,
  checkoutUrl: 'https://meldcrypto.com/?publicKey=synthetic-commercial-key',
  quote: { sourceAmount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TOPPER' },
});

test('administrative funding creates its own intent and opens the confirmed Meld checkout once', async () => {
  const controller = new AbortController();
  const opened = [];
  let calls = 0;
  const result = await startAdministrativeMeldOnramp(input, {
    signal: controller.signal,
    createIntent: async (body, options) => {
      calls++;
      assert.equal(options.signal, controller.signal);
      assert.deepEqual(body, {
        walletKind: 'administrative', walletAddress: address,
        country: 'CO', fiat: 'USD', crypto: 'USDT_POLYGON', amount: 100,
        paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TOPPER',
      });
      return intent();
    },
    openCheckout: url => opened.push(new URL(url)),
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { opened: true, provider: 'meld' });
  assert.equal(opened.length, 1);
  assert.equal(opened[0].origin, 'https://meldcrypto.com');
  assert.equal(opened[0].searchParams.get('walletAddress'), address);
  assert.equal(opened[0].searchParams.get('externalSessionId'), checkoutReference);
  assert.equal(opened[0].searchParams.get('destinationCurrencyCode'), 'USDT_POLYGON');
  assert.equal(opened[0].searchParams.get('sourceAmount'), '100');
  assert.equal(opened[0].searchParams.get('serviceProviders'), 'TOPPER');
});

test('leaving an administrative funding view before the intent replies cannot open a late checkout', async () => {
  const controller = new AbortController();
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const operation = startAdministrativeMeldOnramp(input, {
    signal: controller.signal,
    createIntent: async () => pending,
    openCheckout: () => assert.fail('aborted checkout opened'),
  });
  controller.abort();
  resolve(intent());
  await assert.rejects(operation, { name: 'AbortError' });
});

test('personal acknowledgements and untrusted or incomplete Meld URLs cannot open administrative funding', async () => {
  const invalid = [
    { ...intent(), walletKind: 'personal' },
    { ...intent(), walletKind: undefined },
    { ...intent(), checkoutUrl: 'https://evil.example.test/?publicKey=synthetic' },
    { ...intent(), checkoutUrl: 'http://meldcrypto.com/?publicKey=synthetic' },
    { ...intent(), checkoutUrl: 'https://user:secret@meldcrypto.com/?publicKey=synthetic' },
    { ...intent(), checkoutUrl: 'https://meldcrypto.com/' },
    { ...intent(), checkoutUrl: 'https://meldcrypto.com:8443/?publicKey=synthetic' },
    { ...intent(), checkoutUrl: 'https://meldcrypto.com/foreign-path?publicKey=synthetic' },
    { ...intent(), checkoutReference: undefined },
  ];
  for (const response of invalid) {
    await assert.rejects(startAdministrativeMeldOnramp(input, {
      createIntent: async () => response,
      openCheckout: () => assert.fail('untrusted checkout opened'),
    }));
  }
});

test('a rejected administrative intent never opens a payment page or reports completion', async () => {
  let calls = 0;
  await assert.rejects(startAdministrativeMeldOnramp(input, {
    createIntent: async () => { calls++; throw new Error('onramp_quote_unavailable'); },
    openCheckout: () => assert.fail('rejected checkout opened'),
  }), { message: 'onramp_quote_unavailable' });
  assert.equal(calls, 1);
});
