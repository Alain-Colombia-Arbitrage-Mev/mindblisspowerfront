import test from 'node:test';
import assert from 'node:assert/strict';
import { readCheckoutIntent, getOrCreateCheckoutIntent, clearCheckoutIntent } from './checkout-intent.mjs';

const owner = 'synthetic-owner-one', otherOwner = 'synthetic-owner-two';
const firstId = 'a02f5a55-5fa3-4239-845b-ac6b699110ee', secondId = 'a02f5a55-5fa3-4239-845b-ac6b699110ef';
const prefix = 'vp:checkout-intent:v1:production:NOW:';
const key = (subject = owner, packageId = 7) => `${prefix}${encodeURIComponent(subject)}:${packageId}`;
function storage() {
  const values = new Map();
  return { values, getItem: name => values.has(name) ? values.get(name) : null,
    setItem: (name, value) => { values.set(name, String(value)); }, removeItem: name => { values.delete(name); } };
}

test('checkout intent persists one canonical UUID for a verified owner and plan, recovering it across remounts without an expiry-based replacement', () => {
  const saved = storage(); let generated = 0;
  assert.equal(readCheckoutIntent(saved, owner, 7), null);
  assert.equal(getOrCreateCheckoutIntent(saved, owner, 7, () => { generated++; return firstId; }), firstId);
  assert.equal(saved.values.get(key()), firstId); assert.equal(saved.values.size, 1);
  for (let attempt = 0; attempt < 8; attempt++) {
    assert.equal(readCheckoutIntent(saved, owner, 7), firstId);
    assert.equal(getOrCreateCheckoutIntent(saved, owner, 7, () => assert.fail('a retry or remount regenerated the intention')), firstId);
  }
  assert.equal(generated, 1);
  assert.deepEqual([...saved.values], [[key(), firstId]], 'no email, token, checkout URL or customer money is stored');
});

test('owners, packages and browser-tab stores have independent intent namespaces while only explicit clearing prepares another same-SKU purchase', () => {
  const saved = storage(), separateTab = storage();
  assert.equal(getOrCreateCheckoutIntent(saved, owner, 7, () => firstId), firstId);
  assert.equal(readCheckoutIntent(saved, owner, 9), null);
  assert.equal(readCheckoutIntent(saved, otherOwner, 7), null);
  assert.equal(readCheckoutIntent(separateTab, owner, 7), null);
  getOrCreateCheckoutIntent(saved, owner, 9, () => secondId);
  getOrCreateCheckoutIntent(saved, otherOwner, 7, () => secondId);
  getOrCreateCheckoutIntent(separateTab, owner, 7, () => secondId);
  clearCheckoutIntent(saved, owner, 7);
  assert.equal(readCheckoutIntent(saved, owner, 7), null);
  assert.equal(readCheckoutIntent(saved, owner, 9), secondId);
  assert.equal(readCheckoutIntent(saved, otherOwner, 7), secondId);
  assert.equal(readCheckoutIntent(separateTab, owner, 7), secondId);
  assert.equal(saved.values.size, 2, 'preparing another purchase does not generate or store a new UUID yet');
  assert.equal(getOrCreateCheckoutIntent(saved, owner, 7, () => secondId), secondId);
  assert.notEqual(readCheckoutIntent(saved, owner, 7), firstId);
});

test('missing, unverified-shaped or PII-looking identity and invalid plan selectors fail before creating any browser intention', () => {
  for (const subject of [undefined, null, '', 'short', ' member-valid ', 'person@example.test', 'https://outside.test',
    'bad:owner', 'bad/owner', 'bad\nowner', 'a'.repeat(129), {}, 12345678]) {
    const saved = storage(); let generated = 0;
    assert.throws(() => getOrCreateCheckoutIntent(saved, subject, 7, () => { generated++; return firstId; }));
    assert.throws(() => clearCheckoutIntent(saved, subject, 7));
    assert.equal(generated, 0); assert.equal(saved.values.size, 0);
  }
  for (const packageId of [undefined, null, false, true, {}, [], 0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    const saved = storage(); let generated = 0;
    assert.throws(() => getOrCreateCheckoutIntent(saved, owner, packageId, () => { generated++; return firstId; }));
    assert.throws(() => clearCheckoutIntent(saved, owner, packageId));
    assert.equal(generated, 0); assert.equal(saved.values.size, 0);
  }
});

test('corrupt or oversized stored values fail closed instead of silently turning a previous intent into a fresh purchase', () => {
  for (const value of ['', firstId.toUpperCase(), ` ${firstId}`, `${firstId} `, '00000000-0000-0000-0000-000000000000',
    JSON.stringify({ purchase_request_id: firstId }), 'https://nowpayments.io/payment/?iid=1', 'x'.repeat(4096)]) {
    const saved = storage(); saved.values.set(key(), value); let generated = 0;
    assert.throws(() => readCheckoutIntent(saved, owner, 7));
    assert.throws(() => getOrCreateCheckoutIntent(saved, owner, 7, () => { generated++; return secondId; }));
    assert.equal(generated, 0); assert.equal(saved.values.get(key()), value);
  }
});

test('blocked, ignored or inconsistent storage writes cannot admit a checkout with an unpersisted intent, and failed clearing never claims preparation', () => {
  const unavailable = () => { throw new DOMException('private browser diagnostic', 'SecurityError'); };
  for (const saved of [null, undefined, {}, { getItem: unavailable, setItem() {} },
    { getItem: () => null, setItem: unavailable }, { getItem: () => null, setItem() {} },
    { getItem: () => null, setItem() {}, removeItem() {} }]) {
    assert.throws(() => getOrCreateCheckoutIntent(saved, owner, 7, () => firstId));
  }
  const saved = storage(); saved.setItem(key(), firstId);
  assert.throws(() => clearCheckoutIntent({ ...saved, removeItem: unavailable }, owner, 7));
  assert.equal(readCheckoutIntent(saved, owner, 7), firstId);
  assert.throws(() => clearCheckoutIntent({ ...saved, removeItem() {} }, owner, 7));
  assert.equal(readCheckoutIntent(saved, owner, 7), firstId);
});

test('a malformed random UUID cannot be persisted, while a valid existing intent does not invoke the random generator', () => {
  for (const value of [undefined, null, '', firstId.toUpperCase(), '00000000-0000-0000-0000-000000000000', {}, ` ${firstId}`]) {
    const saved = storage(); assert.throws(() => getOrCreateCheckoutIntent(saved, owner, 7, () => value));
    assert.equal(saved.values.size, 0);
  }
  const saved = storage(); saved.setItem(key(), firstId);
  assert.equal(getOrCreateCheckoutIntent(saved, owner, 7, () => { throw new Error('the generator must not run for an existing intent'); }), firstId);
});
