import assert from 'node:assert/strict';
import test from 'node:test';
import { fundingMessages } from './funding-messages.js';
import { messages, SUPPORTED_LOCALES } from './messages.js';

test('all funding locales expose the same keys and interpolation values', () => {
  const expected = Object.keys(fundingMessages.es.funding).sort();
  const placeholders = text => [...text.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
  for (const locale of SUPPORTED_LOCALES) {
    const catalog = fundingMessages[locale].funding;
    assert.deepEqual(Object.keys(catalog).sort(), expected, locale);
    for (const key of expected) {
      assert.ok(typeof catalog[key] === 'string' && catalog[key].trim(), `${locale}.${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(fundingMessages.es.funding[key]), `${locale}.${key}`);
    }
  }
});

test('personal funding copy distinguishes USD20 from administrative USD50 and local SPEI amounts', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const funding = fundingMessages[locale].funding;
    assert.match(funding.personalFormCopy, /20/);
    assert.match(funding.personalAmountRange, /20/);
    assert.match(funding.personalLocalMinimumPending, /20/);
    assert.match(funding.personalSpeiMinimum, /SPEI/);
    assert.match(funding.personalSpeiMinimum, /MXN/);
    assert.match(funding.personalSpeiMinimum, /20/);
    assert.match(funding.amountRange, /50/);
    assert.match(funding.localMinimumPending, /50/);
    assert.equal(funding.personalEnvironment, 'Reown');
    assert.match(messages[locale].walletPage.administrativeProviderCopy, /50/);
    assert.match(messages[locale].walletPage.minimumTopUpCopy, /20/);
    assert.match(messages[locale].overview.plansFrom, /20/);
    assert.doesNotMatch(messages[locale].walletPage.simpleProviderNote, /Topper/);
    assert.match(messages[locale].walletPage.simpleProviderNote, /Swapped/);
    assert.match(messages[locale].walletPage.simpleProviderNote, /Mercuryo/);
  }
});
