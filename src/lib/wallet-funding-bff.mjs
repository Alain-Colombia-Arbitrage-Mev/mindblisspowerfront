import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { administrativeSandboxOptions, personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingInput } from './wallet-funding-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });

async function readInput(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_request');
  const deadline = browserRequestDeadline(request.signal, 8000);
  const cancel = () => { void reader.cancel().catch(() => {}); };
  deadline.signal.addEventListener('abort', cancel, { once: true });
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let raw = '';
  try {
    if (deadline.signal.aborted) throw new Error('invalid_request');
    while (true) {
      const { value, done } = await reader.read();
      if (deadline.signal.aborted) throw new Error('invalid_request');
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) {
        void reader.cancel().catch(() => {});
        throw new Error('request_too_large');
      }
      raw += decoder.decode(value, { stream: true });
    }
    return JSON.parse(raw + decoder.decode());
  } finally { deadline.signal.removeEventListener('abort', cancel); deadline.dispose(); reader.releaseLock(); }
}

export async function handleWalletFunding(request, action, {
  env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest,
} = {}) {
  if (!['personal', 'administrative', 'history', 'options', 'personal-options'].includes(action)) return reply({ error: 'invalid_request' }, 400);
  const method = ['history', 'options', 'personal-options'].includes(action) ? 'GET' : 'POST';
  if (request.method !== method) return reply({ error: 'method_not_allowed' }, 405);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) return reply({ error: 'unauthenticated' }, 401);
  let kind = action;
  let body;
  let path;
  let optionsContext;
  if (action === 'personal-options') {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    optionsContext = personalProductionOptions({ walletKind: 'personal', environment: 'production', provider: 'reown', country, paymentMethods: [], routes: [] });
    if (!optionsContext || [...url.searchParams.keys()].some(key => key !== 'country')
      || url.searchParams.getAll('country').length !== 1) return reply({ error: 'invalid_request' }, 400);
    path = `/api/member/wallet-funding/personal/options?country=${country}`;
  } else if (action === 'options') {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    const serviceProvider = url.searchParams.get('serviceProvider');
    optionsContext = administrativeSandboxOptions({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
      country, serviceProvider, paymentMethods: [], routes: [] });
    if (!optionsContext || [...url.searchParams.keys()].some(key => !['country', 'serviceProvider'].includes(key))
      || url.searchParams.getAll('country').length !== 1 || url.searchParams.getAll('serviceProvider').length !== 1) return reply({ error: 'invalid_request' }, 400);
    path = `/api/member/wallet-funding/administrative/options?country=${country}&serviceProvider=${serviceProvider}`;
  } else if (action === 'history') {
    const url = new URL(request.url);
    kind = url.searchParams.get('walletKind');
    if (!['personal', 'administrative'].includes(kind) || [...url.searchParams.keys()].some(key => key !== 'walletKind')
      || url.searchParams.getAll('walletKind').length !== 1) return reply({ error: 'invalid_request' }, 400);
    path = `/api/member/wallet-funding/history?walletKind=${kind}`;
  } else {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    const length = request.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > 2048)) return reply({ error: 'request_too_large' }, 413);
    try {
      body = fundingInput(await readInput(request), kind);
    } catch (error) { return reply({ error: error?.message === 'request_too_large' ? 'request_too_large' : 'invalid_request' }, error?.message === 'request_too_large' ? 413 : 400); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
    path = kind === 'personal' ? '/api/member/wallet-funding/personal/intent' : '/api/member/wallet-funding/administrative/session';
  }
  try {
    const base = betterAuthConfig(env);
    const serialized = body ? JSON.stringify(body) : '';
    const headers = { cookie, ...(body ? { 'content-type': 'application/json', origin: request.headers.get('origin') || '' } : {}) };
    if (action === 'administrative') {
      const ip = trustedAuthClientIp(request.headers, env);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const hash = value => createHash('sha256').update(value).digest('hex');
      const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
        .update([method, path, timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
      headers['x-vp-auth-client-ip'] = ip;
      headers['x-vp-auth-timestamp'] = timestamp;
      headers['x-vp-auth-signature'] = signature;
    }
    const result = await serviceRequest(`${base}${path}`, {
      method, headers, body: serialized || undefined, signal: request.signal,
    }, fetchImpl);
    if (!result.ok) {
      const safeErrors = new Set(['invalid_request', 'unauthenticated', 'invalid_origin', 'wallet_not_linked', 'wallet_not_assigned',
        'wallet_funding_forbidden', 'wallet_funding_rate_limited', 'wallet_funding_request_already_used',
        'wallet_funding_unconfigured', 'wallet_funding_provider_unavailable', 'wallet_funding_unavailable',
        'wallet_funding_method_unavailable', 'wallet_funding_amount_out_of_range', 'wallet_funding_amount_unavailable']);
      return reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'funding_unavailable' },
        [400, 401, 403, 409, 413, 429, 503].includes(result.status) ? result.status : 502);
    }
    const safe = action === 'personal-options' ? personalProductionOptions(result.data)
      : action === 'options' ? administrativeSandboxOptions(result.data)
      : action === 'history' ? fundingHistory(result.data, kind) : fundingAcknowledgement(result.data, kind);
    if (!safe) return reply({ error: 'funding_unavailable' }, 502);
    if (body && (!('requestedAmount' in safe) || !('checkoutReference' in safe) || safe.requestedAmount !== body.amount
      || safe.checkoutReference !== body.requestId || (kind === 'personal' && (!('paymentMethodType' in safe)
        || safe.paymentMethodType !== body.paymentMethodType)))) return reply({ error: 'funding_unavailable' }, 502);
    if (optionsContext && (!('country' in safe) || safe.country !== optionsContext.country
      || (action === 'options' && (!('serviceProvider' in safe) || safe.serviceProvider !== optionsContext.serviceProvider)))) return reply({ error: 'funding_unavailable' }, 502);
    return reply(safe);
  } catch { return reply({ error: 'funding_unavailable' }, 503); }
}
