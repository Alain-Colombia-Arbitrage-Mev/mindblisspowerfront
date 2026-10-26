import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';

const headers = { 'Cache-Control': 'private, no-store' };
const reply = (body, status) => Response.json(body, { status, headers });
const callbackURL = 'https://payments.core.internal/api/webhooks/nowpayments';
const receiptStates = new Set(['invoice_created', 'invoice_unknown', 'pending_review']);
const jsonContent = value => /^application\/json(?:\s*;|$)/i.test(value || '');

async function readBytes(stream, signal, maxBytes) {
  const reader = stream?.getReader();
  if (!reader) throw new Error('missing_body');
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    const chunks = []; let total = 0;
    while (true) {
      if (signal.aborted) throw new Error('request_cancelled');
      const { value, done } = await reader.read();
      if (signal.aborted) throw new Error('request_cancelled');
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { void reader.cancel().catch(() => {}); throw new RangeError('body_too_large'); }
      chunks.push(value);
    }
    const body = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return body;
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

function parseObject(bytes) {
  const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_json');
  return body;
}

/**
 * Public provider callback, not a member mutation. No browser session/origin is
 * trusted; Go verifies the IPN HMAC and authoritative payment before persisting.
 * This narrow ingress flag does not bypass Core's financial write protection.
 */
export async function handleNOWPaymentsWebhook(request, { env = runtimeEnvironment(), fetchImpl = coreFetch } = {}) {
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  if (env.NOWPAYMENTS_WEBHOOK_ENABLED !== 'true') return reply({ error: 'payment_callback_unavailable' }, 503);
  if (!jsonContent(request.headers.get('content-type'))) return reply({ error: 'json_required' }, 415);
  const signature = request.headers.get('x-nowpayments-sig') || '';
  if (!/^[a-f0-9]{128}$/i.test(signature)) return reply({ error: 'invalid_payment_signature' }, 401);
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > 131072) return reply({ error: 'request_too_large' }, 413);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(5000)]);
  let body;
  try {
    body = await readBytes(request.body, signal, 131072);
    // Validation never changes the bytes covered by the provider's HMAC.
    parseObject(body);
  } catch (error) {
    return reply({ error: signal.aborted ? 'payment_callback_unavailable' : error instanceof RangeError ? 'request_too_large' : 'invalid_json' },
      signal.aborted ? 503 : error instanceof RangeError ? 413 : 400);
  }
  try {
    const upstream = await fetchImpl(callbackURL, {
      method: 'POST', redirect: 'manual', cache: 'no-store', signal,
      headers: { 'content-type': 'application/json', 'x-nowpayments-sig': signature,
        ...(env.PAYMENTS_SERVICE_TOKEN ? { 'X-VP-Service-Token': env.PAYMENTS_SERVICE_TOKEN } : {}) },
      body,
    });
    // A non-success may represent a rejected signature or a retriable backend
    // outage. Never turn either into a provider acknowledgement.
    if (upstream.status !== 200) {
      void upstream.body?.cancel().catch(() => {});
      const status = [400, 401, 403, 404, 409, 413, 415, 422, 429].includes(upstream.status) ? upstream.status : 503;
      return reply({ error: 'payment_callback_rejected' }, status);
    }
    if (!jsonContent(upstream.headers.get('content-type'))) {
      void upstream.body?.cancel().catch(() => {});
      return reply({ error: 'payment_callback_unavailable' }, 503);
    }
    const ack = parseObject(await readBytes(upstream.body, signal, 4096));
    if (ack.received !== true || ack.fulfillment_status !== 'review_required' || !receiptStates.has(ack.state)) {
      return reply({ error: 'payment_callback_unavailable' }, 503);
    }
    return reply({ received: true, state: ack.state, fulfillment_status: 'review_required' }, 200);
  } catch { return reply({ error: 'payment_callback_unavailable' }, 503); }
}
