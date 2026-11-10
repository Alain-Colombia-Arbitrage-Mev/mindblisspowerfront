import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReferralLink, referralBrowserOrigin, referralLinkCode, referralLinkFrom, referralPublicOrigin } from './referral-links.mjs';

test('share URLs keep the configured portal origin and contain one sponsor hint without a client-selected side', () => {
  assert.equal(referralPublicOrigin(), 'https://mindblisspower.com');
  assert.equal(referralPublicOrigin({ REFERRAL_BASE_URL: 'https://app.mindblisspower.com' }), 'https://app.mindblisspower.com');
  assert.equal(referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', REFERRAL_BASE_URL: 'https://app.mindblisspower.com' }), 'https://portal.example.test');
  assert.equal(buildReferralLink('Diamond1'), 'https://mindblisspower.com/register?ref=Diamond1');
  assert.equal(buildReferralLink('Diamond1', referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com' })),
    'https://app.mindblisspower.com/register?ref=Diamond1');
});

test('a referral is an opaque case-preserving bounded hint, not a placement, redirect or mailbox', () => {
  const url = new URL(buildReferralLink(' A&B#?+ ', 'https://portal.example.test'));
  assert.equal(url.origin, 'https://portal.example.test');
  assert.equal(url.pathname, '/register');
  assert.deepEqual([...url.searchParams], [['ref', 'A&B#?+']]);
  assert.equal(url.hash, '');
  assert.equal(url.username, '');
  assert.equal(url.password, '');
  for (const value of ['', 'a'.repeat(65), 'bad code', '\u0000danger', {}, 42]) {
    assert.equal(referralLinkCode(value), '');
    assert.equal(buildReferralLink(value), '');
  }
});

test('invalid configured destinations cannot inject credentials, ports, paths or unsafe protocols', () => {
  for (const origin of ['http://mindblisspower.com', 'https://user:password@mindblisspower.com', 'https://mindblisspower.com:8443',
    'https://mindblisspower.com/redirect', 'https://mindblisspower.com?next=evil', 'https://mindblisspower.com#private', 'not-a-url']) {
    assert.throws(() => referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: origin }));
  }
});

test('old or arbitrary returned links are rebuilt from the real code without host, side, email or redirect parameters', () => {
  const expected = buildReferralLink('MP50793');
  for (const link of ['https://app.mindblisspower.com/register?ref=wrong&side=R', 'https://evil.example/register?ref=bad&email=private@example.test&redirect=evil']) {
    assert.equal(referralLinkFrom({ positioned: true, code: 'MP50793', link }), expected);
  }
  assert.equal(referralLinkFrom({ positioned: false, code: 'MP50793' }), '');
});

test('a mounted portal keeps its own exact origin when rebuilding untrusted API links', t => {
  const previous = globalThis.window;
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  globalThis.window = { location: { origin: 'https://preview.example.test' } };
  assert.equal(referralBrowserOrigin(), 'https://preview.example.test');
  assert.equal(new URL(buildReferralLink('OpaqueCode')).origin, 'https://preview.example.test');
  globalThis.window.location.origin = 'https://app.mindblisspower.com';
  const link = referralLinkFrom({ positioned: true, code: 'OpaqueCode',
    link: 'https://mindblisspower.com/register?ref=wrong&side=L&email=private%40example.test&next=https%3A%2F%2Fevil.example.test' });
  const url = new URL(link);
  assert.equal(url.origin, 'https://app.mindblisspower.com');
  assert.deepEqual([...url.searchParams], [['ref', 'OpaqueCode']]);
});
