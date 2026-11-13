import { memberMutationError } from './member-mutation-policy.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { profileSubjectFromHeader } from './member-profile.mjs';

export const REFERRAL_UPSTREAM_TIMEOUT_MS = 20000;
const diagnostic = value => console.warn(JSON.stringify(value));

// Service bindings and stalled readers may ignore cancellation. End the local
// wait as well, dispose a late response, and never replay the original request.
function waitForSignal(operation, signal, late = (_value) => {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener('abort', aborted);
    const aborted = () => {
      if (settled) return;
      settled = true; cleanup(); reject(new Error('referral_request_cancelled'));
    };
    if (signal.aborted) { aborted(); return; }
    signal.addEventListener('abort', aborted, { once: true });
    Promise.resolve().then(() => {
      if (settled || signal.aborted) throw new Error('referral_request_cancelled');
      return operation();
    }).then(value => {
      if (settled) { try { late(value); } catch { /* cleanup only */ } return; }
      settled = true; cleanup(); resolve(value);
    }, error => {
      if (settled) return;
      settled = true; cleanup(); reject(error);
    });
  });
}
function cancelBody(body) {
  try { void Promise.resolve(body?.cancel()).catch(() => {}); } catch { /* cleanup only */ }
}

const reply = (body, status = 200) => Response.json(body, { status,
  headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' } });
const validEmail = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
// Referral codes reject ASCII controls rather than interpreting them as input.
// eslint-disable-next-line no-control-regex
const validCode = value => typeof value === 'string' && value.length <= 64 && !/[\u0000-\u0020\u007f]/.test(value);
const validSide = value => value === '' || value === 'L' || value === 'R';

async function boundedJSON(message, signal, limit = 2048) {
  if (!/^application\/json(?:\s*;|$)/i.test(message.headers.get('content-type') || '')) {
    cancelBody(message.body); throw new Error('invalid_content');
  }
  const reader = message.body?.getReader();
  if (!reader) throw new Error('missing_body');
  const cancel = () => cancelBody(reader);
  signal.addEventListener('abort', cancel, { once: true });
  try {
    const chunks = []; let size = 0;
    while (true) {
      if (signal.aborted) { cancel(); throw new Error('cancelled'); }
      const { done, value } = await waitForSignal(() => reader.read(), signal);
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
  } finally {
    signal.removeEventListener('abort', cancel);
    try { reader.releaseLock(); } catch { /* A faulty cancelled read cannot hold the caller. */ }
  }
}

// An owner-scoped preference, never permission to move an existing tree node.
// The BFF independently verifies its cookie/JWT; browser fields cannot select an owner.
export async function handleReferralAttribution(request, { env, identity, fetchImpl, observe = diagnostic }) {
  const failed = (stage, status) => {
    // Fixed stages and HTTP integers only: no email, subject, referral, cookie,
    // token, provider response, or exception text reaches telemetry.
    const safeStatus = Number.isInteger(status) && status >= 100 && status <= 599 ? status : 'unavailable';
    try { observe({ event: 'referral_attribution_failure', method: request.method, stage, status: safeStatus }); } catch { /* telemetry never changes access */ }
  };
  if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'method_not_allowed' }, 405);
  if (new URL(request.url).search) return reply({ error: 'invalid_request' }, 400);
  const mutation = request.method === 'POST';
  const denied = mutation ? memberMutationError(request, env) : null;
  if (denied) return reply({ error: denied.error }, denied.status);
  let verified;
  try { verified = await identity(); } catch { failed('identity', 503); return reply({ error: 'referral_unavailable' }, 503); }
  const claims = verified?.claims;
  const email = typeof claims?.email === 'string' ? claims.email.trim().toLowerCase() : '';
  if (!verified?.token || !validEmail(email) || claims?.email_verified !== true
    || typeof claims.sub !== 'string' || !claims.sub.trim() || claims.sub.length > 256) {
    return reply({ error: 'unauthenticated' }, 401);
  }
  // A mounted view may supply its subject as an equality fence. It never
  // selects the owner: only the independently verified JWT authorizes Go.
  if (request.headers.has('x-mindbliss-referral-subject')) {
    const expectedSubject = profileSubjectFromHeader(request.headers.get('x-mindbliss-referral-subject'));
    if (!expectedSubject || expectedSubject !== claims.sub) return reply({ error: 'referral_session_changed' }, 409);
  }
  if (!env.PAYMENTS_SERVICE_TOKEN) { failed('configuration', 503); return reply({ error: 'referral_unavailable' }, 503); }
  let input;
  if (mutation) {
    const inputDeadline = browserRequestDeadline(request.signal, 8000);
    try { input = await boundedJSON(request, inputDeadline.signal); }
    catch (error) { return reply({ error: 'invalid_request' }, error instanceof RangeError ? 413 : 400); }
    finally { inputDeadline.dispose(); }
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
  // Match other private service reads during startup. This is one request,
  // with one deadline through its bounded body, not an automatic retry.
  const deadline = browserRequestDeadline(request.signal, REFERRAL_UPSTREAM_TIMEOUT_MS);
  const signal = deadline.signal;
  let stage = 'transport';
  try {
    const upstream = await waitForSignal(() => fetchImpl(target.href, { method: request.method, redirect: 'manual', cache: 'no-store', signal,
      headers: { 'X-VP-Service-Token': env.PAYMENTS_SERVICE_TOKEN, 'X-VP-Id-Token': verified.token,
        ...(mutation ? { 'Content-Type': 'application/json' } : {}) },
      ...(mutation ? { body: JSON.stringify({ email, ref: input.ref, preferred_side: '' }) } : {}),
    }), signal, response => cancelBody(response?.body));
    stage = 'response';
    const body = await boundedJSON(upstream, signal);
    if (upstream.status !== 200) {
      failed('upstream', upstream.status);
      return reply({ error: 'referral_unavailable' },
        [400, 401, 403, 404, 409, 422, 429].includes(upstream.status) ? upstream.status : 503);
    }
    if (Object.keys(body).some(key => !['ok', 'ref', 'preferred_side', 'positioned'].includes(key))
      || body.ok !== true || typeof body.positioned !== 'boolean' || !validCode(body.ref)
      || !validSide(body.preferred_side) || (body.positioned && (body.ref || body.preferred_side))
      || (!body.ref && body.preferred_side)) { failed('response', 503); return reply({ error: 'referral_unavailable' }, 503); }
    return reply({ ok: true, ref: body.ref, preferred_side: '', positioned: body.positioned });
  } catch { failed(signal.aborted ? 'cancelled' : stage, 503); return reply({ error: 'referral_unavailable' }, 503); }
  finally { deadline.dispose(); }
}
