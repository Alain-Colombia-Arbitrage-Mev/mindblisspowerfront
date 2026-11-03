import { memberMutationError } from './member-mutation-policy.mjs';

const reply = (body, status = 200) => Response.json(body, { status,
  headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' } });
const validEmail = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validCode = value => typeof value === 'string' && value.length <= 64 && !/[\u0000-\u0020\u007f]/.test(value);
const validSide = value => value === '' || value === 'L' || value === 'R';

async function boundedJSON(message, signal, limit = 2048) {
  if (!/^application\/json(?:\s*;|$)/i.test(message.headers.get('content-type') || '')) throw new Error('invalid_content');
  const reader = message.body?.getReader();
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
      if (size > limit) { cancel(); throw new RangeError('oversized_body'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid_json');
    return parsed;
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

// An owner-scoped preference, never permission to move an existing tree node.
// The BFF independently verifies its cookie/JWT; browser fields cannot select an owner.
export async function handleReferralAttribution(request, { env, identity, fetchImpl }) {
  if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'method_not_allowed' }, 405);
  if (new URL(request.url).search) return reply({ error: 'invalid_request' }, 400);
  const mutation = request.method === 'POST';
  const denied = mutation ? memberMutationError(request, env) : null;
  if (denied) return reply({ error: denied.error }, denied.status);
  let verified;
  try { verified = await identity(); } catch { return reply({ error: 'referral_unavailable' }, 503); }
  const claims = verified?.claims;
  const email = typeof claims?.email === 'string' ? claims.email.trim().toLowerCase() : '';
  if (!verified?.token || !validEmail(email) || claims?.email_verified !== true
    || typeof claims.sub !== 'string' || !claims.sub.trim() || claims.sub.length > 256) {
    return reply({ error: 'unauthenticated' }, 401);
  }
  if (!env.PAYMENTS_SERVICE_TOKEN) return reply({ error: 'referral_unavailable' }, 503);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8000)]);
  let input;
  if (mutation) {
    try { input = await boundedJSON(request, signal); }
    catch (error) { return reply({ error: 'invalid_request' }, error instanceof RangeError ? 413 : 400); }
    if (Object.keys(input).some(key => !['ref', 'preferred_side', 'expected_email'].includes(key))
      || !validCode(input.ref) || !input.ref || !validSide(input.preferred_side)
      || !validEmail(input.expected_email)) return reply({ error: 'invalid_request' }, 400);
    // Equality only: a stale tab cannot write A's hint after a cookie changes to B.
    if (input.expected_email.trim().toLowerCase() !== email) return reply({ error: 'referral_session_changed' }, 409);
  } else {
    const expected = request.headers.get('X-VP-Expected-Email');
    if (!validEmail(expected) || expected.trim().toLowerCase() !== email) return reply({ error: 'referral_session_changed' }, 409);
  }
  const target = new URL('https://payments.core.internal/api/payments/referral-attribution');
  if (!mutation) target.searchParams.set('email', email);
  try {
    const upstream = await fetchImpl(target.href, { method: request.method, redirect: 'manual', cache: 'no-store', signal,
      headers: { 'X-VP-Service-Token': env.PAYMENTS_SERVICE_TOKEN, 'X-VP-Id-Token': verified.token,
        ...(mutation ? { 'Content-Type': 'application/json' } : {}) },
      ...(mutation ? { body: JSON.stringify({ email, ref: input.ref, preferred_side: input.preferred_side }) } : {}),
    });
    const body = await boundedJSON(upstream, signal);
    if (upstream.status !== 200) return reply({ error: 'referral_unavailable' },
      [400, 401, 403, 404, 409, 422, 429].includes(upstream.status) ? upstream.status : 503);
    if (Object.keys(body).some(key => !['ok', 'ref', 'preferred_side', 'positioned'].includes(key))
      || body.ok !== true || typeof body.positioned !== 'boolean' || !validCode(body.ref)
      || !validSide(body.preferred_side) || (body.positioned && (body.ref || body.preferred_side))
      || (!body.ref && body.preferred_side)) return reply({ error: 'referral_unavailable' }, 503);
    return reply({ ok: true, ref: body.ref, preferred_side: body.preferred_side, positioned: body.positioned });
  } catch { return reply({ error: 'referral_unavailable' }, 503); }
}
