import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { companyPaymentHistory, companyPaymentInput, companyPaymentView } from './company-payment-contract.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { PERSONAL_COMPANY_PAYMENT } from './personal-company-payment-values.mjs';
import { personalWalletBalance, personalWalletBalances } from './personal-wallet-balance.mjs';
import { companyPaymentEventInput, companyPaymentEventAck, companyPaymentEventPage, companyPaymentEventQuery } from './company-payment-events.mjs';
import { isPersonalPortalOrigin } from './personal-portal-origin.mjs';

const reply = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const safeErrors = new Set(['unauthenticated', 'invalid_origin', 'invalid_request', 'company_payment_unavailable', 'company_payment_not_found',
  'company_payment_unconfigured', 'company_payment_wallet_not_linked', 'company_payment_insufficient_balance', 'company_payment_pending',
  'company_payment_request_already_used', 'company_payment_transaction_pending', 'company_payment_transaction_mismatch', 'company_payment_rate_limited',
  'company_payment_forbidden', 'company_payment_hash_reused', 'company_payment_pending_exists', 'company_payment_rpc_unavailable',
  'company_payment_invalid_transition', 'company_payment_confirmation_conflict', 'company_payment_network_retired', 'company_payment_network_changed']);

function bodyFailure(error) {
  if (error?.message === 'request_body_unavailable') return reply({ error: 'company_payment_unavailable' }, 503);
  return reply({ error: error?.message === 'request_too_large' ? 'request_too_large' : 'invalid_request' }, error?.message === 'request_too_large' ? 413 : 400);
}

/** Authenticated journal: browser observations and canonical server evidence stay distinct. */
export async function handleCompanyPaymentJournal(request, action, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  if (!['recordEvent', 'eventHistory', 'activityHistory'].includes(action)) return reply({ error: 'invalid_request' }, 400);
  if (env.NODE_ENV === 'production' && !isPersonalPortalOrigin(env.AUTH_PUBLIC_ORIGIN)) return reply({ error: 'not_found' }, 404);
  const writing = action === 'recordEvent', method = writing ? 'POST' : 'GET';
  if (request.method !== method) return reply({ error: 'method_not_allowed' }, 405);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) return reply({ error: 'unauthenticated' }, 401);
  if (env.PERSONAL_COMPANY_PAYMENTS_ENABLED !== 'true') return reply({ error: 'company_payment_unconfigured' }, 503);
  const url = new URL(request.url);
  let body, parsed;
  if (writing) {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    if (url.search) return reply({ error: 'invalid_request' }, 400);
    const length = request.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > 2048)) return reply({ error: 'request_too_large' }, 413);
    try { body = companyPaymentEventInput(await readBoundedRequestJson(request, { maxBytes: 2048, timeoutMs: 8000 })); }
    catch (error) { return bodyFailure(error); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
  } else {
    parsed = companyPaymentEventQuery(url.search, action === 'eventHistory' ? 'events' : 'activity');
    if (!parsed) return reply({ error: 'invalid_request' }, 400);
  }
  const path = `/api/member/company-payments/${action === 'activityHistory' ? 'activity' : 'events'}${parsed?.query || ''}`;
  try {
    const base = betterAuthConfig(env), serialized = body ? JSON.stringify(body) : '';
    const ip = trustedAuthClientIp(request.headers, env), timestamp = String(Math.floor(Date.now() / 1000));
    const hash = value => createHash('sha256').update(value).digest('hex');
    const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([method, path.split('?')[0], timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
    const result = await serviceRequest(`${base}${path}`, { method, signal: request.signal, body: serialized || undefined,
      headers: { cookie, origin: writing ? request.headers.get('origin') || '' : env.AUTH_PUBLIC_ORIGIN,
        ...(writing ? { 'content-type': 'application/json' } : {}), 'x-vp-auth-client-ip': ip,
        'x-vp-auth-timestamp': timestamp, 'x-vp-auth-signature': signature } }, fetchImpl);
    if (!result.ok) return reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'company_payment_unavailable' },
      [400, 401, 403, 404, 409, 413, 429, 503].includes(result.status) ? result.status : 502);
    const safe = writing ? companyPaymentEventAck(result.data, body) : companyPaymentEventPage(result.data, parsed);
    return safe ? reply(safe) : reply({ error: 'company_payment_unavailable' }, 502);
  } catch { return reply({ error: 'company_payment_unavailable' }, 503); }
}

/** Native sessions and the private BFF authenticate every read and mutation. */
export async function handleCompanyPayment(request, action, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  if (!['prepare', 'submit', 'verify', 'abandon', 'status', 'history', 'balance', 'balances'].includes(action)) return reply({ error: 'invalid_request' }, 400);
  if (env.NODE_ENV === 'production' && !isPersonalPortalOrigin(env.AUTH_PUBLIC_ORIGIN)) return reply({ error: 'not_found' }, 404);
  const method = ['status', 'history', 'balance', 'balances'].includes(action) ? 'GET' : 'POST';
  if (request.method !== method) return reply({ error: 'method_not_allowed' }, 405);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) return reply({ error: 'unauthenticated' }, 401);
  if (env.PERSONAL_COMPANY_PAYMENTS_ENABLED !== 'true') return reply({ error: 'company_payment_unconfigured' }, 503);
  const url = new URL(request.url);
  let body, paymentId;
  if (method === 'POST') {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    if (url.search) return reply({ error: 'invalid_request' }, 400);
    const length = request.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > 2048)) return reply({ error: 'request_too_large' }, 413);
    try { body = companyPaymentInput(await readBoundedRequestJson(request, { maxBytes: 2048, timeoutMs: 8000 }), action); }
    catch (error) { return bodyFailure(error); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
  } else if (action === 'status') {
    paymentId = url.searchParams.get('paymentId');
    if (!FUNDING_UUID.test(paymentId || '') || url.search !== `?paymentId=${paymentId}`) return reply({ error: 'invalid_request' }, 400);
  } else if (url.search) return reply({ error: 'invalid_request' }, 400);
  const path = `/api/member/company-payments/${action}${paymentId ? `?paymentId=${paymentId}` : ''}`;
  const requestedId = body ? ('requestId' in body ? body.requestId : body.paymentId) : undefined;
  const requestedHash = body && 'transactionHash' in body ? body.transactionHash : undefined;
  try {
    const base = betterAuthConfig(env), serialized = body ? JSON.stringify(body) : '';
    const ip = trustedAuthClientIp(request.headers, env), timestamp = String(Math.floor(Date.now() / 1000));
    const hash = value => createHash('sha256').update(value).digest('hex');
    const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([method, path.split('?')[0], timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
    const result = await serviceRequest(`${base}${path}`, { method, signal: request.signal, body: serialized || undefined,
      headers: { cookie, origin: method === 'GET' ? env.AUTH_PUBLIC_ORIGIN : request.headers.get('origin') || '', ...(body ? { 'content-type': 'application/json' } : {}),
        'x-vp-auth-client-ip': ip, 'x-vp-auth-timestamp': timestamp, 'x-vp-auth-signature': signature } }, fetchImpl);
    if (!result.ok) return reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'company_payment_unavailable' }, [400, 401, 403, 404, 409, 413, 429, 503].includes(result.status) ? result.status : 502);
    const safe = action === 'balances' ? personalWalletBalances(result.data) : action === 'balance' ? personalWalletBalance(result.data)
      : action === 'history' ? companyPaymentHistory(result.data) : companyPaymentView(result.data);
    if (!safe || (paymentId && (!('paymentId' in safe) || safe.paymentId !== paymentId))
      || (body && (!('paymentId' in safe) || safe.paymentId !== requestedId))
      || (action === 'prepare' && (!('amountAtomic' in safe) || !('amountAtomic' in body) || safe.amountAtomic !== body.amountAtomic
        || !('chainId' in safe) || safe.chainId !== (body.chainId ?? PERSONAL_COMPANY_PAYMENT.chainId)))
      || (action === 'submit' && (!('transactionHash' in safe) || safe.transactionHash !== requestedHash))) return reply({ error: 'company_payment_unavailable' }, 502);
    if (action === 'abandon' && (!('status' in safe) || safe.status !== 'prepared' || !('abandonedAt' in safe) || safe.abandonedAt === null)) return reply({ error: 'company_payment_unavailable' }, 502);
    return reply(safe);
  } catch { return reply({ error: 'company_payment_unavailable' }, 503); }
}
