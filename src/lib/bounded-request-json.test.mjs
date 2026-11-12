import assert from 'node:assert/strict';
import test from 'node:test';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { handleWalletLink } from './wallet-link-bff.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const origin = 'https://app.example.test';
const env = { AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin,
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', AUTH_BFF_SHARED_SECRET: 's'.repeat(32) };
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
function stalled(path, controller = new AbortController()) {
  const started = deferred(), pending = deferred();
  let reads = 0, cancels = 0, releases = 0;
  const reader = { read() { reads++; started.resolve(); return pending.promise; },
    cancel() { cancels++; return new Promise(() => {}); }, releaseLock() { releases++; } };
  const request = { url: `${origin}${path}`, method: 'POST', signal: controller.signal,
    headers: new Headers({ origin, cookie: 'better-auth.session_token=synthetic',
      'content-type': 'application/json', 'sec-fetch-site': 'same-origin', 'x-mindbliss-wallet-network': 'polygon' }),
    body: { getReader: () => reader } };
  return { request, controller, started, pending, counts: () => ({ reads, cancels, releases }) };
}

test('JSON ingestion bounds real UTF-8 bytes across chunks and rejects invalid or oversized bodies', async () => {
  const encoded = new TextEncoder().encode('{"name":"Señor"}');
  const body = new ReadableStream({ start(controller) { controller.enqueue(encoded.slice(0, 11)); controller.enqueue(encoded.slice(11)); controller.close(); } });
  const request = new Request(`${origin}/api/member/wallet-link/challenge`, { method: 'POST', body, duplex: 'half' });
  assert.deepEqual(await readBoundedRequestJson(request, { maxBytes: encoded.length }), { name: 'Señor' });
  const oversized = new Request(origin, { method: 'POST', body: JSON.stringify('é'.repeat(10)) });
  await assert.rejects(readBoundedRequestJson(oversized, { maxBytes: 15 }), { message: 'request_too_large' });
  const malformed = new Request(origin, { method: 'POST', body: new Uint8Array([0xff]) });
  await assert.rejects(readBoundedRequestJson(malformed, { maxBytes: 15 }));
});

test('the body deadline settles even if read and cancel ignore it, and releases the reader', { timeout: 1000 }, async () => {
  const fixture = stalled('/api/member/wallet-link/challenge');
  await assert.rejects(readBoundedRequestJson(fixture.request, { maxBytes: 4096, timeoutMs: 5 }), { message: 'request_body_unavailable' });
  assert.deepEqual(fixture.counts(), { reads: 1, cancels: 1, releases: 1 });
});

test('an invalid UTF-8 prefix cancels the remaining producer without awaiting its cleanup', { timeout: 1000 }, async () => {
  let reads = 0, cancels = 0, releases = 0;
  const request = { headers: new Headers(), body: { getReader: () => ({
    read() { reads++; return Promise.resolve({ done: false, value: new Uint8Array([0xff]) }); },
    cancel() { cancels++; return new Promise(() => {}); }, releaseLock() { releases++; },
  }) } };
  await assert.rejects(readBoundedRequestJson(request, { maxBytes: 4096 }));
  assert.deepEqual({ reads, cancels, releases }, { reads: 1, cancels: 1, releases: 1 });
});

test('cancelled ingestion rejects before reading, or discards later success and rejection without another read', { timeout: 1000 }, async () => {
  const already = stalled('/api/member/wallet-link/challenge'); already.controller.abort();
  await assert.rejects(readBoundedRequestJson(already.request, { maxBytes: 4096 }), { message: 'request_body_unavailable' });
  assert.deepEqual(already.counts(), { reads: 0, cancels: 0, releases: 0 });
  for (const outcome of ['success', 'failure']) {
    const fixture = stalled('/api/member/wallet-link/challenge');
    const pending = readBoundedRequestJson(fixture.request, { maxBytes: 4096 });
    await fixture.started.promise; fixture.controller.abort();
    await assert.rejects(pending, { message: 'request_body_unavailable' });
    if (outcome === 'success') fixture.pending.resolve({ done: false, value: new TextEncoder().encode('{"private":"late"}') });
    else fixture.pending.reject(new Error('private late failure'));
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(fixture.counts(), { reads: 1, cancels: 1, releases: 1 });
  }
});

test('wallet proof and funding bridges settle cancelled bodies without upstream calls, signature requests or late writes', { timeout: 1000 }, async () => {
  const surfaces = [
    ['/api/member/wallet-link/challenge', fixture => handleWalletLink(fixture.request, 'challenge', options), 'wallet_link_unavailable'],
    ['/api/member/wallet-link/confirm', fixture => handleWalletLink(fixture.request, 'confirm', options), 'wallet_link_unavailable'],
    ['/api/member/wallet-funding/personal/intent', fixture => handleWalletFunding(fixture.request, 'personal', options), 'wallet_funding_provider_unavailable'],
  ];
  const options = { env, serviceRequest: async () => assert.fail('Cancelled input must never reach a private mutation') };
  for (const [path, handle, expected] of surfaces) {
    const fixture = stalled(path), pending = handle(fixture);
    await fixture.started.promise; fixture.controller.abort();
    const response = await pending;
    assert.equal(response.status, 503); assert.equal((await response.json()).error, expected);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    fixture.pending.resolve({ done: false, value: new TextEncoder().encode('{}') });
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(fixture.counts(), { reads: 1, cancels: 1, releases: 1 });
  }
});

test('wallet proof and funding bridges retain exact body limits before transport', async () => {
  for (const [kind, limit] of [['link', 4096], ['funding', 2048]]) {
    const request = new Request(`${origin}/api/member/${kind === 'link' ? 'wallet-link/challenge' : 'wallet-funding/personal/intent'}`, {
      method: 'POST', headers: { origin, cookie: 'better-auth.session_token=synthetic', 'content-type': 'application/json',
        'content-length': String(limit + 1), 'x-mindbliss-wallet-network': 'polygon' }, body: '{}',
    });
    const options = { env, serviceRequest: async () => assert.fail('Oversized input reached upstream') };
    const response = await (kind === 'link' ? handleWalletLink(request, 'challenge', options) : handleWalletFunding(request, 'personal', options));
    assert.equal(response.status, 413); assert.equal((await response.json()).error, 'request_too_large');
  }
});
