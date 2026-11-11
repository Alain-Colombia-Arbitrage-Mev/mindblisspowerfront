import assert from 'node:assert/strict';
import test from 'node:test';
import { companyPaymentMessages } from './company-payment-messages.js';
import { SUPPORTED_LOCALES } from './messages.js';
import { translateMessage } from './translate.mjs';

test('company payment translations preserve the full locale and interpolation contract', () => {
  const expected = Object.keys(companyPaymentMessages.es.companyPayment).sort();
  const placeholders = text => [...text.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
  for (const locale of SUPPORTED_LOCALES) {
    const catalog = companyPaymentMessages[locale].companyPayment;
    assert.deepEqual(Object.keys(catalog).sort(), expected, locale);
    for (const key of expected) {
      assert.ok(typeof catalog[key] === 'string' && catalog[key].trim(), `${locale}.${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(companyPaymentMessages.es.companyPayment[key]));
      assert.equal(translateMessage(locale, `companyPayment.${key}`), catalog[key]);
    }
    assert.match(catalog.gasCopy, /POL/);
    assert.match(catalog.network, /Polygon.*USDT/);
    assert.match(catalog.confirmedCopy, /12/);
    for (const key of ['preparedTitle', 'preparedCopy', 'submittedTitle', 'confirmedTitle', 'pendingCopy', 'ambiguousTitle',
      'ambiguousCopy', 'registerHash', 'hashLabel', 'verify', 'resume', 'statusUnavailable', 'emptyHistory', 'switchNetwork',
      'zeroGas', 'balanceChanged', 'walletMismatch', 'rejected', 'serviceUnavailable', 'paymentFailed', 'networkUnavailable',
      'expired', 'recoveryUnavailable', 'pendingExists', 'connectCopy', 'verifyWallet', 'backWallet', 'newPayment', 'preparedExpired',
      'abandon', 'abandonedTitle', 'abandonedCopy']) {
      assert.ok(catalog[key]?.trim(), `${locale}.${key}`);
    }
  }
});
