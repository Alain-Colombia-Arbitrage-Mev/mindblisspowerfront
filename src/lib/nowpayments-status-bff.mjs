import { nowpaymentsOrderId, nowpaymentsReceiptStatus } from './nowpayments-receipt.mjs';

const reply = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store', ...extra } });
const target = 'https://payments.core.internal/api/payments/nowpayments/status';

async function boundedJSON(response, signal) {
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
      if (size > 4096) { cancel(); throw new Error('oversized_status'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

export async function handleNOWPaymentsStatus(request, { env, identity, fetchImpl }) {
  if (request.method !== 'GET') return reply({ error: 'method_not_allowed' }, 405);
  const url = new URL(request.url), ids = url.searchParams.getAll('order_id');
  if (ids.length !== 1 || [...url.searchParams.keys()].some(key => key !== 'order_id') || !nowpaymentsOrderId(ids[0])) return reply({ error: 'invalid_order' }, 400);
  if (env.NOWPAYMENTS_WEBHOOK_ENABLED !== 'true' || !env.PAYMENTS_SERVICE_TOKEN) return reply({ error: 'payment_status_unavailable' }, 503);
  let verified;
  try { verified = await identity(); } catch { return reply({ error: 'payment_status_unavailable' }, 503); }
  const claims = verified?.claims;
  if (!verified?.token || claims?.email_verified !== true || typeof claims.sub !== 'string' || !claims.sub.trim()
      || typeof claims.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email)
      || !nowpaymentsOrderId(claims.person_public_id)) return reply({ error: 'unauthenticated' }, 401);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8000)]);
  try {
    const upstream = await fetchImpl(`${target}?order_id=${ids[0]}`, { method: 'GET', redirect: 'manual', cache: 'no-store', signal,
      headers: { 'X-VP-Service-Token': env.PAYMENTS_SERVICE_TOKEN, 'X-VP-Id-Token': verified.token } });
    if (upstream.status !== 200) {
      void upstream.body?.cancel().catch(() => {});
      const status = [401, 403, 404, 429].includes(upstream.status) ? upstream.status : 503;
      const retry = Number(upstream.headers.get('retry-after'));
      return reply({ error: status === 404 ? 'payment_not_found' : 'payment_status_unavailable' }, status,
        status === 429 && Number.isFinite(retry) && retry > 0 ? { 'retry-after': String(Math.min(60, Math.ceil(retry))) } : {});
    }
    const receipt = nowpaymentsReceiptStatus(await boundedJSON(upstream, signal), ids[0]);
    return receipt ? reply(receipt) : reply({ error: 'payment_status_unavailable' }, 503);
  } catch { return reply({ error: 'payment_status_unavailable' }, 503); }
}
