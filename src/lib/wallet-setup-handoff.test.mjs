import assert from 'node:assert/strict';
import test from 'node:test';
import { rememberWalletSetupAfterAuth, consumeWalletSetupAfterAuth, resumeWalletSetupAfterAuth, clearWalletSetupAfterAuth } from './wallet-setup-handoff.mjs';

const now = 1_794_419_000_000;
const session = { subject: 'synthetic-owner', email: 'member@example.test' };
function fixture() {
  const values = new Map(), calls = [];
  const sessionStorage = {
    getItem(key) { calls.push(['get', key]); return values.get(key) ?? null; },
    setItem(key, value) { calls.push(['set', key]); values.set(key, value); },
    removeItem(key) { calls.push(['remove', key]); values.delete(key); },
  };
  const browser = new Proxy({ sessionStorage }, { get(target, name) {
    assert.equal(name, 'sessionStorage', 'No URL, cookies or persistent storage may be read'); return target[name];
  } });
  return { browser, sessionStorage, values, calls,
    write(raw) { values.set('mindbliss:wallet-setup-after-auth:v1', raw); }, raw() { return [...values.values()][0]; } };
}

test('canonical auth claims the owner once and preserves only pending UI metadata until completion', () => {
  const view = fixture();
  assert.equal(rememberWalletSetupAfterAuth(' MEMBER@Example.Test ', view.browser, now), true);
  assert.deepEqual(JSON.parse(view.raw()), { version: 1, email: session.email, createdAt: now });
  const result = consumeWalletSetupAfterAuth({ ...session, email: ' MEMBER@EXAMPLE.TEST ' }, view.browser, now + 1000);
  assert.deepEqual(result, { email: session.email, subject: session.subject, ownerKey: JSON.stringify([session.subject, session.email]), createdAt: now });
  assert.ok(Object.isFrozen(result)); assert.equal(view.values.size, 1);
  assert.deepEqual(JSON.parse(view.raw()), { version: 1, ...session, createdAt: now });
  assert.equal(consumeWalletSetupAfterAuth(session, view.browser, now + 1001), null);
  assert.deepEqual(resumeWalletSetupAfterAuth(session, view.browser, now + 1001), result);
  assert.equal(clearWalletSetupAfterAuth(result, view.browser), true);
  assert.equal(resumeWalletSetupAfterAuth(session, view.browser, now + 1002), null);
});

test('unavailable or malformed session data leaves a valid hint untouched until the projection arrives', () => {
  const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
  const raw = view.raw(); view.calls.length = 0;
  for (const identity of [null, undefined, {}, [], false, { email: session.email }, { ...session, subject: '' },
    { ...session, subject: ' ' }, { ...session, email: 'invalid' }, { get email() { throw Error('Malformed projection'); } }]) {
    assert.equal(consumeWalletSetupAfterAuth(identity, view.browser, now + 10), null); assert.equal(view.raw(), raw);
  }
  assert.deepEqual(view.calls, []); assert.equal(consumeWalletSetupAfterAuth(session, view.browser, now + 10)?.subject, session.subject);
});

test('another authenticated account discards a mismatched hint permanently', () => {
  const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
  assert.equal(consumeWalletSetupAfterAuth({ subject: 'another-owner', email: 'other@example.test' }, view.browser, now + 10), null);
  assert.equal(view.values.size, 0); assert.equal(consumeWalletSetupAfterAuth(session, view.browser, now + 20), null);
});

test('separate tabs do not share the handoff', () => {
  const first = fixture(), second = fixture(); rememberWalletSetupAfterAuth(session.email, first.browser, now);
  assert.equal(consumeWalletSetupAfterAuth(session, second.browser, now + 1), null); assert.equal(first.values.size, 1);
  assert.equal(consumeWalletSetupAfterAuth(session, first.browser, now + 1)?.ownerKey, JSON.stringify([session.subject, session.email]));
});

test('stale and future records cannot extend the strict two-minute lifetime', () => {
  for (const [createdAt, checkedAt] of [[now, now + 120000], [now, now + 120001], [now + 1, now], [0, now], [-1, now]]) {
    const view = fixture(); view.write(JSON.stringify({ version: 1, email: session.email, createdAt }));
    assert.equal(consumeWalletSetupAfterAuth(session, view.browser, checkedAt), null); assert.equal(view.values.size, 0);
  }
  const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
  assert.ok(consumeWalletSetupAfterAuth(session, view.browser, now + 119999));
});

test('expanded, malformed and noncanonical records cannot supply authentication or wallet proof', () => {
  const valid = { version: 1, email: session.email, createdAt: now };
  const records = ['not-json', '', 'null', 'false', '[]', '{}', 'x'.repeat(1025),
    ...[{ ...valid, version: 2 }, { ...valid, createdAt: String(now) }, { ...valid, createdAt: now + 0.5 },
      { ...valid, email: ' MEMBER@EXAMPLE.TEST ' }, { ...valid, subject: session.subject },
      { ...valid, walletAddress: `0x${'1'.repeat(40)}` }, { ...valid, token: 'synthetic-private-token' },
      { ...valid, authVerified: true }, { ...valid, expiresAt: now + 999999 }, { email: session.email, createdAt: now },
    ].map(value => JSON.stringify(value))];
  for (const raw of records) {
    const view = fixture(); view.write(raw); assert.equal(consumeWalletSetupAfterAuth(session, view.browser, now), null, raw);
    assert.equal(view.values.size, 0); assert.equal(consumeWalletSetupAfterAuth(session, view.browser, now), null);
  }
});

test('invalid subject projections leave the hint untouched and cannot fabricate an owner key', () => {
  const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
  for (const subject of [null, 1, {}, ' owner', 'owner ', 'line\nfeed', 'x'.repeat(257)]) {
    assert.equal(consumeWalletSetupAfterAuth({ ...session, subject }, view.browser, now), null); assert.equal(view.values.size, 1);
  }
});

test('blocked storage is best effort and never falls back to another channel', () => {
  const blocked = { get sessionStorage() { throw Error('Blocked'); } };
  assert.equal(rememberWalletSetupAfterAuth(session.email, blocked, now), false);
  assert.equal(consumeWalletSetupAfterAuth(session, blocked, now), null);
  for (const action of ['getItem', 'setItem', 'removeItem']) {
    const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
    view.sessionStorage[action] = () => { throw Error('Storage unavailable'); };
    assert.equal(rememberWalletSetupAfterAuth(session.email, view.browser, now), false);
    assert.equal(consumeWalletSetupAfterAuth(session, view.browser, now), null);
  }
  assert.equal(rememberWalletSetupAfterAuth(session.email, null, now), false);
  assert.equal(consumeWalletSetupAfterAuth(session, null, now), null);
});

test('storage silently refusing deletion cannot replay the handoff', () => {
  const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now); view.sessionStorage.removeItem = () => {};
  assert.equal(consumeWalletSetupAfterAuth(session, view.browser, now + 1), null);
  assert.equal(consumeWalletSetupAfterAuth(session, view.browser, now + 2), null);
});

test('invalid remember requests clear previous intent without storing invalid time or email values', () => {
  for (const [email, clock] of [[null, now], ['bad-email', now], ['x'.repeat(255) + '@example.test', now],
    [session.email, NaN], [session.email, Infinity], [session.email, -1], [session.email, now + 0.1]]) {
    const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
    assert.equal(rememberWalletSetupAfterAuth(email, view.browser, clock), false); assert.equal(view.values.size, 0);
  }
});

test('server imports are inert without a browser or authentication API', () => {
  assert.equal(typeof window, 'undefined');
  assert.equal(rememberWalletSetupAfterAuth(session.email, undefined, now), false);
  assert.equal(consumeWalletSetupAfterAuth(session, undefined, now), null);
  assert.equal(resumeWalletSetupAfterAuth(session, undefined, now), null);
  assert.equal(clearWalletSetupAfterAuth(null), false);
});

test('pending reloads retain the original timestamp and cannot restart the two-minute window', () => {
  const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
  const first = consumeWalletSetupAfterAuth(session, view.browser, now + 1000), raw = view.raw();
  for (const checkedAt of [now + 2000, now + 90000, now + 119999]) {
    assert.deepEqual(resumeWalletSetupAfterAuth(session, view.browser, checkedAt), first);
    assert.equal(view.raw(), raw, 'Resuming must never rewrite or refresh the pending timestamp');
  }
  assert.equal(resumeWalletSetupAfterAuth(session, view.browser, now + 120000), null);
  assert.equal(view.values.size, 0);
  assert.equal(resumeWalletSetupAfterAuth(session, view.browser, now + 120001), null);
});

test('pending setup is isolated by subject as well as email and cannot revive after an account switch', () => {
  for (const other of [{ ...session, subject: 'another-subject' }, { ...session, email: 'other@example.test' }]) {
    const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
    consumeWalletSetupAfterAuth(session, view.browser, now + 1);
    assert.equal(resumeWalletSetupAfterAuth(other, view.browser, now + 2), null);
    assert.equal(view.values.size, 0);
    assert.equal(resumeWalletSetupAfterAuth(session, view.browser, now + 3), null);
  }
});

test('only the exact owner and handoff generation can finish pending setup', () => {
  const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
  const first = consumeWalletSetupAfterAuth(session, view.browser, now + 1);
  assert.equal(clearWalletSetupAfterAuth({ ...first, ownerKey: 'another-owner' }, view.browser), false);
  rememberWalletSetupAfterAuth(session.email, view.browser, now + 100);
  const next = consumeWalletSetupAfterAuth(session, view.browser, now + 101);
  assert.equal(clearWalletSetupAfterAuth(first, view.browser), false);
  assert.deepEqual(resumeWalletSetupAfterAuth(session, view.browser, now + 102), next);
  assert.equal(clearWalletSetupAfterAuth(next, view.browser), true);
  assert.equal(resumeWalletSetupAfterAuth(session, view.browser, now + 103), null);
});

test('malformed and expanded pending records never supply wallet or session authority', () => {
  const valid = { version: 1, ...session, createdAt: now };
  for (const record of ['not-json', 'null', '[]', 'x'.repeat(1025), ...[
    { ...valid, token: 'not-a-token' }, { ...valid, walletAddress: `0x${'1'.repeat(40)}` },
    { ...valid, createdAt: now + 1 }, { ...valid, subject: ' another-subject' },
    { ...valid, version: 2 }, { ...valid, email: ' MEMBER@EXAMPLE.TEST ' },
  ].map(value => JSON.stringify(value))]) {
    const view = fixture(); view.values.set('mindbliss:wallet-setup-pending:v1', record);
    assert.equal(resumeWalletSetupAfterAuth(session, view.browser, now), null);
    assert.equal(view.values.size, 0);
  }
});

test('pending storage is best effort without leaking into another storage channel', () => {
  const view = fixture(); rememberWalletSetupAfterAuth(session.email, view.browser, now);
  view.sessionStorage.setItem = () => { throw Error('Storage unavailable'); };
  const request = consumeWalletSetupAfterAuth(session, view.browser, now + 1);
  assert.ok(request, 'A failed pending write must not block the already authenticated handoff');
  assert.equal(resumeWalletSetupAfterAuth(session, view.browser, now + 2), null);
  const blocked = { get sessionStorage() { throw Error('Blocked'); } };
  assert.equal(resumeWalletSetupAfterAuth(session, blocked, now), null);
  assert.equal(clearWalletSetupAfterAuth(request, blocked), false);
});
