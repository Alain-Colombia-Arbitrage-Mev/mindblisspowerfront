import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { rateLimit } from './rate-limit.js';
import { runtimeEnvironment } from './cloudflare-runtime.mjs';

const ORIGIN = 'https://app.mindblisspower.com';
const PATH = '/api/webhooks/reown';
const MAX_BYTES = 8192;
const HEADER_NAMES = new Set(['content-type', 'user-agent', 'authorization', 'signature', 'signature-input', 'digest',
  'reown-signature', 'reown-timestamp', 'x-reown-signature', 'x-reown-timestamp', 'x-signature', 'x-timestamp',
  'webhook-id', 'webhook-signature', 'webhook-timestamp', 'x-webhook-id', 'x-webhook-signature', 'x-webhook-timestamp',
  'svix-id', 'svix-signature', 'svix-timestamp', 'x-event-id', 'x-request-id']);
const FIELD_NAMES = new Set(['id', 'event', 'eventId', 'eventType', 'type', 'data', 'payload', 'timestamp', 'createdAt',
  'projectId', 'project_id', 'userId', 'user_id', 'user', 'account', 'accountId', 'wallet', 'walletId', 'address',
  'email', 'metadata', 'action', 'version', 'status', 'chainId', 'chain_id', 'sessionId', 'session_id']);
const reply = (error, status, extra = {}) => Response.json({ error }, { status,
  headers: { 'Cache-Control': 'private, no-store', ...extra } });
const invalid = () => new Error('invalid_webhook_request');
const record = value => value && typeof value === 'object' && !Array.isArray(value);

function shape(value) {
  if (/^sha256=[a-f0-9]{64}$/i.test(value)) return 'sha256-equals-hex';
  if (/^v1,[A-Za-z0-9+/]+={0,2}(?:\s+v1,[A-Za-z0-9+/]+={0,2})*$/.test(value)) return 'v1-comma-base64';
  if (/^Bearer\s+\S+$/i.test(value)) return 'bearer';
  if (/^[a-f0-9]{64}$/i.test(value)) return 'hex64';
  return 'unclassified';
}

function metadata(request, body, bytes, now) {
  const names = [...request.headers.keys()];
  const headerNames = names.filter(name => HEADER_NAMES.has(name));
  const signatureShapes = headerNames.filter(name => /signature|authorization|digest/.test(name)).map(name => {
    const value = request.headers.get(name) || '';
    return { name, length: Math.min(value.length, 16384), shape: value.length <= 16384 ? shape(value) : 'oversized' };
  });
  const fields = value => record(value) ? Object.keys(value).filter(key => FIELD_NAMES.has(key)) : [];
  return { event: 'reown_webhook_protocol_discovery', mode: 'quarantined', observedAt: new Date(now).toISOString(),
    headerNames, unlistedHeaderCount: names.length - headerNames.length, signatureShapes,
    bodyBytes: bytes, bodyKind: body === null ? 'null' : Array.isArray(body) ? 'array' : typeof body,
    bodyFields: fields(body), unlistedBodyFieldCount: record(body) ? Object.keys(body).length - fields(body).length : 0,
    ...(record(body) && record(body.data) ? { dataFields: fields(body.data) } : {}),
    ...(record(body) && record(body.payload) ? { payloadFields: fields(body.payload) } : {}),
    ...(Array.isArray(body) ? { arrayLength: body.length, firstItemFields: fields(body[0]) } : {}) };
}

async function bodyMetadata(request, timeoutMs) {
  if (request.signal?.aborted) throw invalid();
  const reader = request.body?.getReader();
  if (!reader) throw invalid();
  const deadline = browserRequestDeadline(request.signal, timeoutMs);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let raw = '', bytes = 0, stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try { void Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* no payload diagnostics */ }
  };
  deadline.signal.addEventListener('abort', stop, { once: true });
  /** @returns {Promise<ReadableStreamReadResult<Uint8Array>>} */
  const read = () => new Promise((resolve, reject) => {
    let settled = false;
    const finish = (operation, value) => { if (settled) return; settled = true; deadline.signal.removeEventListener('abort', abort); operation(value); };
    const abort = () => finish(reject, invalid());
    if (deadline.signal.aborted) return abort();
    deadline.signal.addEventListener('abort', abort, { once: true });
    Promise.resolve().then(() => {
      if (deadline.signal.aborted) throw invalid();
      return reader.read();
    }).then(value => finish(resolve, value), () => finish(reject, invalid()));
  });
  try {
    for (;;) {
      const part = await read();
      if (deadline.signal.aborted) throw invalid();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_BYTES) { stop(); throw new RangeError('request_too_large'); }
      raw += decoder.decode(part.value, { stream: true });
    }
    const body = JSON.parse(raw + decoder.decode());
    return { body, bytes };
  } catch (error) {
    stop();
    throw error;
  } finally {
    deadline.signal.removeEventListener('abort', stop); deadline.dispose();
    try { reader.releaseLock(); } catch { /* a timed-out read may still be settling */ }
  }
}

/** Temporary fail-closed protocol discovery. It never verifies, accepts or applies an event. */
export async function discoverReownWebhook(request, { env = runtimeEnvironment(), limiter = rateLimit,
  logger = entry => console.warn(JSON.stringify(entry)), now = Date.now, timeoutMs = 4000 } = {}) {
  const url = new URL(request.url);
  if (env.AUTH_PUBLIC_ORIGIN !== ORIGIN || url.origin !== ORIGIN || url.pathname !== PATH || url.search || url.hash
    || url.username || url.password) return reply('not_found', 404);
  if (request.method !== 'POST') return reply('method_not_allowed', 405, { Allow: 'POST' });
  if (request.headers.has('content-encoding') || !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return reply('json_required', 415);
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d{1,10}$/.test(length) || Number(length) > MAX_BYTES)) return reply('request_too_large', 413);
  try {
    const instant = now();
    if (!Number.isFinite(instant)) throw invalid();
    const limit = limiter([{ key: 'reown-webhook-protocol-discovery', limit: 10, windowMs: 60_000 }], instant);
    if (!limit || limit.allowed !== true) return reply('rate_limited', 429, { 'Retry-After': '60' });
    const { body, bytes } = await bodyMetadata(request, timeoutMs);
    // Restrict names to known structural identifiers. Raw payloads, arbitrary
    // keys, header values, credentials and signatures never reach the logger.
    logger(metadata(request, body, bytes, instant));
    return reply('reown_webhook_verification_pending', 503);
  } catch (error) {
    if (error instanceof RangeError && error.message === 'request_too_large') return reply('request_too_large', 413);
    return reply('reown_webhook_verification_pending', 503);
  }
}
