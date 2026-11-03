import { timingSafeEqual } from 'node:crypto';
import { runtimeEnvironment } from './cloudflare-runtime.mjs';

export const RESEND_WEBHOOK_PATH = '/api/webhooks/resend';
export const RESEND_WEBHOOK_MAX_BYTES = 65536;
export const RESEND_WEBHOOK_TIMEOUT_MS = 8000;
export const RESEND_WEBHOOK_TOLERANCE_SECONDS = 300;
export const RESEND_DELIVERY_TYPES = Object.freeze(['email.sent', 'email.delivered', 'email.delivery_delayed',
  'email.bounced', 'email.complained', 'email.failed', 'email.suppressed']);
const allowedTypes = new Set(RESEND_DELIVERY_TYPES);
const sender = 'otp@mindblisspower.com';
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const reply = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const acknowledged = () => reply(200, { received: true, mode: 'notification_only' });
const unavailable = () => reply(503, { error: 'email_callback_unavailable' });
const invalidSignature = () => reply(401, { error: 'invalid_email_signature' });

// Intercept aliases/suffixes before OpenNext so they cannot execute an SSR page.
// Only the raw canonical path is admitted by the handler below.
export function resendWebhookNamespace(pathname) {
  let path = pathname;
  for (let index = 0; index < 5; index++) {
    if (/^\/api\/webhooks\/resend/i.test(path)) return true;
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) return false;
      path = decoded;
    } catch { return false; }
  }
  return /^\/api\/webhooks\/resend/i.test(path);
}

function base64Bytes(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
    || value.length % 4 === 1 || (value.includes('=') && value.length % 4 !== 0)) return null;
  try {
    const decoded = atob(value);
    if (btoa(decoded).replace(/=+$/, '') !== value.replace(/=+$/, '')) return null;
    return Uint8Array.from(decoded, character => character.charCodeAt(0));
  } catch { return null; }
}

function signingKey(value) {
  if (typeof value !== 'string' || value.length > 512 || !value.startsWith('whsec_')) return null;
  const key = base64Bytes(value.slice(6));
  return key && key.length >= 16 && key.length <= 256 ? key : null;
}

function metadata(headers, now) {
  const id = headers.get('svix-id') || '', timestamp = headers.get('svix-timestamp') || '';
  const supplied = headers.get('svix-signature') || '';
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(id) || !/^[0-9]{1,12}$/.test(timestamp)
    || !Number.isSafeInteger(Number(timestamp)) || String(Number(timestamp)) !== timestamp
    || !freshTimestamp(timestamp, now)
    || !supplied || supplied.length > 1024) return null;
  const signatures = supplied.split(' ');
  if (signatures.length > 8 || signatures.some(value => !/^v[0-9]{1,2},[A-Za-z0-9+/]+={0,2}$/.test(value))) return null;
  const accepted = signatures.filter(value => value.startsWith('v1,')).map(value => base64Bytes(value.slice(3)))
    .filter(value => value?.length === 32);
  return accepted.length ? { id, timestamp, signatures: accepted } : null;
}

function freshTimestamp(timestamp, now) {
  return Number.isFinite(now) && Math.abs(Math.floor(now / 1000) - Number(timestamp)) <= RESEND_WEBHOOK_TOLERANCE_SECONDS;
}

async function rawBytes(stream, signal) {
  const reader = stream?.getReader();
  if (!reader) throw new SyntaxError('missing_body');
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    const chunks = []; let total = 0;
    while (true) {
      if (signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
      const { value, done } = await reader.read();
      if (signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
      if (done) break;
      total += value.byteLength;
      if (total > RESEND_WEBHOOK_MAX_BYTES) { cancel(); throw new RangeError('body_too_large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes;
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

function senderMailbox(value) {
  if (typeof value !== 'string' || value.length > 320 || /[\u0000-\u001f\u007f]/.test(value)) return '';
  const trimmed = value.trim();
  const displayed = /^[^<>@]{1,120}<([^<>]+)>$/.exec(trimmed);
  return (displayed ? displayed[1] : trimmed).trim().toLowerCase();
}

/** Public, signed notification ingress. No account, session, database, external
 * fetch, delivery guarantee or durable/exactly-once processing follows an ACK.
 * @param {Request} request
 * @param {{env?: Record<string, any>, now?: () => number, report?: (event: {event: string, type: string}) => void}} [dependencies]
 */
export async function handleResendWebhook(request, { env = runtimeEnvironment(), now = Date.now,
  report = event => console.info(JSON.stringify(event)) } = {}) {
  const url = new URL(request.url);
  if (url.pathname !== RESEND_WEBHOOK_PATH) return reply(404, { error: 'not_found' });
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) return reply(400, { error: 'invalid_callback_request' });
  if (url.origin !== (env.AUTH_PUBLIC_ORIGIN || 'https://mindblisspower.com')) return reply(421, { error: 'invalid_host' });
  if (request.method !== 'POST') {
    const response = reply(405, { error: 'method_not_allowed' }); response.headers.set('Allow', 'POST'); return response;
  }
  if (env.RESEND_WEBHOOK_ENABLED !== 'true') return unavailable();
  const secret = signingKey(env.RESEND_WEBHOOK_SECRET);
  if (!secret) return unavailable();
  if (request.headers.has('content-encoding') || !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
    return reply(415, { error: 'json_required' });
  }
  const proof = metadata(request.headers, now());
  if (!proof) return invalidSignature();
  const declared = request.headers.get('content-length');
  if (declared !== null && !/^[0-9]{1,10}$/.test(declared)) return reply(400, { error: 'invalid_callback_request' });
  if (declared !== null && Number(declared) > RESEND_WEBHOOK_MAX_BYTES) return reply(413, { error: 'request_too_large' });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(RESEND_WEBHOOK_TIMEOUT_MS)]);
  let bytes;
  try { bytes = await rawBytes(request.body, signal); }
  catch (error) {
    if (signal.aborted) return unavailable();
    return error instanceof RangeError ? reply(413, { error: 'request_too_large' }) : reply(400, { error: 'invalid_callback_request' });
  }
  try {
    // Svix signs id.timestamp.raw-body bytes. Never parse/re-serialize or decode
    // the body before verifying; compare only equal-length SHA-256 signatures.
    const prefix = new TextEncoder().encode(`${proof.id}.${proof.timestamp}.`);
    const signed = new Uint8Array(prefix.length + bytes.length); signed.set(prefix); signed.set(bytes, prefix.length);
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, signed));
    if (signal.aborted) return unavailable();
    if (!proof.signatures.some(value => timingSafeEqual(expected, value))) return invalidSignature();
  } catch { return unavailable(); }
  if (!freshTimestamp(proof.timestamp, now())) return invalidSignature();
  let payload;
  try { payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { return reply(400, { error: 'invalid_callback_request' }); }
  if (!record(payload) || typeof payload.type !== 'string' || payload.type.length > 128) return reply(400, { error: 'invalid_callback_request' });
  if (!allowedTypes.has(payload.type)) return acknowledged();
  if (!record(payload.data) || typeof payload.data.from !== 'string' || payload.data.from.length > 320) return reply(400, { error: 'invalid_callback_request' });
  if (senderMailbox(payload.data.from) !== sender) return acknowledged();
  if (typeof payload.data.email_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.data.email_id)) {
    return reply(400, { error: 'invalid_callback_request' });
  }
  // Replay/retries are harmless: this is optional, non-durable telemetry only.
  // Never log the payload, sender, recipients, subject, provider ID or signature.
  try { report({ event: 'resend_delivery_event', type: payload.type }); } catch { /* No durable side effect was promised. */ }
  return acknowledged();
}
