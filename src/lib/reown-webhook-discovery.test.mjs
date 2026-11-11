import assert from 'node:assert/strict';
import test from 'node:test';
import { discoverReownWebhook } from './reown-webhook-discovery.mjs';
import { __resetRateLimit } from './rate-limit.js';

const origin = 'https://app.mindblisspower.com';
const target = `${origin}/api/webhooks/reown`;
const instant = Date.parse('2026-11-11T04:00:00Z');
const env = { AUTH_PUBLIC_ORIGIN: origin };
const request = (body = '{}', headers = {}, url = target) => new Request(url, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body,
});
const options = logger => ({ env, logger, now: () => instant, limiter: () => ({ allowed: true }) });

test('discovery remains quarantined even with signature-looking headers and configured secret', async () => {
  const entries = [];
  const body = { type: 'user.created', data: { email: 'private@example.invalid', address: `0x${'2'.repeat(40)}`, userId: 'private-owner' },
    'private-key-name@example.invalid': 'private value' };
  const response = await discoverReownWebhook(request(JSON.stringify(body), {
    'x-reown-signature': `sha256=${'a'.repeat(64)}`, authorization: 'Bearer private-token',
    'x-private-sensitive-header': 'private-header-value',
  }), { ...options(entry => entries.push(entry)), env: { ...env, REOWN_WEBHOOK_SECRET: 'private-signing-secret' } });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'reown_webhook_verification_pending' });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].bodyFields, ['type', 'data']);
  assert.deepEqual(entries[0].dataFields, ['email', 'address', 'userId']);
  assert.equal(entries[0].unlistedBodyFieldCount, 1);
  assert.equal(entries[0].mode, 'quarantined');
  assert.equal(entries[0].observedAt, new Date(instant).toISOString());
  assert.deepEqual(entries[0].signatureShapes.find(item => item.name === 'x-reown-signature'), {
    name: 'x-reown-signature', length: 71, shape: 'sha256-equals-hex',
  });
  assert.doesNotMatch(JSON.stringify(entries), /private|0x2222|aaaaaaa|user\.created/);
  assert.doesNotMatch(JSON.stringify(entries), /received|accepted|verified|paid|confirmed/);
});

test('only exact personal HTTPS origin and path may reach discovery, without admin aliases or queries', async () => {
  const logger = () => assert.fail('denied discovery must not emit metadata');
  for (const url of [target + '?projectId=other', 'https://wallet.mindblisspower.com/api/webhooks/reown',
    'https://mindbliss-portal-rewon.devfidubit.workers.dev/api/webhooks/reown', 'http://app.mindblisspower.com/api/webhooks/reown',
    `${origin}/api/webhooks/reown/extra`]) {
    assert.equal((await discoverReownWebhook(request('{}', {}, url), options(logger))).status, 404);
  }
  assert.equal((await discoverReownWebhook(request(), { ...options(logger), env: { AUTH_PUBLIC_ORIGIN: 'https://wallet.mindblisspower.com' } })).status, 404);
  const get = await discoverReownWebhook(new Request(target), options(logger));
  assert.equal(get.status, 405); assert.equal(get.headers.get('allow'), 'POST');
  assert.equal((await discoverReownWebhook(request('{}', { 'content-type': 'text/plain' }), options(logger))).status, 415);
  assert.equal((await discoverReownWebhook(request('{}', { 'content-encoding': 'gzip' }), options(logger))).status, 415);
});

test('declared and streamed byte limits, invalid UTF-8 and malformed JSON fail without logging payloads', async () => {
  const logger = () => assert.fail('invalid discovery must not emit metadata');
  for (const length of ['8193', 'not-a-number', '99999999999']) {
    assert.equal((await discoverReownWebhook(request('{}', { 'content-length': length }), options(logger))).status, 413);
  }
  assert.equal((await discoverReownWebhook(request(JSON.stringify({ data: 'é'.repeat(5000) })), options(logger))).status, 413);
  assert.equal((await discoverReownWebhook(request('{'), options(logger))).status, 503);
  const invalidUtf8 = new Request(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: new Uint8Array([0xff]) });
  assert.equal((await discoverReownWebhook(invalidUtf8, options(logger))).status, 503);
});

test('body deadline and caller cancellation also bound streams that never resolve', async () => {
  const logger = () => assert.fail('cancelled discovery must not emit metadata');
  const body = new ReadableStream({ pull: () => new Promise(() => {}), cancel: () => new Promise(() => {}) });
  const streaming = new Request(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half' });
  assert.equal((await discoverReownWebhook(streaming, { ...options(logger), timeoutMs: 5 })).status, 503);
  const controller = new AbortController(); controller.abort();
  const aborted = new Request(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', signal: controller.signal });
  assert.equal((await discoverReownWebhook(aborted, options(logger))).status, 503);
});

test('diagnostic rate limits fail closed and reset only after the isolate-local window', async () => {
  __resetRateLimit();
  let logged = 0;
  for (let index = 0; index < 10; index++) {
    assert.equal((await discoverReownWebhook(request(), { env, now: () => instant, logger: () => logged++ })).status, 503);
  }
  const capped = await discoverReownWebhook(request(), { env, now: () => instant, logger: () => logged++ });
  assert.equal(capped.status, 429); assert.equal(capped.headers.get('retry-after'), '60'); assert.equal(logged, 10);
  assert.equal((await discoverReownWebhook(request(), { env, now: () => instant + 60_001, logger: () => logged++ })).status, 503);
  assert.equal(logged, 11);
  const failure = await discoverReownWebhook(request(), { ...options(() => assert.fail('limiter failure cannot log')),
    limiter: () => { throw Error('private limiter failure'); } });
  assert.equal(failure.status, 503);
  assert.doesNotMatch(await failure.text(), /private/);
  __resetRateLimit();
});

test('body envelope discovery logs field names only, including arrays, and never validates any signature scheme', async () => {
  const entries = [];
  for (const body of [[{ eventType: 'private-event', payload: 'private-payload' }], null, true]) {
    const response = await discoverReownWebhook(request(JSON.stringify(body), {
      'webhook-signature': 'v1,cHJpdmF0ZQ==', 'webhook-id': 'private-event-id',
    }), options(entry => entries.push(entry)));
    assert.equal(response.status, 503);
  }
  assert.equal(entries[0].bodyKind, 'array');
  assert.deepEqual(entries[0].firstItemFields, ['eventType', 'payload']);
  assert.equal(entries[1].bodyKind, 'null'); assert.equal(entries[2].bodyKind, 'boolean');
  assert.doesNotMatch(JSON.stringify(entries), /private|cHJpdmF0ZQ/);
  assert.ok(entries.every(entry => entry.signatureShapes[0].shape === 'v1-comma-base64'));
});
