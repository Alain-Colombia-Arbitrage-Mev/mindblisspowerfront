import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReferralLinks, referralBrowserOrigin, referralLinkCode, referralLinksFrom, referralPublicOrigin } from './referral-links.mjs';

test('share URLs use the current canonical portal origin and never default to the retired app alias', () => {
  assert.equal(referralPublicOrigin(), 'https://mindblisspower.com');
  assert.equal(referralPublicOrigin({ REFERRAL_BASE_URL: 'https://app.mindblisspower.com' }), 'https://mindblisspower.com');
  assert.equal(referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', REFERRAL_BASE_URL: 'https://app.mindblisspower.com' }), 'https://portal.example.test');
  assert.deepEqual(buildReferralLinks('Diamond1'), {
    left: 'https://mindblisspower.com/register?ref=Diamond1&side=L',
    right: 'https://mindblisspower.com/register?ref=Diamond1&side=R',
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

test('a mounted alternate configured portal keeps its own origin while the old app alias canonicalizes', t => {
  const previous = globalThis.window;
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  globalThis.window = { location: { origin: 'https://preview.example.test' } };
  assert.equal(referralBrowserOrigin(), 'https://preview.example.test');
  assert.equal(new URL(buildReferralLinks('OpaqueCode').right).origin, 'https://preview.example.test');
  globalThis.window.location.origin = 'https://app.mindblisspower.com';
  assert.equal(referralBrowserOrigin(), 'https://mindblisspower.com');
});
