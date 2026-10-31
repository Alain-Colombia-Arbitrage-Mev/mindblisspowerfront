import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { privateCloudflareResponse } from './cloudflare-portal-guard.mjs';

const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'));
const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
const workerFirst = path => config.assets.run_worker_first.includes('/*')
  && !config.assets.run_worker_first.some(pattern => pattern.startsWith('!') && path.startsWith(pattern.slice(1, -1)));

test('only uploaded public assets bypass application execution; dynamic cache is disabled', () => {
  assert.equal(config.cache.enabled, false);
  assert.deepEqual(config.assets.run_worker_first, ['/*', '!/_next/static/*', '!/fonts/*', '!/mindbliss/*']);
  for (const path of ['/_next/static/chunks/abcd1234.js', '/fonts/montserrat-latin-wght.woff2', '/mindbliss/mindbliss-01.avif']) assert.equal(workerFirst(path), false);
  for (const path of ['/', '/login', '/register', '/dashboard', '/dashboard/users.rsc', '/api/auth/session',
    '/api/member/summary', '/api/member/summary.css', '/api/payments/me', '/api/withdrawals', '/api/catalog',
    '/%61pi/member/profile.css', '/_next/image', '/uploads/private.png']) assert.equal(workerFirst(path), true, path);
  assert.deepEqual(headers.split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#')), [],
    'cache headers are generated for exact existing files after build, never wildcard 404s');
});

test('Worker response never inherits CDN cache directives, while preserving cookies and RSC variance', async () => {
  for (const status of [200, 301, 400, 401, 403, 404, 429, 500, 503]) {
    const response = privateCloudflareResponse(new Response('private', { status, headers: {
      'Cache-Control': 'public, s-maxage=300', 'CDN-Cache-Control': 'public, max-age=300',
      'Cloudflare-CDN-Cache-Control': 'public, max-age=300', 'Surrogate-Control': 'max-age=300',
      Expires: 'Wed, 01 Jan 2031 00:00:00 GMT', 'Cache-Tag': 'private-user',
      'Set-Cookie': 'session=fixture; Secure; HttpOnly', Vary: 'RSC, Next-Router-State-Tree', Location: '/login',
    } }));
    assert.equal(response.status, status);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    for (const name of ['cdn-cache-control', 'cloudflare-cdn-cache-control']) assert.equal(response.headers.get(name), 'no-store');
    for (const name of ['surrogate-control', 'expires', 'cache-tag']) assert.equal(response.headers.has(name), false);
    assert.equal(response.headers.get('set-cookie'), 'session=fixture; Secure; HttpOnly');
    assert.equal(response.headers.get('vary'), 'RSC, Next-Router-State-Tree');
    assert.equal(response.headers.get('location'), '/login');
    assert.equal(await response.text(), 'private');
  }
  assert.equal(privateCloudflareResponse(new Response(null, { status: 204 })).status, 204);
});
