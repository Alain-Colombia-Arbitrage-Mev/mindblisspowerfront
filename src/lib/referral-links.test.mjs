import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReferralLinks, referralBrowserOrigin, referralLinkCode, referralLinksFrom, referralPublicOrigin } from './referral-links.mjs';

test('share URLs keep the exact configured portal origin without changing the default main portal', () => {
  assert.equal(referralPublicOrigin(), 'https://mindblisspower.com');
  assert.equal(referralPublicOrigin({ REFERRAL_BASE_URL: 'https://app.mindblisspower.com' }), 'https://app.mindblisspower.com');
  assert.equal(referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', REFERRAL_BASE_URL: 'https://app.mindblisspower.com' }), 'https://portal.example.test');
  assert.deepEqual(buildReferralLinks('Diamond1'), {
    left: 'https://mindblisspower.com/register?ref=Diamond1&side=L',
    right: 'https://mindblisspower.com/register?ref=Diamond1&side=R',
  });
  assert.deepEqual(buildReferralLinks('Diamond1', referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com' })), {
    left: 'https://app.mindblisspower.com/register?ref=Diamond1&side=L',
    right: 'https://app.mindblisspower.com/register?ref=Diamond1&side=R',
  });
});

test('a referral is an opaque case-preserving bounded hint, not a URL, redirect, mailbox or tree mutation', () => {
  const links = buildReferralLinks(' A&B#?+ ', 'https://portal.example.test');
  for (const [key, side] of [['left', 'L'], ['right', 'R']]) {
    const url = new URL(links[key]);
    assert.equal(url.origin, 'https://portal.example.test'); assert.equal(url.pathname, '/register');
    assert.deepEqual([...url.searchParams], [['ref', 'A&B#?+'], ['side', side]]);
    assert.equal(url.hash, ''); assert.equal(url.username, ''); assert.equal(url.password, '');
  }
  for (const value of ['', 'a'.repeat(65), 'bad code', '\u0000danger', {}, 42]) {
    assert.equal(referralLinkCode(value), ''); assert.deepEqual(buildReferralLinks(value), { left: '', right: '' });
  }
});

test('invalid configured destinations cannot inject credentials, ports, paths or unsafe protocols', () => {
  for (const origin of ['http://mindblisspower.com', 'https://user:password@mindblisspower.com', 'https://mindblisspower.com:8443',
    'https://mindblisspower.com/redirect', 'https://mindblisspower.com?next=evil', 'https://mindblisspower.com#private', 'not-a-url']) {
    assert.throws(() => referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: origin }));
  }
});

test('old or arbitrary returned links are rebuilt from the real code without their host, email or redirect parameters', () => {
  const expected = buildReferralLinks('MP50793');
  for (const link of ['https://app.mindblisspower.com/register?ref=wrong&side=R', 'https://evil.example/register?ref=bad&email=private@example.test&redirect=evil']) {
    assert.deepEqual(referralLinksFrom({ positioned: true, code: 'MP50793', link, links: { left: link, right: link } }), expected);
  }
  assert.deepEqual(referralLinksFrom({ positioned: false, code: 'MP50793' }), { left: '', right: '' });
});

test('a mounted portal keeps its own exact origin, including app, when rebuilding untrusted API links', t => {
  const previous = globalThis.window;
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  globalThis.window = { location: { origin: 'https://preview.example.test' } };
  assert.equal(referralBrowserOrigin(), 'https://preview.example.test');
  assert.equal(new URL(buildReferralLinks('OpaqueCode').right).origin, 'https://preview.example.test');
  globalThis.window.location.origin = 'https://app.mindblisspower.com';
  assert.equal(referralBrowserOrigin(), 'https://app.mindblisspower.com');
  const links = referralLinksFrom({ positioned: true, code: 'OpaqueCode',
    link: 'https://mindblisspower.com/register?ref=wrong&email=private%40example.test&next=https%3A%2F%2Fevil.example.test' });
  for (const [key, side] of [['left', 'L'], ['right', 'R']]) {
    const url = new URL(links[key]);
    assert.equal(url.origin, 'https://app.mindblisspower.com');
    assert.deepEqual([...url.searchParams], [['ref', 'OpaqueCode'], ['side', side]]);
  }
});
