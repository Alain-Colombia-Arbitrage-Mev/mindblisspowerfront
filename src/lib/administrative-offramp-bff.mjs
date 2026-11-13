import { betterAuthConfig, betterAuthCookies } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { administrativeOfframpOptions, administrativeOfframpSelection } from './administrative-offramp-contract.mjs';

const origin = 'https://wallet.mindblisspower.com';
const path = '/api/member/wallet-funding/administrative/offramp/options';
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });

export async function handleAdministrativeOfframpOptions(request, {
  env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest,
} = {}) {
  const url = new URL(request.url);
  if (url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== path || url.hash) return reply({ error: 'not_found' }, 404);
  if (request.method !== 'GET') return reply({ error: 'method_not_allowed' }, 405);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'invalid_request' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  const query = url.searchParams, selection = administrativeOfframpSelection(query.get('country'), query.get('destinationCurrencyCode'));
  if (!selection || query.getAll('country').length !== 1 || query.getAll('destinationCurrencyCode').length !== 1
    || [...query.keys()].some(key => !['country', 'destinationCurrencyCode'].includes(key))) return reply({ error: 'invalid_request' }, 400);
  try {
    const result = await serviceRequest(`${betterAuthConfig(env)}${path}?country=${selection.country}&destinationCurrencyCode=${selection.destinationCurrencyCode}`,
      { method: 'GET', signal: request.signal, headers: { cookie, origin } }, fetchImpl);
    if (!result.ok) {
      const allowed = new Set(['unauthenticated', 'offramp_unconfigured', 'offramp_rate_limited', 'administrative_wallet_unavailable', 'invalid_request']);
      const status = [400, 401, 403, 409, 429, 503].includes(result.status) ? result.status : 503;
      return reply({ error: allowed.has(result.data?.error) ? result.data.error : 'offramp_provider_unavailable' }, status);
    }
    const data = administrativeOfframpOptions(result.data, selection);
    return data ? reply(data) : reply({ error: 'offramp_provider_unavailable' }, 502);
  } catch { return reply({ error: 'offramp_provider_unavailable' }, 503); }
}
