import assert from 'node:assert/strict';
import test from 'node:test';
import { productionFundingCurrencies, productionFundingLimits, productionFundingValue, productionFundingProviderSupported,
  productionFundingSelectionKey } from './production-funding-selection.mjs';

const fiat = code => ({ code, name: `Synthetic ${code}`, decimalPlaces: 2 });
const method = (currencyCode, minimumAmount, maximumAmount, id = 'CREDIT_DEBIT_CARD') =>
  ({ method: id, currencyCode, minimumAmount, maximumAmount });
const routes = (...paymentMethods) => [{ serviceProvider: 'TRANSAK', paymentMethods }];
const owner = 'synthetic-wallet-owner', address = `0x${'aBcDeF12'.repeat(5)}`;
const input = { country: 'US', sourceCurrencyCode: 'USD', amount: 50, paymentMethodType: 'CREDIT_DEBIT_CARD' };

test('a local default does not hide a second verified bank currency', () => {
  const currencies = [fiat('EUR'), fiat('SEK'), fiat('EUR')];
  const discovery = { country: 'SE', currencies, defaultCurrencyCode: 'SEK' };
  const selected = productionFundingCurrencies(discovery);
  assert.deepEqual(selected, { currencies: [fiat('SEK'), fiat('EUR')], defaultCurrencyCode: 'SEK' });
  assert.deepEqual(discovery.currencies.map(item => item.code), ['EUR', 'SEK', 'EUR']);
});

test('an unavailable local default preserves actual offers and requires an explicit choice without inventing a default', () => {
  for (const [discovery, expected] of [
    [{ currencies: [fiat('USD'), fiat('EUR')], defaultCurrencyCode: 'COP' }, { currencies: [fiat('USD'), fiat('EUR')], defaultCurrencyCode: '' }],
    [{ currencies: [fiat('COP')], defaultCurrencyCode: 'COP' }, { currencies: [fiat('COP')], defaultCurrencyCode: 'COP' }],
    [{ currencies: [fiat('USD'), fiat('MXN')], defaultCurrencyCode: 'USD' }, { currencies: [fiat('USD'), fiat('MXN')], defaultCurrencyCode: 'USD' }],
    [{ currencies: [fiat('CLP')], defaultCurrencyCode: null }, { currencies: [fiat('CLP')], defaultCurrencyCode: '' }],
    [{ currencies: [fiat('MXN'), fiat('USD')], defaultCurrencyCode: null }, { currencies: [fiat('MXN'), fiat('USD')], defaultCurrencyCode: '' }],
    [{ currencies: [fiat('EUR')], defaultCurrencyCode: 'COP' }, { currencies: [fiat('EUR')], defaultCurrencyCode: '' }],
    [undefined, { currencies: [], defaultCurrencyCode: '' }],
  ]) assert.deepEqual(productionFundingCurrencies(discovery), expected);
});

test('MXN and COP retain their exact provider minimums without conversion or a disguised USD floor', () => {
  for (const [currency, minimum, below] of [['MXN', 200, '199.99'], ['COP', 42300, '42299.99']]) {
    const limits = productionFundingLimits(routes(method(currency, minimum, minimum * 10)), currency, 'CREDIT_DEBIT_CARD');
    assert.deepEqual(limits, { minimum, maximum: minimum * 10, ranges: [{ minimum, maximum: minimum * 10 }] });
    assert.equal(productionFundingValue(String(minimum), limits), minimum);
    assert.equal(productionFundingValue(below, limits), null);
    assert.equal(productionFundingValue('50', limits), null);
  }
});

test('USD limits intersect the real route with 50–25,000 and an impossible intersection stays unavailable', () => {
  assert.deepEqual(productionFundingLimits(routes(method('USD', 10, 50000)), 'USD', 'CREDIT_DEBIT_CARD'),
    { minimum: 50, maximum: 25000, ranges: [{ minimum: 50, maximum: 25000 }] });
  assert.deepEqual(productionFundingLimits(routes(method('USD', 75, 500)), 'USD', 'CREDIT_DEBIT_CARD'),
    { minimum: 75, maximum: 500, ranges: [{ minimum: 75, maximum: 500 }] });
  for (const range of [method('USD', 1, 49.99), method('USD', 25000.01, 50000), method('USD', 100, 90)]) {
    assert.equal(productionFundingLimits(routes(range), 'USD', 'CREDIT_DEBIT_CARD'), null);
  }
});

test('selected method and currency limits cannot be borrowed from another rail or source currency', () => {
  const discovered = routes(method('MXN', 200, 2000), method('USD', 50, 25000), method('MXN', 1000, 10000, 'SPEI'));
  assert.deepEqual(productionFundingLimits(discovered, 'MXN', 'SPEI'),
    { minimum: 1000, maximum: 10000, ranges: [{ minimum: 1000, maximum: 10000 }] });
  assert.equal(productionFundingLimits(discovered, 'COP', 'SPEI'), null);
  assert.equal(productionFundingLimits(discovered, 'USD', 'SPEI'), null);
  assert.equal(productionFundingLimits(discovered, 'MXN', 'APPLE_PAY'), null);
  assert.equal(productionFundingLimits([], 'USD', 'CREDIT_DEBIT_CARD'), null);
  assert.equal(productionFundingLimits(null, 'USD', 'CREDIT_DEBIT_CARD'), null);
});

test('multiple provider ranges preserve holes instead of admitting every amount between the overall endpoints', () => {
  const discovered = [{ serviceProvider: 'TRANSAK', paymentMethods: [method('MXN', 200, 500)] },
    { serviceProvider: 'BANXA', paymentMethods: [method('MXN', 1000, 2000)] }];
  const limits = productionFundingLimits(discovered, 'MXN', 'CREDIT_DEBIT_CARD');
  assert.equal(limits.minimum, 200); assert.equal(limits.maximum, 2000);
  assert.equal(limits.ranges.length, 2);
  for (const amount of ['200', '500', '1000', '2000']) assert.equal(productionFundingValue(amount, limits), Number(amount));
  for (const amount of ['199.99', '500.01', '750', '999.99', '2000.01']) assert.equal(productionFundingValue(amount, limits), null);
});

test('amount precision rounds route bounds inwards and cannot grant a third decimal or unavailable integer amount', () => {
  const decimal = productionFundingLimits(routes(method('MXN', 200.001, 500.009)), 'MXN', 'CREDIT_DEBIT_CARD', 4);
  assert.deepEqual(decimal, { minimum: 200.01, maximum: 500, ranges: [{ minimum: 200.01, maximum: 500 }] });
  assert.equal(productionFundingValue('200.01', decimal, 4), 200.01);
  assert.equal(productionFundingValue('200.001', decimal, 4), null);
  const whole = productionFundingLimits(routes(method('COP', 42300.01, 42302.99)), 'COP', 'CREDIT_DEBIT_CARD', 0);
  assert.deepEqual(whole, { minimum: 42301, maximum: 42302, ranges: [{ minimum: 42301, maximum: 42302 }] });
  assert.equal(productionFundingValue('42301', whole, 0), 42301);
  assert.equal(productionFundingValue('42301.50', whole, 0), null);
  assert.equal(productionFundingLimits(routes(method('COP', 42300.01, 42300.99)), 'COP', 'CREDIT_DEBIT_CARD', 0), null);
  for (const raw of ['', ' ', 'NaN', 'Infinity', '200,01', '-1', '<script>200</script>', 200, null]) {
    assert.equal(productionFundingValue(raw, decimal), null);
  }
  assert.equal(productionFundingValue('200.01', null), null);
});

test('quote identity binds the native owner, canonical address and exact financial selection while equivalent decimal formatting shares a key', () => {
  const key = productionFundingSelectionKey(owner, address, input);
  assert.ok(key);
  assert.deepEqual(JSON.parse(key), [owner, address.toLowerCase(), 'US', 'USD', 'CREDIT_DEBIT_CARD', 50, 'USDT_POLYGON']);
  const samePurchase = { ...input, country: 'MX', sourceCurrencyCode: 'EUR' };
  const polygonKey = productionFundingSelectionKey(owner, address, samePurchase, 'USDC_POLYGON');
  const arbitrumKey = productionFundingSelectionKey(owner, address, samePurchase, 'USDC_ARBITRUM');
  assert.notEqual(polygonKey, arbitrumKey);
  assert.equal(JSON.parse(polygonKey).at(-1), 'USDC_POLYGON');
  assert.equal(JSON.parse(arbitrumKey).at(-1), 'USDC_ARBITRUM');
  assert.equal(productionFundingSelectionKey(owner, address, input, 'USDC'), '');
  assert.equal(productionFundingSelectionKey(owner, address.toLowerCase(), { ...input, amount: Number('50.00') }), key);
  for (const [subject, wallet, patch] of [
    ['different-owner', address, {}], [owner, `0x${'2'.repeat(40)}`, {}],
    [owner, address, { country: 'MX' }], [owner, address, { sourceCurrencyCode: 'MXN' }],
    [owner, address, { paymentMethodType: 'APPLE_PAY' }], [owner, address, { amount: 100 }],
  ]) assert.notEqual(productionFundingSelectionKey(subject, wallet, { ...input, ...patch }), key);
});

test('invalid owner, address and injected input cannot create a usable quote identity', () => {
  for (const subject of [undefined, '', 'with spaces', 'line\nbreak', 'x'.repeat(256)]) {
    assert.equal(productionFundingSelectionKey(subject, address, input), '');
  }
  for (const wallet of [undefined, '', '0x1234', `0x${'0'.repeat(40)}`, `${address} `]) {
    assert.equal(productionFundingSelectionKey(owner, wallet, input), '');
  }
  for (const patch of [{ amount: '50.00' }, { amount: 49.99 }, { amount: 50.001 }, { destination: { address } },
    { ownerSubject: owner }, { environment: 'sandbox' }, { serviceProvider: 'TRANSAK' }, { chainId: 1 }]) {
    assert.equal(productionFundingSelectionKey(owner, address, { ...input, ...patch }), '');
  }
});

test('a quoted provider must still support the exact fiat, rail and amount in its own current range', () => {
  const current = [{ serviceProvider: 'TRANSAK', paymentMethods: [method('MXN', 200, 500, 'SPEI'), method('MXN', 1000, 2000, 'SPEI')] },
    { serviceProvider: 'ONRAMPMONEY', paymentMethods: [method('MXN', 200, 500000, 'SPEI')] }];
  const selection = { country: 'MX', sourceCurrencyCode: 'MXN', amount: 750, paymentMethodType: 'SPEI' };
  assert.equal(productionFundingProviderSupported(current, 'TRANSAK', selection), false);
  assert.equal(productionFundingProviderSupported(current, 'ONRAMPMONEY', selection), true);
  for (const patch of [{ sourceCurrencyCode: 'USD' }, { paymentMethodType: 'CREDIT_DEBIT_CARD' }, { amount: 500001 }]) {
    assert.equal(productionFundingProviderSupported(current, 'ONRAMPMONEY', { ...selection, ...patch }), false);
  }
  assert.equal(productionFundingProviderSupported(current, 'BANXA', { ...selection, amount: 200 }), false);
  assert.equal(productionFundingProviderSupported(current, 'TRANSAK', { ...selection, amount: 1000 }), true);
  assert.equal(productionFundingProviderSupported([], 'TRANSAK', selection), false);
});
