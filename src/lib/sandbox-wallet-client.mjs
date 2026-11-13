import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { SANDBOX_WALLET_PATH as base, SANDBOX_WALLET_COUNTRIES, sandboxWalletSubjectHeader, sandboxWalletAddress, sandboxWalletCapabilities, sandboxWalletStatus, sandboxWalletChallengeInput, sandboxWalletVerifyInput,
  sandboxWalletChallenge, sandboxWalletFundingInput, sandboxWalletOptions, sandboxWalletAcknowledgement, sandboxWalletHistory, sandboxWalletFundingStatus } from './sandbox-wallet-contract.mjs';

const check = value => { if (!value) throw Error('sandbox_wallet_unavailable'); return value; };
/** @typedef {{ signal?: AbortSignal, body?: unknown, ownerSubject?: string }} SandboxRequestOptions */
/** @param {string} suffix @param {SandboxRequestOptions} [options] */
async function request(suffix, { signal, body, ownerSubject } = {}) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const subjectHeader = sandboxWalletSubjectHeader(ownerSubject);
  if (!subjectHeader) throw Error('unauthenticated');
  const deadline = browserRequestDeadline(signal, 30_000);
  try {
    const response = await fetch(`${base}${suffix}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      signal: deadline.signal, headers: { 'x-mindbliss-sandbox-subject': subjectHeader, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (text.length > 131072) throw Error('sandbox_wallet_unavailable');
    let value; try { value = JSON.parse(text); } catch { throw Error('sandbox_wallet_unavailable'); }
    if (!response.ok) throw Object.assign(Error(typeof value?.error === 'string' && /^[a-z0-9_]{1,80}$/.test(value.error) ? value.error : 'sandbox_wallet_unavailable'), { status: response.status });
    return value;
  } finally { deadline.dispose(); }
}
export const readSandboxWalletCapabilities = async options => check(sandboxWalletCapabilities(await request('/capabilities', options)));
export const readSandboxWalletStatus = async options => check(sandboxWalletStatus(await request('/status', options)));
/** @param {string} address @param {SandboxRequestOptions} [options] */
export async function requestSandboxWalletChallenge(address, { signal, ownerSubject } = {}) {
  const body = sandboxWalletChallengeInput({ address }); if (!body) throw Error('invalid_request');
  return check(sandboxWalletChallenge(await request('/challenge', { signal, ownerSubject, body }), body.address));
}
/** @param {unknown} input @param {string} address @param {SandboxRequestOptions} [options] */
export async function verifySandboxWallet(input, address, { signal, ownerSubject } = {}) {
  const body = sandboxWalletVerifyInput(input); if (!body || !sandboxWalletAddress(address)) throw Error('invalid_request');
  const state = sandboxWalletStatus(await request('/verify', { signal, ownerSubject, body }));
  return check(state?.status === 'linked' && 'address' in state && state.verified && state.address === address.toLowerCase() ? state : null);
}
/** @param {string} country @param {string} serviceProvider @param {SandboxRequestOptions & { sourceCurrencyCode?: string }} [options] */
export async function readSandboxWalletOptions(country, serviceProvider, { signal, ownerSubject, sourceCurrencyCode = 'USD' } = {}) {
  if (serviceProvider !== 'TRANSAK' || !SANDBOX_WALLET_COUNTRIES.includes(country) || !(sourceCurrencyCode === 'USD' || (country === 'MX' && sourceCurrencyCode === 'MXN'))) throw Error('invalid_request');
  const safe = sandboxWalletOptions(await request(`/funding/options?${new URLSearchParams({ country, sourceCurrencyCode })}`, { signal, ownerSubject }));
  return check(safe?.country === country && safe.sourceCurrencyCode === sourceCurrencyCode ? safe : null);
}
/** @param {unknown} input @param {string} expectedAddress @param {SandboxRequestOptions} [options] */
export async function createSandboxWalletCheckout(input, expectedAddress, { signal, ownerSubject } = {}) {
  const body = sandboxWalletFundingInput(input); if (!body || !sandboxWalletAddress(expectedAddress)) throw Error('invalid_request');
  const safe = sandboxWalletAcknowledgement(await request('/funding/session', { signal, ownerSubject, body }), body);
  return check(safe?.destination.address === expectedAddress.toLowerCase() ? safe : null);
}
/** @param {string} reference @param {SandboxRequestOptions} [options] */
export async function readSandboxWalletFundingStatus(reference, { signal, ownerSubject } = {}) {
  if (!FUNDING_UUID.test(reference || '')) throw Error('invalid_request');
  const safe = sandboxWalletFundingStatus(await request(`/funding/status?checkoutReference=${encodeURIComponent(reference)}`, { signal, ownerSubject }));
  return check(safe?.checkoutReference === reference.toLowerCase() ? safe : null);
}
export const readSandboxWalletFundingHistory = async options => check(sandboxWalletHistory(await request('/funding/history', options)));
