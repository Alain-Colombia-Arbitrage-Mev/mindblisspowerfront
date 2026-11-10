import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReownProductionOnrampUrl, reownFundingCurrency, reownFundingSelection } from './reown-production-onramp.mjs';

const projectId = 'a'.repeat(32);
const input = { providerUrl: `https://meldcrypto.com/?publicKey=reown-public&externalCustomerId=${projectId}`,
  projectId, address: `0x${'1'.repeat(40)}`, checkoutReference: 'd8a4c010-cc33-44da-a297-8b3c6440f491', countryCode: 'MX', amount: 100,
  paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['TOPPER', 'SWAPPED'] };
test('Reown production retains merchant attribution and records only an initiated session reference', () => {
  const url = new URL(buildReownProductionOnrampUrl(input));
  assert.equal(url.searchParams.get('externalCustomerId'), projectId);
  assert.equal(url.searchParams.get('externalSessionId'), input.checkoutReference);
  assert.equal(url.searchParams.get('walletAddress'), input.address);
  assert.equal(url.searchParams.get('destinationCurrencyCode'), 'USDT_POLYGON');
  assert.equal(url.searchParams.get('sourceAmount'), '100');
  assert.equal(url.searchParams.get('sourceCurrencyCode'), 'USD');
  assert.equal(url.searchParams.get('sourceCurrencyCodeLocked'), 'USD');
  assert.equal(url.searchParams.has('serviceProviders'), false);
  assert.equal(url.searchParams.has('serviceProvider'), false);
  assert.equal(url.searchParams.get('paymentMethodType'), input.paymentMethodType);
  assert.equal(url.searchParams.get('paymentMethodTypeLocked'), input.paymentMethodType);
  assert.equal(url.searchParams.get('sourceAmountLocked'), '100');
  assert.equal(url.searchParams.get('countryCodeLocked'), 'MX');
  assert.equal(url.searchParams.get('walletAddressLocked'), input.address);
  const stale = new URL(buildReownProductionOnrampUrl({ ...input,
    providerUrl: `${input.providerUrl}&serviceProvider=TOPPER&serviceProviders=TOPPER,SWAPPED` }));
  assert.equal(stale.searchParams.has('serviceProvider'), false);
  assert.equal(stale.searchParams.has('serviceProviders'), false);
});

test('personal checkout enforces its countries and excluded methods before constructing provider URLs', () => {
  for (const countryCode of ['US', 'MX']) {
    assert.equal(reownFundingSelection({ countryCode, paymentMethodType: 'CREDIT_DEBIT_CARD' }).countryCode, countryCode);
  }
  for (const countryCode of ['CO', 'PA', 'CA', 'ES']) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, countryCode }), { message: 'wallet_funding_invalid_country' });
  }
  for (const paymentMethodType of ['NETELLER', 'SKRILL']) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, paymentMethodType }), { message: 'wallet_funding_method_unavailable' });
  }
  for (const detected of ['CO', 'PA', '']) {
    assert.throws(() => reownFundingSelection({ paymentMethodType: 'CREDIT_DEBIT_CARD' }, () => detected), { message: 'wallet_funding_invalid_country' });
  }
  assert.throws(() => reownFundingSelection({ country: 'US', countryCode: 'MX', paymentMethodType: 'CREDIT_DEBIT_CARD' }), { message: 'invalid_request' });
});

test('production checkout cannot discard an explicit local currency and open it as dollars', () => {
  for (const sourceCurrencyCode of ['MXN', 'COP']) {
    assert.throws(() => reownFundingCurrency(sourceCurrencyCode), { message: 'wallet_funding_valuation_unavailable' });
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, sourceCurrencyCode }), { message: 'wallet_funding_valuation_unavailable' });
  }
  assert.equal(reownFundingCurrency(), 'USD');
  assert.equal(reownFundingCurrency('USD'), 'USD');
  for (const sourceCurrencyCode of ['', 'usd', null, ['USD']]) {
    assert.throws(() => reownFundingCurrency(sourceCurrencyCode), { message: 'invalid_request' });
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, sourceCurrencyCode }), { message: 'invalid_request' });
  }
});
test('Reown production cannot point at sandbox, another origin or a foreign merchant', () => {
  for (const providerUrl of ['https://sb.meldcrypto.com/?publicKey=sandbox', 'https://evil.test/?publicKey=bad',
    'https://meldcrypto.com/?publicKey=bad&externalCustomerId=someone-else']) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, providerUrl }));
  }
  assert.throws(() => buildReownProductionOnrampUrl({ ...input, amount: 49 }));
  assert.throws(() => buildReownProductionOnrampUrl({ ...input, amount: 50.001 }));
  assert.throws(() => buildReownProductionOnrampUrl({ ...input, paymentMethodType: '' }));
  assert.throws(() => buildReownProductionOnrampUrl({ ...input, allowedProviders: ['BANXA'] }));
});
