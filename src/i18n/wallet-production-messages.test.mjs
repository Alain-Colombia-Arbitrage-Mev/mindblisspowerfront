import assert from 'node:assert/strict';
import test from 'node:test';
import { walletProductionMessages } from './wallet-production-messages.js';
import { translateMessage } from './translate.mjs';

const locales = ['es', 'en', 'ar', 'zh'];
const keys = ['addFunds', 'provider', 'chooseProvider', 'chooseMethod', 'useMinimum', 'invalidAmount',
  'quoteLoading', 'quoteReady', 'quoteSelection', 'amountPlaceholder',
  'depositQr', 'depositTitle', 'depositInstructions', 'depositQrLabel', 'depositQrFallback'];
const placeholders = text => [...text.matchAll(/\{([^{}]+)\}/g)].map(match => match[1]).sort();

test('every production funding language includes the full catalog and new form states without fallback', () => {
  const expectedKeys = Object.keys(walletProductionMessages.es.walletProduction).sort();
  for (const locale of locales) {
    const catalog = walletProductionMessages[locale].walletProduction;
    assert.deepEqual(Object.keys(catalog).sort(), expectedKeys, locale);
    for (const key of expectedKeys) {
      assert.equal(typeof catalog[key], 'string', `${locale}.${key}`);
      assert.ok(catalog[key].trim(), `${locale}.${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(walletProductionMessages.es.walletProduction[key]), `${locale}.${key}`);
      assert.equal(translateMessage(locale, `walletProduction.${key}`), catalog[key], `${locale}.${key}`);
    }
    for (const key of keys) assert.ok(Object.hasOwn(catalog, key), `${locale}.${key}`);
  }
});

test('minimum, amount bounds, quote and provider labels preserve the selected currency and interpolate all variables', () => {
  const cases = [
    ['useMinimum', { amount: '1,000', currency: 'MXN' }],
    ['invalidAmount', { min: '1,000', max: '100,000', currency: 'MXN' }],
    ['quoteReady', { amount: '50', currency: 'USD' }],
    ['quoteSelection', { provider: 'Transak' }],
    ['amountPlaceholder', { currency: 'COP' }],
    ['depositTitle', { network: 'Arbitrum' }],
    ['depositInstructions', { network: 'Polygon' }],
    ['depositQrLabel', { network: 'Arbitrum' }],
  ];
  for (const locale of locales) {
    for (const [key, variables] of cases) {
      const result = translateMessage(locale, `walletProduction.${key}`, variables);
      assert.doesNotMatch(result, /\{[^{}]+\}/, `${locale}.${key}`);
      for (const value of Object.values(variables)) assert.ok(result.includes(value), `${locale}.${key}: ${value}`);
    }
  }
});

test('legacy action keys and separate real-payment, identity and sandbox notices remain available in every language', () => {
  for (const locale of locales) {
    const catalog = walletProductionMessages[locale].walletProduction;
    for (const key of ['quote', 'quoting', 'continue', 'production', 'finalPrice', 'confirmationCopy', 'legacyCopy', 'quoteExpired']) {
      assert.ok(catalog[key].trim(), `${locale}.${key}`);
    }
    assert.match(catalog.legacy, /sandbox/);
    assert.match(catalog.confirmationCopy, /MELD/);
    assert.deepEqual(placeholders(catalog.continue), ['provider']);
    assert.notEqual(catalog.production, catalog.legacy);
  }
});
