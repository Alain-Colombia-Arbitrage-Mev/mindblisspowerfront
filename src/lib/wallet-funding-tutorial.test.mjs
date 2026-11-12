import assert from 'node:assert/strict';
import test from 'node:test';
import { claimWalletTutorial, createWalletTutorialPreference } from './wallet-funding-tutorial.mjs';

function browserStorage() {
  const values = new Map();
  return {
    values,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

test('each owner receives one claim across repeated effects, remounts, and new preference instances', () => {
  const storage = browserStorage();
  const page = createWalletTutorialPreference();
  assert.equal(page.claim('opaque-owner-a', storage), true);
  assert.equal(page.claim('opaque-owner-a', storage), false);
  assert.equal(page.claim('opaque-owner-b', storage), true);
  assert.equal(page.claim('opaque-owner-a', storage), false);

  const remounted = createWalletTutorialPreference();
  assert.equal(remounted.claim('opaque-owner-a', storage), false);
  assert.equal(remounted.claim('opaque-owner-b', storage), false);
  assert.equal(remounted.claim('opaque-owner-c', storage), true);
});

test('browser preferences are isolated and persist only an encoded owner key with a literal marker', () => {
  const firstBrowser = browserStorage();
  const secondBrowser = browserStorage();
  const subject = 'issuer:opaque/subject?with space';
  assert.equal(createWalletTutorialPreference().claim(`  ${subject}  `, firstBrowser), true);
  assert.equal(createWalletTutorialPreference().claim(subject, firstBrowser), false);
  assert.equal(createWalletTutorialPreference().claim(subject, secondBrowser), true);
  assert.deepEqual([...firstBrowser.values], [[
    `mindbliss:wallet-tutorial:v1:${encodeURIComponent(subject)}`, 'seen',
  ]]);
});

test('missing or invalid owners never read storage properties or consume a claim', () => {
  const preference = createWalletTutorialPreference();
  let accesses = 0;
  const storage = new Proxy({}, { get() { accesses++; throw new Error('unexpected storage access'); } });
  for (const owner of [undefined, null, '', ' \n\t ', 42, false, {}, [], 'x'.repeat(257), '\uD800']) {
    assert.equal(preference.claim(owner, storage), false);
  }
  assert.equal(accesses, 0);
  const available = browserStorage();
  assert.equal(preference.claim('x'.repeat(256), available), true);
  assert.equal(preference.claim('x'.repeat(256), available), false);
});

test('absent storage falls back to owner-scoped memory within the current preference instance', () => {
  const preference = createWalletTutorialPreference();
  assert.equal(preference.claim('opaque-owner-a'), true);
  assert.equal(preference.claim('opaque-owner-a'), false);
  assert.equal(preference.claim('opaque-owner-b'), true);
  assert.equal(preference.claim('opaque-owner-b', null), false);
  assert.equal(createWalletTutorialPreference().claim('opaque-owner-a'), true);
});

test('throwing storage getters, reads, and writes still deduplicate each owner without throwing', () => {
  const blocked = () => { throw new Error('synthetic storage failure'); };
  const variants = [
    { getItem: blocked, setItem: blocked },
    { get getItem() { return blocked(); }, setItem() {} },
    { getItem() { return null; }, setItem: blocked },
    { getItem() { return null; }, get setItem() { return blocked(); } },
    {},
  ];
  for (const storage of variants) {
    const preference = createWalletTutorialPreference();
    assert.equal(preference.claim('opaque-owner-a', storage), true);
    assert.equal(preference.claim('opaque-owner-a', storage), false);
    assert.equal(preference.claim('opaque-owner-b', storage), true);
    assert.equal(preference.claim('opaque-owner-a', storage), false);
  }
});

test('a recovered storage persists a prior memory claim without showing the tutorial again', () => {
  const preference = createWalletTutorialPreference();
  const storage = browserStorage();
  assert.equal(preference.claim('opaque-owner-a'), true);
  assert.equal(preference.claim('opaque-owner-a', storage), false);
  assert.equal(createWalletTutorialPreference().claim('opaque-owner-a', storage), false);
});

test('a persisted preference stays suppressed if storage later becomes unavailable', () => {
  const storage = browserStorage();
  assert.equal(createWalletTutorialPreference().claim('opaque-owner-a', storage), true);
  const remounted = createWalletTutorialPreference();
  assert.equal(remounted.claim('opaque-owner-a', storage), false);
  assert.equal(remounted.claim('opaque-owner-a'), false);
});

test('only the bounded memory fallback expires oldest owners; persistent markers remain intact', () => {
  const fallback = createWalletTutorialPreference();
  for (let index = 0; index < 128; index++) assert.equal(fallback.claim(`opaque-owner-${index}`), true);
  assert.equal(fallback.claim('opaque-owner-0'), false);
  assert.equal(fallback.claim('opaque-owner-128'), true);
  assert.equal(fallback.claim('opaque-owner-0'), true, 'a repeated claim does not reorder FIFO retention');
  assert.equal(fallback.claim('opaque-owner-128'), false);

  const storage = browserStorage();
  const persisted = createWalletTutorialPreference();
  for (let index = 0; index < 129; index++) assert.equal(persisted.claim(`opaque-owner-${index}`, storage), true);
  assert.equal(persisted.claim('opaque-owner-0', storage), false);
  assert.equal(storage.values.size, 129);
  assert.equal(createWalletTutorialPreference().claim('opaque-owner-0', storage), false);
});

test('the exported claim function shares its document-local preference and honors persisted markers', () => {
  const storage = browserStorage();
  assert.equal(claimWalletTutorial('opaque-module-owner', storage), true);
  assert.equal(claimWalletTutorial('opaque-module-owner'), false);
  assert.equal(createWalletTutorialPreference().claim('opaque-module-owner', storage), false);
});
