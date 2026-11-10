import { administrativeSandboxOptions, fundingAcknowledgement, fundingHistory, fundingInput } from './wallet-funding-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

export function fundingRequestId() { return crypto.randomUUID(); }

/** @param {Record<string, unknown>} input @param {{signal?: AbortSignal}} [options] */
export async function createPersonalFundingIntent(input, options = {}) {
  return createFunding(input, 'personal', '/api/member/wallet-funding/personal/intent', options);
}

/** @param {Record<string, unknown>} input @param {{signal?: AbortSignal}} [options] */
export async function createAdministrativeSandboxSession(input, options = {}) {
  return createFunding(input, 'administrative', '/api/member/wallet-funding/administrative/session', options);
}

/** @param {string} country @param {string} serviceProvider @param {{signal?: AbortSignal}} [options] */
export async function readAdministrativeSandboxOptions(country, serviceProvider, { signal } = {}) {
  if (!administrativeSandboxOptions({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld', country, serviceProvider, paymentMethods: [] })) {
    throw new Error('invalid_request');
  }
  const data = administrativeSandboxOptions(await request(`/api/member/wallet-funding/administrative/options?country=${country}&serviceProvider=${serviceProvider}`,
    { method: 'GET', signal }));
  if (!data || data.country !== country || data.serviceProvider !== serviceProvider) throw new Error('funding_unavailable');
  return data;
}

/** @param {'personal' | 'administrative'} kind @param {{signal?: AbortSignal}} [options] */
export async function readWalletFundingHistory(kind, { signal } = {}) {
  if (!['personal', 'administrative'].includes(kind)) throw new Error('invalid_request');
  const data = fundingHistory(await request(`/api/member/wallet-funding/history?walletKind=${kind}`, { method: 'GET', signal }), kind);
  if (!data) throw new Error('funding_unavailable');
  return data;
}

/** @param {Record<string, unknown>} input @param {string} kind @param {string} path @param {{signal?: AbortSignal}} options */
async function createFunding(input, kind, path, { signal } = {}) {
  const body = fundingInput(input, kind);
  if (!body) throw new Error('invalid_request');
  const data = fundingAcknowledgement(await request(path, { method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), kind);
  if (!data || data.requestedAmount !== body.amount || data.checkoutReference !== body.requestId) throw new Error('funding_unavailable');
  return data;
}

async function request(path, init) {
  const deadline = browserRequestDeadline(init.signal, 25_000);
  try {
    const response = await fetch(path, { ...init, signal: deadline.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    const text = await response.text();
    if (text.length > 65536) throw new Error('funding_unavailable');
    const data = JSON.parse(text);
    if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'funding_unavailable');
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    return data;
  } finally { deadline.dispose(); }
}
