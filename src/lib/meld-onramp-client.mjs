export const ONRAMP_COUNTRIES = Object.freeze([
  ['CO', 'Colombia'], ['US', 'Estados Unidos'], ['MX', 'México'], ['ES', 'España'], ['GB', 'Reino Unido'],
  ['BR', 'Brasil'], ['AR', 'Argentina'], ['CL', 'Chile'], ['PE', 'Perú'], ['EC', 'Ecuador'],
  ['PA', 'Panamá'], ['CR', 'Costa Rica'], ['DO', 'República Dominicana'], ['GT', 'Guatemala'], ['UY', 'Uruguay'],
]);
export const ONRAMP_CRYPTO = 'USDT_POLYGON';

/** @param {string} country @param {{signal?: AbortSignal}} [options] */
export async function readOnrampAvailability(country, { signal } = {}) {
  return request(`/api/member/onramp/availability?country=${encodeURIComponent(country)}&fiat=USD&crypto=${ONRAMP_CRYPTO}`, { method: 'GET', signal });
}

/** @param {Record<string, unknown>} input @param {{signal?: AbortSignal}} [options] */
export async function createOnrampQuote(input, { signal } = {}) {
  return request('/api/member/onramp/quote', {
    method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
  });
}

/** @param {Record<string, unknown>} input @param {{signal?: AbortSignal}} [options] */
export async function createOnrampIntent(input, { signal } = {}) {
  return request('/api/member/onramp/intent', {
    method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
  });
}

async function request(path, init) {
  const response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'onramp_unavailable');
  return data;
}
