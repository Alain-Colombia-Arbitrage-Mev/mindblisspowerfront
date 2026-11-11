import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReownProductionOnrampUrl, reownFundingCurrency, reownFundingSelection } from './reown-production-onramp.mjs';

const projectId = 'a'.repeat(32);
const input = { providerUrl: `https://meldcrypto.com/?publicKey=reown-public&externalCustomerId=${projectId}`,
  projectId, address: `0x${'1'.repeat(40)}`, checkoutReference: 'd8a4c010-cc33-44da-a297-8b3c6440f491', countryCode: 'MX', amount: 100,
  paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED', 'MERCURYO'] };
test('Reown production retains merchant attribution and records only an initiated session reference', () => {
  const url = new URL(buildReownProductionOnrampUrl(input));
  assert.equal(url.searchParams.get('externalCustomerId'), projectId);
  assert.equal(url.searchParams.get('externalSessionId'), input.checkoutReference);
  assert.equal(url.searchParams.get('walletAddress'), input.address);
  assert.equal(url.searchParams.get('destinationCurrencyCode'), 'USDT');
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
  for (const countryCode of ['US', 'MX', 'CO']) {
    assert.equal(reownFundingSelection({ countryCode, paymentMethodType: 'CREDIT_DEBIT_CARD' }).countryCode, countryCode);
    const url = new URL(buildReownProductionOnrampUrl({ ...input, countryCode }));
    assert.equal(url.searchParams.get('countryCodeLocked'), countryCode);
    assert.equal(url.searchParams.get('sourceCurrencyCodeLocked'), 'USD');
  }
  assert.equal(reownFundingSelection({ paymentMethodType: 'CREDIT_DEBIT_CARD' }, () => 'CO').countryCode, 'CO');
  for (const sourceCurrencyCode of ['COP', 'MXN']) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, countryCode: 'CO', sourceCurrencyCode, paymentMethodType: 'SPEI', amount: 1000 }), { message: 'wallet_funding_valuation_unavailable' });
  }
  for (const countryCode of ['PA', 'CA', 'ES']) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, countryCode }), { message: 'wallet_funding_invalid_country' });
  }
  for (const paymentMethodType of ['NETELLER', 'SKRILL']) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, paymentMethodType }), { message: 'wallet_funding_method_unavailable' });
  }
  for (const detected of ['PA', '']) {
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

test('SPEI handoff locks the actual MXN amount and method without a fabricated USD conversion', () => {
  const selection = { countryCode: 'MX', sourceCurrencyCode: 'MXN', paymentMethodType: 'SPEI' };
  assert.deepEqual(reownFundingSelection(selection), { countryCode: 'MX', sourceCurrencyCode: 'MXN' });
  assert.equal(reownFundingCurrency('MXN', selection), 'MXN');
  const url = new URL(buildReownProductionOnrampUrl({ ...input, ...selection, amount: 931, allowedProviders: ['SWAPPED'] }));
  assert.equal(url.searchParams.get('sourceCurrencyCode'), 'MXN');
  assert.equal(url.searchParams.get('sourceCurrencyCodeLocked'), 'MXN');
  assert.equal(url.searchParams.get('sourceAmount'), '931');
  assert.equal(url.searchParams.get('sourceAmountLocked'), '931');
  assert.equal(url.searchParams.get('paymentMethodType'), 'SPEI');
  assert.equal(url.searchParams.get('paymentMethodTypeLocked'), 'SPEI');
  assert.equal(url.searchParams.get('destinationCurrencyCode'), 'USDT');
  assert.equal(url.searchParams.has('minimumUsd'), false);
  for (const patch of [{ countryCode: 'US' }, { paymentMethodType: 'CREDIT_DEBIT_CARD' }, { sourceCurrencyCode: 'COP' }]) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, ...selection, ...patch }), { message: 'wallet_funding_valuation_unavailable' });
  }
  for (const amount of [0, -1, 148.66, 930.99, '931', 931.001, Infinity, 1000000000.01]) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, ...selection, amount }), { message: 'reown_context_invalid' });
  }
});
test('Reown production cannot point at sandbox, another origin or a foreign merchant', () => {
  for (const providerUrl of ['https://sb.meldcrypto.com/?publicKey=sandbox', 'https://evil.test/?publicKey=bad',
    'https://meldcrypto.com/?publicKey=bad&externalCustomerId=someone-else']) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...input, providerUrl }));
  }
  assert.throws(() => buildReownProductionOnrampUrl({ ...input, amount: 19.99 }));
  assert.throws(() => buildReownProductionOnrampUrl({ ...input, amount: 50.001 }));
  assert.throws(() => buildReownProductionOnrampUrl({ ...input, paymentMethodType: '' }));
  assert.throws(() => buildReownProductionOnrampUrl({ ...input, allowedProviders: ['BANXA'] }));
});
