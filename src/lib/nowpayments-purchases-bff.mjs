import { memberMutationError } from './member-mutation-policy.mjs';
import { nowpaymentsOrderId } from './nowpayments-receipt.mjs';
import { nowpaymentsPurchases, nowpaymentsResume, nowpaymentsCancellation } from './nowpayments-purchases.mjs';

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } });
const paths = new Map([['history', '/api/payments/nowpayments/purchases'], ['resume', '/api/payments/nowpayments/purchases/resume'],
  ['cancel', '/api/payments/nowpayments/purchases/cancel']]);
const safeErrors = new Set(['purchase_not_found', 'purchase_cannot_cancel', 'purchase_cannot_resume', 'membership_payment_pending_review',
  'membership_purchase_already_processed', 'unauthenticated', 'invalid_id_token', 'upstream_unavailable']);

async function boundedJSON(response, signal, limit) {
  if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw new Error('invalid_content');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('missing_body');
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    const chunks = []; let size = 0;
    while (true) {
      if (signal.aborted) throw new Error('cancelled');
      const { done, value } = await reader.read();
      if (signal.aborted) throw new Error('cancelled');
      if (done) break;
      size += value.byteLength;
      if (size > limit) { cancel(); throw new Error('oversized_body'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

export async function handleNOWPaymentsPurchases(request, { action, env, identity, fetchImpl }) {
  const target = paths.get(action), mutation = action !== 'history';
  if (!target || request.method !== (mutation ? 'POST' : 'GET')) return reply({ error: 'method_not_allowed' }, 405);
  const url = new URL(request.url);
  if (url.search) return reply({ error: 'invalid_request' }, 400);
  const denied = mutation ? memberMutationError(request, env) : null;
  if (denied) return reply({ error: denied.error }, denied.status);
  if (!env.PAYMENTS_SERVICE_TOKEN) return reply({ error: 'purchases_unavailable' }, 503);
  let verified;
  try { verified = await identity(); } catch { return reply({ error: 'purchases_unavailable' }, 503); }
  const claims = verified?.claims;
  if (!verified?.token || claims?.email_verified !== true || typeof claims.sub !== 'string' || !claims.sub.trim()
      || typeof claims.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email)
      || !nowpaymentsOrderId(claims.person_public_id)) return reply({ error: 'unauthenticated' }, 401);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(10000)]);
  let orderId = '';
  if (mutation) {
    try {
      const body = await boundedJSON(request, signal, 1024);
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1
          || !nowpaymentsOrderId(body.order_id)) return reply({ error: 'invalid_order' }, 400);
      orderId = body.order_id;
    } catch { return reply({ error: 'invalid_request' }, 400); }
  }
  try {
    const upstream = await fetchImpl(`https://payments.core.internal${target}`, { method: mutation ? 'POST' : 'GET',
      redirect: 'manual', cache: 'no-store', signal,
      headers: { 'X-VP-Service-Token': env.PAYMENTS_SERVICE_TOKEN, 'X-VP-Id-Token': verified.token,
        ...(mutation ? { 'content-type': 'application/json' } : {}) },
      ...(mutation ? { body: JSON.stringify({ order_id: orderId }) } : {}),
    });
    const body = await boundedJSON(upstream, signal, action === 'history' ? 131072 : 8192);
    if (upstream.status !== 200) {
      return reply({ error: safeErrors.has(body?.error) ? body.error : 'purchases_unavailable' },
        [400, 401, 403, 404, 409, 429].includes(upstream.status) ? upstream.status : 503);
    }
    const environment = env.NOWPAYMENTS_ENV === 'sandbox' ? 'sandbox' : 'production';
    const value = action === 'history' ? nowpaymentsPurchases(body)
      : action === 'resume' ? nowpaymentsResume(body, orderId, environment) : nowpaymentsCancellation(body, orderId);
    return value ? reply({ ...value, ...(action === 'resume' ? { checkout_environment: environment } : {}) })
      : reply({ error: 'purchases_unavailable' }, 503);
  } catch { return reply({ error: 'purchases_unavailable' }, 503); }
}
