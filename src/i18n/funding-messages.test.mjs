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

test('public personal funding copy offers USD100 without the small test amount and preserves administrative and SPEI limits', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const funding = fundingMessages[locale].funding;
    assert.match(funding.personalFormCopy, /100/);
    assert.match(funding.personalAmountRange, /100.*15[.,]000/);
    assert.match(funding.personalLocalMinimumPending, /100/);
    assert.match(funding.personalSpeiMinimum, /SPEI/);
    assert.match(funding.personalSpeiMinimum, /MXN/);
    assert.match(funding.personalSpeiMinimum, /100/);
    for (const key of ['personalFormCopy', 'personalAmountRange', 'personalLocalMinimumPending', 'personalSpeiMinimum']) assert.doesNotMatch(funding[key], /\b30\b/);
    assert.match(funding.personalSpeiMinimum, /931/);
    assert.match(funding.personalMxnAmountRange, /931.*MXN/);
    assert.match(funding.speiTemporarilyUnavailable, /SPEI/);
    assert.match(funding.speiTemporarilyUnavailable, /MXN/);
    assert.doesNotMatch(funding.speiTemporarilyUnavailable, /USD|20|50/);
    assert.ok(funding.preparingTopUp.trim());
    assert.match(funding.amountRange, /50/);
    assert.match(funding.localMinimumPending, /50/);
    assert.ok(funding.personalEnvironment.trim());
    assert.match(messages[locale].walletPage.administrativeProviderCopy, /50/);
    assert.match(messages[locale].walletPage.minimumTopUpCopy, /100/);
    assert.match(messages[locale].overview.plansFrom, /20/);
    assert.doesNotMatch(messages[locale].walletPage.simpleProviderNote, /Topper/);
    assert.match(messages[locale].walletPage.simpleProviderNote, /Swapped/);
    assert.match(messages[locale].walletPage.simpleProviderNote, /Mercuryo/);
  }
});

test('personal wallet customer copy uses wallet terminology instead of the integration name in every locale', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const wallet = messages[locale].walletPage;
    const funding = fundingMessages[locale].funding;
    const visible = [messages[locale].recharge.providerConfiguration, wallet.connected, wallet.walletCreationCopy,
      wallet.simpleProviderNote, wallet.managedByMeld, funding.personalDestination, funding.personalEnvironment,
      funding.connectWalletCopy, funding.personalProviderNote];
    assert.doesNotMatch(visible.join(' '), /reown|rewon/i, locale);
    assert.match(wallet.managedByMeld, /\{asset\}/, locale);
    assert.match(funding.personalProviderNote, /Swapped/);
    assert.match(funding.personalProviderNote, /Mercuryo/);
  }
});
