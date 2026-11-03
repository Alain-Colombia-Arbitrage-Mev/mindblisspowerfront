import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { handleResendWebhook, resendWebhookNamespace, RESEND_DELIVERY_TYPES, RESEND_WEBHOOK_MAX_BYTES,
  RESEND_WEBHOOK_TIMEOUT_MS } from './resend-webhook.mjs';
import * as runtime from './cloudflare-runtime.mjs';
import * as guard from './cloudflare-portal-guard.mjs';
import * as webhook from './resend-webhook.mjs';

const origin = 'https://mindblisspower.com', path = '/api/webhooks/resend';
const seconds = 1793654400, now = () => seconds * 1000;
const key = Buffer.from('synthetic-resend-webhook-key-not-real');
const env = { AUTH_PUBLIC_ORIGIN: origin, RESEND_WEBHOOK_ENABLED: 'true', RESEND_WEBHOOK_SECRET: `whsec_${key.toString('base64')}` };
const event = { type: 'email.delivered', created_at: '2026-11-03T00:00:00.000Z', data: {
  email_id: '00000000-0000-4000-8000-000000000071', from: 'otp@mindblisspower.com',
  to: ['synthetic-private-recipient@example.test'], subject: 'private OTP 012345', private: 'must-not-log',
} };
const raw = JSON.stringify(event), id = 'msg_synthetic_resend_01';
// Synthetic examples following the official per-event references, NOT captured
// provider deliveries or a claim that the production signing key is configured.
// https://resend.com/docs/webhooks/event-types
const documentedDeliveryShapes = {
  'email.sent': {},
  'email.delivered': {},
  'email.delivery_delayed': {},
  'email.bounced': { bounce: { diagnosticCode: ['smtp; 550 synthetic mailbox unavailable'],
    message: 'Synthetic private bounce detail', subType: 'MessageRejected', type: 'Permanent' } },
  'email.complained': {},
  'email.failed': { failed: { reason: 'reached_daily_quota' } },
  'email.suppressed': { suppressed: { message: 'Synthetic private suppression detail', type: 'OnAccountSuppressionList' } },
};
function documentedDelivery(type, extraData = {}) {
  return { type, created_at: '2026-02-22T23:41:12.126Z', data: {
    broadcast_id: '00000000-0000-4000-8000-000000000072', created_at: '2026-02-22T23:41:11.894719+00:00',
    email_id: event.data.email_id, message_id: '<synthetic-private-message@example.test>',
    from: 'Mindbliss Power <otp@mindblisspower.com>', to: ['synthetic-private-recipient@example.test'],
    subject: 'Código privado de autenticación 012345', template_id: '00000000-0000-4000-8000-000000000073',
    tags: { category: 'confirm_email', user_id: 'synthetic-private-user' },
    ...documentedDeliveryShapes[type], ...extraData,
  } };
}
const sign = (body, timestamp = String(seconds), messageId = id, secret = key) =>
  `v1,${createHmac('sha256', secret).update(`${messageId}.${timestamp}.`).update(body).digest('base64')}`;
function request(body = raw, { headers = {}, method = 'POST', url = `${origin}${path}`, timestamp = String(seconds), messageId = id,
  signature = sign(body, timestamp, messageId), signal } = {}) {
  return new Request(url, { method, signal, headers: { 'content-type': 'application/json', 'svix-id': messageId,
    'svix-timestamp': timestamp, 'svix-signature': signature, ...headers }, ...(['GET', 'HEAD'].includes(method) ? {} : { body }) });
}
const run = (req = request(), dependencies = {}) => handleResendWebhook(req, { env, now, report() {}, ...dependencies });
async function ack(response) {
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { received: true, mode: 'notification_only' });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  for (const name of ['set-cookie', 'location', 'access-control-allow-origin']) assert.equal(response.headers.get(name), null);
}

test('official Svix published known vector passes cryptographic verification before application payload validation', async () => {
  // https://docs.svix.com/receiving/verifying-payloads/how-manual#example-signatures
  // Public documentation fixture, not a production credential.
  const body = '{"event_type":"ping","data":{"success":true}}';
  const headers = { timestamp: '1731705121', messageId: 'msg_loFOjxBNrRLzqYUf',
    signature: 'v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=' };
  const configuration = { ...env, RESEND_WEBHOOK_SECRET: 'whsec_plJ3nmyCDGBKInavdOK15jsl' };
  const options = { env: configuration, now: () => 1731705121000 };
  const valid = await run(request(body, headers), options);
  assert.equal(valid.status, 400, 'known HMAC succeeds, but this ping is not a Resend event payload');
  assert.deepEqual(await valid.json(), { error: 'invalid_callback_request' });
  assert.equal((await run(request(`${body} `, headers), options)).status, 401, 'one changed raw byte invalidates the official signature');
});

test('each allowed event produces only a reviewed notification diagnostic, never account proof or durable processing', async () => {
  for (const type of RESEND_DELIVERY_TYPES) {
    const events = [], payload = JSON.stringify({ ...event, type });
    await ack(await run(request(payload), { report: value => events.push(value) }));
    assert.deepEqual(events, [{ event: 'resend_delivery_event', type }]);
    assert.doesNotMatch(JSON.stringify(events), /012345|private|recipient|email_id|00000000|otp@|msg_/);
  }
  assert.equal(RESEND_DELIVERY_TYPES.length, 7); assert.equal(Object.isFrozen(RESEND_DELIVERY_TYPES), true);
});

test('all seven documented Resend delivery shapes accept approved display-name sender without exposing event-specific data', async () => {
  assert.deepEqual([...RESEND_DELIVERY_TYPES].sort(), Object.keys(documentedDeliveryShapes).sort());
  for (const type of Object.keys(documentedDeliveryShapes)) {
    const diagnostics = [], payload = documentedDelivery(type), body = JSON.stringify(payload, null, 2);
    assert.ok(new Date(payload.created_at).getTime() < now() - 300000, 'fixture event is intentionally historical');
    await ack(await run(request(body), { report: value => diagnostics.push(value) }));
    assert.deepEqual(diagnostics, [{ event: 'resend_delivery_event', type }]);
    assert.deepEqual(Object.keys(diagnostics[0]), ['event', 'type']);
    assert.doesNotMatch(JSON.stringify(diagnostics), /012345|private|example\.test|email_id|00000000|otp@|smtp|quota|Suppression|confirm_email/);
  }
});

test('provider retries may re-sign historical events, but replaying old signed bytes does not renew their freshness', async () => {
  // Resend is at-least-once and may replay failed OR succeeded deliveries.
  // created_at is event metadata; svix-timestamp authenticates this attempt.
  const body = JSON.stringify(documentedDelivery('email.delivered')), diagnostics = [];
  const report = value => diagnostics.push(value), retrySeconds = seconds + 301;
  const later = { now: () => retrySeconds * 1000, report };
  await ack(await run(request(body), { report }));
  await ack(await run(request(body), { report }));
  assert.equal((await run(request(body), later)).status, 401, 'old authentic signature has expired');
  assert.equal((await run(request(body, { timestamp: String(retrySeconds), signature: sign(body) }), later)).status, 401,
    'changing only the timestamp cannot refresh the signature');
  await ack(await run(request(body, { timestamp: String(retrySeconds) }), later));
  assert.deepEqual(diagnostics, Array.from({ length: 3 }, () => ({ event: 'resend_delivery_event', type: 'email.delivered' })),
    'duplicates have no auth, durable-processing, deduplication or exactly-once claims');
  // Events can arrive out of order; no mutable delivery/account status is derived.
  await ack(await run(request(JSON.stringify(documentedDelivery('email.sent'))), { report }));
  assert.deepEqual(diagnostics.at(-1), { event: 'resend_delivery_event', type: 'email.sent' });
});

test('raw UTF-8 bytes survive fragmented transport and case-insensitive Svix headers without JSON normalization', async () => {
  const body = ` ${JSON.stringify(documentedDelivery('email.delivered'), null, 2)}\r\n`, bytes = new TextEncoder().encode(body);
  const req = request(bytes), stream = new ReadableStream({
    start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); },
  });
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Svix-Id': id,
    'Svix-Timestamp': String(seconds), 'Svix-Signature': sign(bytes) });
  await ack(await run({ url: req.url, method: req.method, headers, signal: req.signal, body: stream,
    json() { assert.fail('receiver parsed the request before validating raw bytes'); },
    text() { assert.fail('receiver normalized the original UTF-8 transport'); },
  }));
  const normalized = JSON.stringify(JSON.parse(body));
  assert.equal((await run(request(normalized, { signature: sign(bytes) }))).status, 401);
  const changedData = body.replace('012345', '654321');
  assert.equal((await run(request(changedData, { signature: sign(bytes) }))).status, 401);
});

test('default diagnostics remain enum-only and notification receipt never fetches, creates a session or proves OTP possession', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('notification attempted external delivery, auth or database transport'));
  const logs = [];
  t.mock.method(console, 'info', (...values) => logs.push(values));
  const isolated = { ...env, CORE_API: { fetch() { assert.fail('notification reached Core'); } } };
  for (const name of ['RESEND_API_KEY', 'AUTH_DATABASE_URL', 'DATABASE_URL', 'BETTER_AUTH_SECRET', 'HYPERDRIVE_MEMBER_FRESH']) {
    Object.defineProperty(isolated, name, { get() { assert.fail(`notification accessed ${name}`); } });
  }
  const body = JSON.stringify(documentedDelivery('email.delivered'));
  const response = await handleResendWebhook(request(body), { env: isolated, now });
  await ack(response);
  assert.deepEqual(logs, [[JSON.stringify({ event: 'resend_delivery_event', type: 'email.delivered' })]]);
  assert.doesNotMatch(JSON.stringify(logs), /verified|session|012345|private|example\.test|00000000|otp@|msg_/);
});

test('documented inbound attachment metadata, tracking and unknown signed events are ignored, never account verification', async () => {
  const inbound = { type: 'email.received', created_at: '2026-02-22T23:41:12.126Z', data: {
    email_id: event.data.email_id, created_at: '2026-02-22T23:41:11.894Z', from: 'otp@mindblisspower.com',
    to: ['synthetic-private-recipient@example.test'], bcc: [], cc: [], received_for: ['forwarded@example.test'],
    message_id: '<synthetic-private-message@example.test>', subject: 'Synthetic private OTP 012345',
    attachments: [{ id: '00000000-0000-4000-8000-000000000074', filename: 'private.png', content_type: 'image/png',
      content_disposition: 'inline', content_id: 'private-image' }],
  } };
  const diagnostics = [];
  for (const payload of [inbound, { ...inbound, type: 'inbox.email.received' },
    { ...inbound, type: 'email.opened' }, { ...inbound, type: 'email.clicked' }, { type: 'future.synthetic_event' },
    documentedDelivery('email.delivered', { from: 'Other Brand <otp@other.example.test>' })]) {
    const body = JSON.stringify(payload);
    await ack(await run(request(body), { report: value => diagnostics.push(value) }));
    assert.equal((await run(request(body, { signature: sign(`${body} `) }))).status, 401,
      'ignored event types must still prove provider signature');
  }
  assert.deepEqual(diagnostics, []);
});

test('configuration is default-closed and does not read a body, a dormant secret or any account/provider credentials', async () => {
  const untouched = { url: `${origin}${path}`, method: 'POST', get headers() { assert.fail('unconfigured request read headers'); },
    get body() { assert.fail('unconfigured request read body'); } };
  for (const enabled of [undefined, 'false', true, 'TRUE', '1']) {
    const configuration = { AUTH_PUBLIC_ORIGIN: origin, RESEND_WEBHOOK_ENABLED: enabled,
      get RESEND_WEBHOOK_SECRET() { assert.fail('disabled secret was read'); } };
    assert.equal((await run(untouched, { env: configuration })).status, 503);
  }
  for (const value of [undefined, '', 're_synthetic', 'f8cfa476-7441-41e6-bd4a-3122c288837b', 'whsec_bad', `whsec_${'a'.repeat(600)}`,
    'whsec_!!invalid', 'whsec_YQ==', `${env.RESEND_WEBHOOK_SECRET}\n`]) {
    assert.equal((await run(untouched, { env: { ...env, RESEND_WEBHOOK_SECRET: value } })).status, 503);
  }
  const isolated = { ...env };
  for (const field of ['RESEND_API_KEY', 'CLOUDFLARE_EMAIL_API_TOKEN', 'AUTH_DATABASE_URL', 'DATABASE_URL', 'CORE_API', 'HYPERDRIVE_MEMBER_FRESH', 'AUTH_BFF_SHARED_SECRET']) {
    Object.defineProperty(isolated, field, { get() { assert.fail(`receiver accessed unrelated ${field}`); } });
  }
  await ack(await run(request(), { env: isolated }));
});

test('signature verification covers exact raw bytes, metadata and all safe rotation candidates without normalizing JSON', async () => {
  const spaced = ` {\n "type": "email.delivered", "data": ${JSON.stringify(event.data)}, "amount": 101.00\n}`;
  await ack(await run(request(spaced)));
  assert.equal((await run(request(JSON.stringify(JSON.parse(spaced)), { signature: sign(spaced) }))).status, 401);
  assert.equal((await run(request(raw, { signature: sign(raw, String(seconds), 'msg_other') }))).status, 401);
  const forged = sign(raw, String(seconds), id, Buffer.from('different-synthetic-key-at-least-16'));
  await ack(await run(request(raw, { signature: `${forged} v2,YWJj ${sign(raw)}` })));
  assert.equal((await run(request(raw, { signature: forged }))).status, 401);
  assert.equal((await run(request(raw, { signature: 'v2,YWJj' }))).status, 401);
});

test('timestamps enforce both sides of the five-minute window and recheck freshness after body/HMAC work', async () => {
  for (const delta of [-300, 300]) await ack(await run(request(raw, { timestamp: String(seconds + delta) })));
  for (const delta of [-301, 301]) assert.equal((await run(request(raw, { timestamp: String(seconds + delta) }))).status, 401);
  let calls = 0;
  assert.equal((await run(request(), { now: () => (++calls === 1 ? seconds : seconds + 301) * 1000 })).status, 401);
  for (const timestamp of ['0x123', `${seconds}.1`, `0${seconds}`, '-1', 'Infinity', 'NaN', '1'.repeat(13), '']) {
    assert.equal((await run(request(raw, { timestamp }))).status, 401);
  }
});

test('missing, malformed and oversized Svix headers fail without trusting cookies, Origin or browser bearer tokens', async () => {
  for (const headers of [{ 'svix-id': '' }, { 'svix-id': 'x'.repeat(201) }, { 'svix-id': 'msg_one,msg_two' },
    { 'svix-signature': '' }, { 'svix-signature': `v1,${'a'.repeat(1024)}` }, { 'svix-signature': Array(9).fill(sign(raw)).join(' ') },
    { 'svix-signature': 'v1,not+base64!!!!' }, { 'svix-signature': 'v1,YQ==' }, { 'svix-signature': sign(raw).replace(/=$/, '=A') }]) {
    assert.equal((await run(request(raw, { headers }))).status, 401);
  }
  await ack(await run(request(raw, { headers: { cookie: 'private-session', origin: 'https://other.example.test',
    authorization: 'Bearer private-browser-token', 'x-forwarded-host': 'attacker.example.test' } })));
});

test('method, actual URL, MIME and encoding gates cannot be bypassed or redirect to another route', async () => {
  const method = await run(request(raw, { method: 'GET' })); assert.equal(method.status, 405); assert.equal(method.headers.get('allow'), 'POST');
  for (const url of [`${origin}${path}?id=private`, `http://mindblisspower.com${path}`]) assert.equal((await run(request(raw, { url }))).status, 400);
  assert.equal((await run(request(raw, { url: `https://attacker.example.test${path}` }))).status, 421);
  for (const suffix of ['/', '/anything', '.css', '.json']) assert.equal((await run(request(raw, { url: `${origin}${path}${suffix}` }))).status, 404);
  for (const headers of [{ 'content-type': 'text/plain' }, { 'content-encoding': 'gzip' }, { 'content-encoding': 'identity' }]) {
    assert.equal((await run(request(raw, { headers }))).status, 415);
  }
});

test('actual raw stream bytes enforce the 64KiB limit even with absent or dishonest Content-Length', async () => {
  assert.equal(RESEND_WEBHOOK_MAX_BYTES, 65536);
  const oversized = ' '.repeat(65537);
  for (const headers of [{}, { 'content-length': '1' }]) assert.equal((await run(request(oversized, { headers }))).status, 413);
  assert.equal((await run(request(raw, { headers: { 'content-length': '65537' } }))).status, 413);
  assert.equal((await run(request(raw, { headers: { 'content-length': 'invalid' } }))).status, 400);
  // Signature can be valid for invalid JSON/UTF-8; neither becomes an ACK.
  for (const invalid of ['null', '[]', 'not-json', new Uint8Array([255])]) assert.equal((await run(request(invalid))).status, 400);
});

test('request cancellation bounds a stalled body and its eight-second timeout never claims a successful notification', async t => {
  const timeout = AbortSignal.timeout.bind(AbortSignal), deadlines = [];
  t.mock.method(AbortSignal, 'timeout', value => { deadlines.push(value); return timeout(value); });
  const controller = new AbortController();
  const stream = new ReadableStream({ start() { queueMicrotask(() => controller.abort()); } });
  const req = request(raw, { signal: controller.signal });
  const response = await run({ ...req, url: req.url, method: req.method, headers: req.headers, signal: controller.signal, body: stream });
  assert.equal(response.status, 503); assert.equal(RESEND_WEBHOOK_TIMEOUT_MS, 8000); assert.deepEqual(deadlines, [8000]);
  assert.doesNotMatch(await response.text(), /received/);
});

test('only reviewed sender and UUID metadata reach diagnostics; signed unrelated/inbound events are harmlessly ignored', async () => {
  const events = [];
  for (const payload of [{ ...event, type: 'email.received' }, { ...event, type: 'contact.created' },
    { ...event, data: { ...event.data, from: 'other@example.test' } },
    { ...event, data: { ...event.data, from: 'otp@mindblisspower.com.attacker.example' } }]) {
    await ack(await run(request(JSON.stringify(payload)), { report: value => events.push(value) }));
  }
  assert.deepEqual(events, []);
  await ack(await run(request(JSON.stringify({ ...event, data: { ...event.data, from: 'Mindbliss Power <OTP@MINDBLISSPOWER.COM>' } })), { report: value => events.push(value) }));
  assert.deepEqual(events, [{ event: 'resend_delivery_event', type: 'email.delivered' }]);
  for (const payload of [{ ...event, data: null }, { ...event, data: { from: 'otp@mindblisspower.com' } },
    { ...event, data: { ...event.data, email_id: 'invalid' } }]) assert.equal((await run(request(JSON.stringify(payload)))).status, 400);
  await ack(await run(request(), { report() { throw new Error('private logging-sink detail'); } }));
});

function loadModule(filename, mocks) {
  const source = readFileSync(new URL(filename, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected dependency: ${name}`); return mocks[name];
  }, module, module.exports);
  return module.exports;
}

test('Next adapter delegates to the exact same bounded handler and remains explicitly dynamic', async () => {
  const calls = [], adapted = loadModule('../app/api/webhooks/resend/route.js', { '@/lib/resend-webhook.mjs': {
    handleResendWebhook: async request => { calls.push(request); return Response.json({ received: true, mode: 'notification_only' }); },
  } });
  assert.equal(adapted.runtime, 'nodejs'); assert.equal(adapted.dynamic, 'force-dynamic');
  const req = request(); assert.equal((await adapted.POST(req)).status, 200); assert.deepEqual(calls, [req]);
});

test('Worker intercepts canonical, encoded and suffix namespace requests before any Next/Core/database/auth action', async () => {
  const configuration = { ...env, CLOUDFLARE_DEPLOYMENT_READY: 'true', AUTH_PROVIDER: 'better-auth',
    MEMBER_DB_PROVIDER: 'hyperdrive', MEMBER_DB_QUERY_CACHE_DISABLED: 'true', HYPERDRIVE_MEMBER_FRESH: { connectionString: 'synthetic-not-used' },
    CORE_API: { fetch() { assert.fail('notification reached Core'); } } };
  const worker = loadModule('../../cloudflare-worker.mjs', {
    './.open-next/worker.js': { default: { fetch() { assert.fail('notification reached Next'); } } },
    './src/lib/cloudflare-runtime.mjs': { ...runtime, runCloudflareRequest() { assert.fail('notification created a scoped Next/DB request'); } },
    './src/lib/cloudflare-portal-guard.mjs': guard,
    './src/lib/resend-webhook.mjs': { ...webhook, handleResendWebhook: (request, { env }) => run(request, { env }) },
  }).default;
  const response = await worker.fetch(request(), configuration, {}); await ack(response);
  for (const alternate of ['/api/webhooks/resend/', '/api/webhooks/resend.css', '/api/webhooks/re%73end', '/%61pi/webhooks/resend',
    '/%2561pi/webhooks/re%2573end', '/API/WEBHOOKS/RESEND', '/api/webhooks/resender']) {
    assert.equal(resendWebhookNamespace(new URL(`${origin}${alternate}`).pathname), true);
    const response = await worker.fetch(request(raw, { url: `${origin}${alternate}` }), configuration, {});
    assert.equal(response.status, 404); assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
  }
  assert.equal((await worker.fetch(request(raw, { url: `https://other.example.test${path}` }), configuration, {})).status, 421);
  assert.equal((await worker.fetch(request(), { ...configuration, RESEND_WEBHOOK_ENABLED: 'false' }, {})).status, 503);
});
