import { administrativeSandboxOptions, personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingInput, fundingStatus, fundingCurrencyCode, fundingSourceSupported, FUNDING_UUID, PERSONAL_FUNDING_DESTINATION } from './wallet-funding-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

export function fundingRequestId() { return crypto.randomUUID(); }

/** @param {Record<string, unknown>} input @param {{signal?: AbortSignal}} [options] */
export async function createPersonalFundingIntent(input, options = {}) {
  const data = await createFunding(input, 'personal', '/api/member/wallet-funding/personal/intent', options);
  if (!('paymentMethodType' in data) || !('allowedProviders' in data)) throw new Error('funding_unavailable');
  return data;
}

/** @param {Record<string, unknown>} input @param {{signal?: AbortSignal}} [options] */
export async function createAdministrativeSandboxSession(input, options = {}) {
  return createFunding(input, 'administrative', '/api/member/wallet-funding/administrative/session', options);
}

/** @param {string} country @param {string} serviceProvider @param {{signal?: AbortSignal, sourceCurrencyCode?: string}} [options] */
export async function readAdministrativeSandboxOptions(country, serviceProvider, { signal, sourceCurrencyCode = 'USD' } = {}) {
  if (!administrativeSandboxOptions({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld', country, sourceCurrencyCode, serviceProvider, paymentMethods: [], routes: [] })) {
    throw new Error('invalid_request');
  }
  const data = administrativeSandboxOptions(await request(`/api/member/wallet-funding/administrative/options?country=${country}&sourceCurrencyCode=${sourceCurrencyCode}&serviceProvider=${serviceProvider}`,
    { method: 'GET', signal }));
  if (!data || data.country !== country || data.sourceCurrencyCode !== sourceCurrencyCode || data.serviceProvider !== serviceProvider) throw new Error('funding_unavailable');
  return data;
}

/** Production discovery uses Reown's merchant configuration, never administrative MELD credentials. */
/** @param {string} country @param {{signal?: AbortSignal, sourceCurrencyCode?: string}} [options] */
export async function readPersonalFundingOptions(country, { signal, sourceCurrencyCode = 'USD' } = {}) {
  if (!personalProductionOptions({ walletKind: 'personal', environment: 'production', provider: 'reown', country, sourceCurrencyCode, paymentMethods: [], routes: [], ...PERSONAL_FUNDING_DESTINATION })) {
    throw new Error('invalid_request');
  }
  const deadline = browserRequestDeadline(signal, 25_000);
  try {
    let raw;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        raw = await request(`/api/member/wallet-funding/personal/options?country=${country}&sourceCurrencyCode=${sourceCurrencyCode}`, { method: 'GET', signal: deadline.signal });
        break;
      } catch (error) {
        // Only this public route lookup is replayable. Payment writes, session
        // failures, throttling and malformed success contracts never retry.
        if (attempt || deadline.signal.aborted || !(error instanceof TypeError || [502, 503, 504].includes(error?.status))) throw error;
        await fundingReadRetryDelay(deadline.signal);
      }
    }
    const data = personalProductionOptions(raw);
    if (!data || data.country !== country || data.sourceCurrencyCode !== sourceCurrencyCode) throw new Error('funding_unavailable');
    return data;
  } finally { deadline.dispose(); }
}

function fundingReadRetryDelay(signal) {
  return new Promise((resolve, reject) => {
    let timer;
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')); };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(undefined); }, 250);
  });
}

/** @param {'personal' | 'administrative'} kind @param {{signal?: AbortSignal}} [options] */
export async function readWalletFundingHistory(kind, { signal } = {}) {
  if (!['personal', 'administrative'].includes(kind)) throw new Error('invalid_request');
  const data = fundingHistory(await request(`/api/member/wallet-funding/history?walletKind=${kind}`, { method: 'GET', signal }), kind);
  if (!data) throw new Error('funding_unavailable');
  return data;
}

/** An owner's persisted request and destination. A return URL is not payment evidence.
 * @param {'personal' | 'administrative'} kind
 * @param {string} checkoutReference
 * @param {{signal?: AbortSignal}} [options]
 */
export async function readWalletFundingStatus(kind, checkoutReference, { signal } = {}) {
  if (!['personal', 'administrative'].includes(kind) || typeof checkoutReference !== 'string'
    || checkoutReference.length !== 36 || !FUNDING_UUID.test(checkoutReference)) throw new Error('invalid_request');
  const reference = checkoutReference.toLowerCase();
  const data = fundingStatus(await request(`/api/member/wallet-funding/${kind}/status?checkoutReference=${reference}`, { method: 'GET', signal }), kind);
  if (!data || data.checkoutReference !== reference) throw new Error('funding_unavailable');
  return data;
}

/** @param {Record<string, unknown>} input @param {string} kind @param {string} path @param {{signal?: AbortSignal}} options */
async function createFunding(input, kind, path, { signal } = {}) {
  const body = fundingInput(input, kind);
  if (!body) throw new Error('invalid_request');
  // SPEI uses the provider's MXN limits and is recorded as MXN, never USD.
  if (!fundingSourceSupported(body, kind)) throw new Error('wallet_funding_valuation_unavailable');
  const data = fundingAcknowledgement(await request(path, { method: 'POST', signal,
    headers: { 'content-type': 'application/json', ...(kind === 'personal' ? { 'x-mindbliss-wallet-network': 'polygon' } : {}) },
    body: JSON.stringify(body) }), kind, body.country);
  if (!data || data.requestedAmount !== body.amount || data.checkoutReference !== body.requestId
    || fundingCurrencyCode(data.sourceCurrencyCode) !== fundingCurrencyCode(body.sourceCurrencyCode)
    || (kind === 'personal' && (!('paymentMethodType' in data) || data.paymentMethodType !== body.paymentMethodType
      || !('destination' in data) || data.destination.address.toLowerCase() !== body.walletAddress.toLowerCase()))) throw new Error('funding_unavailable');
  return data;
}

async function request(path, init) {
  const deadline = browserRequestDeadline(init.signal, 25_000);
  try {
    const response = await fetch(path, { ...init, signal: deadline.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    const text = await response.text();
    if (text.length > 65536) throw new Error('funding_unavailable');
    let data;
    try { data = JSON.parse(text); }
    catch { throw Object.assign(new Error('funding_unavailable'), { status: response.status }); }
    if (!response.ok) throw Object.assign(new Error(typeof data?.error === 'string' && /^[a-z0-9_]{1,80}$/.test(data.error) ? data.error : 'funding_unavailable'), { status: response.status });
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    return data;
  } finally { deadline.dispose(); }
}
