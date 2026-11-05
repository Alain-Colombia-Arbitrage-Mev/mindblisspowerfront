import { createHmac } from 'node:crypto';

export const DELIVERY_TRACE_RETENTION_MS = 14 * 86400_000;
export const DELIVERY_TRACE_TIMEOUT_MS = 2000;
const hexRef = (secret, domain, value) => createHmac('sha256', secret).update(`otp-trace:${domain}\0${value}`).digest('hex');

/** Called only AFTER raw-byte Svix verification. This capability receives no
 * recipient, subject, OTP, signature, raw provider ID or arbitrary payload. */
export async function persistResendDelivery({ env, type, emailId, webhookId, occurredAt, now = Date.now(), signal,
  timeoutMs = DELIVERY_TRACE_TIMEOUT_MS }) {
  if (env.RESEND_TRACE_ENABLED !== 'true') return 'disabled';
  const secret = env.AUTH_BFF_SHARED_SECRET;
  if (typeof secret !== 'string' || secret.length < 32 || secret.length > 4096 || /[\r\n]/.test(secret)
    || typeof env.CORE_EMAIL_TELEMETRY?.recordDelivery !== 'function') throw Error('delivery_trace_unavailable');
  const time = typeof occurredAt === 'string' && occurredAt.length <= 40 ? Date.parse(occurredAt) : NaN;
  if (!Number.isFinite(time) || time > now + 60000) throw Error('delivery_trace_unavailable');
  // An authentic historical replay outside the retention window is ignored,
  // not claimed as a new delivery or inserted forever by provider retries.
  if (time <= now - DELIVERY_TRACE_RETENTION_MS) return 'outside_retention';
  const event = { version: 1, id: hexRef(secret, 'webhook', webhookId), occurred_at: new Date(time).toISOString(),
    event_type: type, message_ref: hexRef(secret, 'message', emailId.toLowerCase()) };
  let timer, cancelled;
  try {
    if (signal?.aborted) throw Error('delivery_trace_unavailable');
    const stopped = new Promise((_, reject) => {
      cancelled = () => reject(Error('delivery_trace_unavailable'));
      signal?.addEventListener('abort', cancelled, { once: true });
      timer = setTimeout(cancelled, Math.max(1, Math.min(DELIVERY_TRACE_TIMEOUT_MS, timeoutMs)));
    });
    const result = await Promise.race([env.CORE_EMAIL_TELEMETRY.recordDelivery(event), stopped]);
    if (!result || Object.keys(result).length !== 1 || result.recorded !== true) throw Error('delivery_trace_unavailable');
    return 'recorded';
  } finally { clearTimeout(timer); if (cancelled) signal?.removeEventListener('abort', cancelled); }
}
