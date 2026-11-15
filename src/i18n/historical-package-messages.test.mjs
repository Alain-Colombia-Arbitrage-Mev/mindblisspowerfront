import assert from 'node:assert/strict';
import test from 'node:test';
import { historicalPackageMessages } from './historical-package-messages.js';
import { SUPPORTED_LOCALES } from './messages.js';
import { translateMessage } from './translate.mjs';

test('every supported locale resolves all historical package states without a fallback or missing message', () => {
  const expected = Object.keys(historicalPackageMessages.es.historicalPackage).sort();
  const placeholders = text => [...text.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
  for (const locale of SUPPORTED_LOCALES) {
    const catalog = historicalPackageMessages[locale].historicalPackage;
    assert.deepEqual(Object.keys(catalog).sort(), expected, locale);
    for (const key of expected) {
      assert.equal(typeof catalog[key], 'string', `${locale}.${key}`);
      assert.ok(catalog[key].trim(), `${locale}.${key}`);
      assert.equal(translateMessage(locale, `historicalPackage.${key}`), catalog[key], `${locale}.${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(historicalPackageMessages.es.historicalPackage[key]), `${locale}.${key}`);
    }
    for (const status of ['active', 'suspended', 'revoked', 'review_required']) assert.ok(catalog[`status_${status}`]);
    assert.equal(translateMessage(locale, 'historicalPackage.activeCount', { count: 3 }), catalog.activeCount.replace('{count}', '3'));
    assert.equal(translateMessage(locale, 'historicalPackage.packageLabel', { amount: '100 USD' }), catalog.packageLabel.replace('{amount}', '100 USD'));
    assert.equal(translateMessage(locale, 'historicalPackage.recentCount', { count: 100, total: 125 }), catalog.recentCount.replace('{count}', '100').replace('{total}', '125'));
    assert.match(catalog.source, /Stripe/);
  }
});

test('historical package copy is local to its namespace and does not replace existing authentication or financial messages', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(translateMessage(locale, 'historicalPackage.unknownState'), 'historicalPackage.unknownState');
    assert.notEqual(translateMessage(locale, 'profilePage.plan'), 'profilePage.plan');
    assert.notEqual(translateMessage(locale, 'walletPage.balance'), 'walletPage.balance');
    assert.notEqual(translateMessage(locale, 'session.checking'), 'session.checking');
  }
});
