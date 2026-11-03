import assert from 'node:assert/strict';
import test from 'node:test';
import { membershipPriceQuote } from './membership-price-quote.mjs';

test('catalog quote includes the one percent cost while keeping the exact catalog charge', () => {
  for (const [base, fee, commissionBase, total] of [
    ['100.00', '$1.00 USD', '$99.00 USD', '$100.00 USD'],
    ['250.00', '$2.50 USD', '$247.50 USD', '$250.00 USD'],
    ['100000.00', '$1,000.00 USD', '$99,000.00 USD', '$100,000.00 USD'],
  ]) {
    const quote = membershipPriceQuote(base);
    assert.equal(quote.feeUSD, fee);
    assert.equal(quote.commissionBaseUSD, commissionBase);
    assert.equal(quote.totalUSD, total);
  }
  assert.equal(membershipPriceQuote('100.00').baseUSD, '$100.00 USD');
  assert.equal(membershipPriceQuote('250.00').baseUSD, '$250.00 USD');
  assert.equal(membershipPriceQuote('100000.00').baseUSD, '$100,000.00 USD');
});

test('included cost and net preserve the exact one and ninety-nine percent even below one cent', () => {
  assert.deepEqual(membershipPriceQuote('0.49'), { baseUSD: '$0.49 USD', feeUSD: '$0.0049 USD', commissionBaseUSD: '$0.4851 USD', totalUSD: '$0.49 USD' });
  assert.deepEqual(membershipPriceQuote('0.50'), { baseUSD: '$0.50 USD', feeUSD: '$0.005 USD', commissionBaseUSD: '$0.495 USD', totalUSD: '$0.50 USD' });
  assert.deepEqual(membershipPriceQuote('1.49'), { baseUSD: '$1.49 USD', feeUSD: '$0.0149 USD', commissionBaseUSD: '$1.4751 USD', totalUSD: '$1.49 USD' });
  assert.deepEqual(membershipPriceQuote('1.50'), { baseUSD: '$1.50 USD', feeUSD: '$0.015 USD', commissionBaseUSD: '$1.485 USD', totalUSD: '$1.50 USD' });
  assert.deepEqual(membershipPriceQuote('0.01'), { baseUSD: '$0.01 USD', feeUSD: '$0.0001 USD', commissionBaseUSD: '$0.0099 USD', totalUSD: '$0.01 USD' });
});

test('quote preserves cents for large strings and normalizes finite numeric catalog values', () => {
  assert.deepEqual(membershipPriceQuote('999999999999.99'), {
    baseUSD: '$999,999,999,999.99 USD', feeUSD: '$9,999,999,999.9999 USD', commissionBaseUSD: '$989,999,999,999.9901 USD', totalUSD: '$999,999,999,999.99 USD',
  });
  assert.deepEqual(membershipPriceQuote(100.1), { baseUSD: '$100.10 USD', feeUSD: '$1.001 USD', commissionBaseUSD: '$99.099 USD', totalUSD: '$100.10 USD' });
  assert.deepEqual(membershipPriceQuote('90071992547409.91'), {
    baseUSD: '$90,071,992,547,409.91 USD', feeUSD: '$900,719,925,474.0991 USD', commissionBaseUSD: '$89,171,272,621,935.8109 USD', totalUSD: '$90,071,992,547,409.91 USD',
  });
});

test('included cost plus net is exactly the catalog total without rounding or surcharges', () => {
  const units = formatted => {
    const [whole, fraction] = formatted.slice(1, -4).replaceAll(',', '').split('.');
    return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0'));
  };
  for (let cents = 1n; cents <= 1000n; cents++) {
    const amount = `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
    const quote = membershipPriceQuote(amount);
    assert.equal(units(quote.feeUSD), cents);
    assert.equal(units(quote.commissionBaseUSD), cents * 99n);
    assert.equal(units(quote.feeUSD) + units(quote.commissionBaseUSD), units(quote.totalUSD));
    assert.equal(quote.baseUSD, quote.totalUSD);
    assert.match(quote.totalUSD, /\.\d{2} USD$/);
  }
});

test('invalid catalog amounts do not create zero-dollar or rounded quotes', () => {
  for (const amount of [undefined, null, false, {}, [], 0n, '', ' ', ' 100.00', '100.00 ', '\n100.00',
    '0', '0.00', 0, -1, '-1.00', '+100', '01', '00.50', '.50', '1.', '1.001', '1e3',
    NaN, Infinity, -Infinity, '1,000.00', '90071992547409.92', '9'.repeat(10000)]) {
    assert.equal(membershipPriceQuote(amount), null, `Invalid quote for type ${typeof amount}`);
  }
});
