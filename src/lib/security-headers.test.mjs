import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applySecurityHeaders, DOCUMENT_CSP } from './security-headers.mjs';
import { privateCloudflareResponse } from './cloudflare-portal-guard.mjs';
import { generateStaticCacheHeaders } from '../../scripts/prepare-static-cache-headers.mjs';

test('all dynamic statuses retain security, private cache, cookies, body and routing headers', async () => {
  for (const status of [200, 301, 307, 400, 401, 403, 404, 405, 408, 413, 429, 500, 503]) {
    const headers = new Headers({ 'content-type': 'text/html', location: '/login', vary: 'RSC', 'x-powered-by': 'fixture' });
    headers.append('set-cookie', 'first=fixture; Secure; HttpOnly; SameSite=Lax');
    headers.append('set-cookie', 'second=fixture; Secure; HttpOnly; SameSite=Lax');
    const response = privateCloudflareResponse(new Response('fixture', { status, headers }), new Request('https://mindblisspower.com/login'));
    assert.equal(response.status, status);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('content-security-policy'), DOCUMENT_CSP);
    assert.equal(response.headers.has('content-security-policy-report-only'), false);
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.match(response.headers.get('permissions-policy'), /camera=\(\).*microphone=\(\)/);
    assert.equal(response.headers.get('strict-transport-security'), 'max-age=86400');
    assert.equal(response.headers.has('x-powered-by'), false);
    assert.equal(response.headers.get('location'), '/login');
    assert.equal(response.headers.get('vary'), 'RSC');
    assert.equal(response.headers.getSetCookie().length, 2);
    assert.equal(await response.text(), 'fixture');
  }
  assert.equal(privateCloudflareResponse(new Response(null, { status: 204 })).status, 204);
});

test('HSTS is staged on exact trusted HTTPS hosts, never forwarded headers, preload or subdomains', () => {
  for (const url of ['https://mindblisspower.com/', 'https://admin.mindblisspower.com/', 'https://app.mindblisspower.com/']) {
    const headers = applySecurityHeaders(new Headers(), new Request(url));
    assert.equal(headers.get('strict-transport-security'), 'max-age=86400');
    assert.doesNotMatch(headers.get('strict-transport-security'), /preload|includeSubDomains/i);
  }
  for (const url of ['http://mindblisspower.com/', 'http://app.mindblisspower.com/', 'http://localhost:3000/', 'https://staging.example.test/', 'https://other.mindblisspower.com/', 'https://mindblisspower.com:8443/', 'https://app.mindblisspower.com:8443/', 'https://app.mindblisspower.com.attacker.example/']) {
    const headers = new Headers({ 'strict-transport-security': 'max-age=63072000; includeSubDomains; preload' });
    applySecurityHeaders(headers, new Request(url, { headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'mindblisspower.com' } }));
    assert.equal(headers.has('strict-transport-security'), false, url);
  }
});

test('enforced policy leaves hydration and provider flows intact without a non-reporting report-only policy', () => {
  assert.doesNotMatch(DOCUMENT_CSP, /(?:default|script|style|connect|form-action|navigate-to)-src|unsafe-eval|nonce-/);
  assert.match(DOCUMENT_CSP, /frame-ancestors 'none'/);
  const headers = applySecurityHeaders(new Headers({ 'content-security-policy-report-only': "default-src 'none'" }),
    new Request('https://app.mindblisspower.com/dashboard'));
  assert.equal(headers.has('content-security-policy-report-only'), false);
});

test('uploaded static files get a controlled security-only prefix without wildcard cache or HSTS assumptions', () => {
  const output = generateStaticCacheHeaders(['_next/static/chunks/fixture.js']);
  assert.match(output, /content-security-policy: base-uri 'self'; object-src 'none'; frame-ancestors 'none'/i);
  assert.match(output, /x-frame-options: DENY/i);
  assert.match(output, /referrer-policy: strict-origin-when-cross-origin/i);
  assert.doesNotMatch(output, /strict-transport-security|includeSubDomains|preload/);
  assert.equal(output.split('\n').filter(line => line.startsWith('/')).length, 2);
  assert.doesNotMatch(output, /\/_next\/static\/\*\n {2}Cache-Control/);
});

test('every explicit edge response passes request context through the security wrapper', () => {
  const source = readFileSync(new URL('../../cloudflare-worker.mjs', import.meta.url), 'utf8');
  assert.match(source, /privateCloudflareResponse\(await handleResendWebhook\(request, \{ env: requestEnv \}\), request\)/);
  assert.match(source, /privateCloudflareResponse\(blocked, request\)/);
  assert.match(source, /handler\.fetch\), request\)/);
});
