import { checkoutProvider, hostedCheckoutURL, stripeCheckoutEnabled, nowpaymentsMembershipsEnabled } from './checkout-policy.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { nowpaymentsOrderId } from './nowpayments-receipt.mjs';

const headers = { 'Cache-Control': 'private, no-store' };
const reply = (body, status = 200) => Response.json(body, { status, headers });
const safeErrors = new Set(['buyer_not_found', 'invalid_referral_code', 'invalid_preferred_side', 'tree_relocation_required',
  'checkout_identity_review_required', 'stripe_recovery_financial_review_required', 'financial_mutations_unavailable',
  'service_read_only', 'core_unavailable', 'financial_services_unavailable', 'account_suspended', 'invalid_id_token',
  'membership_already_active', 'package_not_found', 'nowpayments-unavailable', 'nowpayments_unavailable',
  'nowpayments-review-required', 'nowpayments_review_required', 'checkout_pending_review', 'membership_payment_pending_review',
  'core_not_ready', 'financial_review_required', 'membership_eligibility_unavailable', 'nowpayments_financial_configuration_unavailable',
  'stripe_unavailable', 'stripe_checkout_disabled', 'nowpayments_checkout_disabled',
  'upstream_unavailable', 'nowpayments_checkout_unavailable', 'membership_purchase_already_processed', 'invalid_purchase_request_id']);
const validAmount = value => typeof value === 'string' && /^(?:0|[1-9]\d{0,11})\.\d{2}$/.test(value);
const minorUnits = value => BigInt(value.replace('.', ''));

async function readJSON(body, signal, limit = 16384) {
  const reader = body?.getReader();
  if (!reader) throw new Error('invalid_json');
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    const chunks = []; let length = 0;
    while (true) {
      if (signal.aborted) throw new Error('request_cancelled');
      const { value, done } = await reader.read();
      if (signal.aborted) throw new Error('request_cancelled');
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new RangeError('body_too_large'); }
      chunks.push(value);
    }
    const data = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid_json');
    return parsed;
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

/** Cookie-authenticated membership checkout; no prices, role or node IDs from the browser. */
export async function handleMembershipCheckout(request, { env, identity, fetchImpl }) {
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  const mutationError = memberMutationError(request, env);
  if (mutationError) return reply({ error: mutationError.error }, mutationError.status);
  let verified;
  try { verified = await identity(); }
  catch { return reply({ error: 'authentication-unavailable' }, 503); }
  const claims = verified?.claims;
  const email = typeof claims?.email === 'string' ? claims.email.trim().toLowerCase() : '';
  if (!verified?.token || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || typeof claims?.sub !== 'string' || !claims.sub.trim() || claims.sub.length > 256 || claims.email_verified !== true) {
    return reply({ error: 'unauthenticated' }, 401);
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15000)]);
  let body;
  try { body = await readJSON(request.body, signal); }
  catch (error) { return reply({ error: error instanceof RangeError ? 'request_too_large' : 'invalid-json' }, error instanceof RangeError ? 413 : 400); }
  const provider = checkoutProvider(body.provider);
  if (!provider) return reply({ error: 'invalid-provider' }, 400);
  const packageId = Number(body.package_id);
  if (!Number.isSafeInteger(packageId) || packageId <= 0 || !['string', 'number'].includes(typeof body.package_id)) return reply({ error: 'invalid-package' }, 400);
  const rawRef = typeof body.ref === 'string' ? body.ref.trim() : '';
  const refEmail = typeof body.ref_email === 'string' ? body.ref_email.trim().toLowerCase() : '';
  if (rawRef.length > 64 || /[\u0000-\u0020\u007f]/.test(rawRef) || refEmail.length > 254) return reply({ error: 'invalid_referral_code' }, 400);
  const ref = rawRef && refEmail === email ? rawRef : '';
  const side = typeof body.preferred_side === 'string' ? body.preferred_side.trim().toUpperCase() : '';
  if (ref && side && !['L', 'R'].includes(side)) return reply({ error: 'invalid_preferred_side' }, 400);
  if (provider === 'stripe' && !stripeCheckoutEnabled(env)) return reply({ error: 'stripe_checkout_disabled' }, 503);
  if (provider === 'nowpayments' && !nowpaymentsMembershipsEnabled(env)) return reply({ error: 'nowpayments_checkout_disabled' }, 503);
  const purchaseRequestId = provider === 'nowpayments' ? nowpaymentsOrderId(body.purchase_request_id) : '';
  if (provider === 'nowpayments' && !purchaseRequestId) return reply({ error: 'invalid_purchase_request_id' }, 400);
  if (!env.VP_PAYMENTS_URL || !env.PAYMENTS_SERVICE_TOKEN) return reply({ error: 'payments-unconfigured' }, 503);
  try {
    const upstream = await fetchImpl(`${env.VP_PAYMENTS_URL}/api/payments/checkout`, {
      method: 'POST', redirect: 'manual', cache: 'no-store', signal,
      headers: { 'content-type': 'application/json', 'X-VP-Service-Token': env.PAYMENTS_SERVICE_TOKEN, 'X-VP-Id-Token': verified.token },
      body: JSON.stringify({ provider, email, package_id: packageId, ref, preferred_side: ref ? side : '',
        ...(provider === 'nowpayments' ? { purchase_request_id: purchaseRequestId } : {}),
        name: typeof claims.name === 'string' ? claims.name.trim().slice(0, 120) : '',
        phone: typeof claims.phone_number === 'string' ? claims.phone_number.trim().slice(0, 32) : '' }),
    });
    const payload = await readJSON(upstream.body, signal);
    if (!upstream.ok) {
      const status = [400, 401, 403, 404, 409, 422, 429].includes(upstream.status) ? upstream.status : 503;
      const error = safeErrors.has(payload.error) ? payload.error
        : payload.error === 'Ya tienes esta membresía activa. Las membresías son de pago único.' ? 'membership_already_active' : 'checkout-failed';
      return reply({ error }, status);
    }
    const environment = provider === 'nowpayments' && env.NOWPAYMENTS_ENV === 'sandbox' ? 'sandbox' : 'production';
    const url = hostedCheckoutURL(payload.url, provider, environment);
    // Never silently turn a requested crypto purchase into a Stripe checkout.
    if (!url || (payload.provider !== undefined && payload.provider !== provider)
        || (provider === 'nowpayments' && (payload.provider !== provider
          || !['review_required', 'awaiting_payment'].includes(payload.fulfillment_status)
          || (payload.fulfillment_status === 'awaiting_payment' && payload.fee_usd !== '0.00')))
        || !validAmount(payload.total_usd) || !validAmount(payload.fee_usd)
        || minorUnits(payload.total_usd) <= 0n || minorUnits(payload.fee_usd) > minorUnits(payload.total_usd)
        || (payload.order_id !== undefined && !nowpaymentsOrderId(payload.order_id))
        || (payload.reused !== undefined && typeof payload.reused !== 'boolean')) {
      return reply({ error: 'invalid-checkout-response' }, 502);
    }
    return reply({ provider, url, total_usd: payload.total_usd, fee_usd: payload.fee_usd, checkout_environment: environment,
      ...(provider === 'nowpayments' ? { fulfillment_status: payload.fulfillment_status,
        ...(payload.order_id ? { order_id: payload.order_id } : {}), ...(payload.reused !== undefined ? { reused: payload.reused } : {}) } : {}) });
  } catch { return reply({ error: 'payments-unreachable' }, 502); }
}
