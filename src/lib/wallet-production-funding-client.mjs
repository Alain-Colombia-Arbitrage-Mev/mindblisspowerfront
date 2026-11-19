import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { sandboxWalletAddress } from './sandbox-wallet-contract.mjs';
import { WALLET_PRODUCTION_PATH as base, walletProductionSubject, walletProductionInput, walletProductionDiscovery, walletProductionOptions,
  walletProductionQuote, walletProductionAcknowledgement, walletProductionStatus, walletProductionHistory } from './wallet-production-funding-contract.mjs';
const check = value => { if (!value) throw Error('wallet_production_unavailable'); return value; };
/** @typedef {{ signal?: AbortSignal, body?: unknown, ownerSubject?: string }} ProductionWalletRequest */
/** @param {string} suffix @param {ProductionWalletRequest} [options] */
async function request(suffix, { signal, body, ownerSubject } = {}) {
  const subject = walletProductionSubject(ownerSubject); if (!subject) throw Error('unauthenticated');
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const deadline = browserRequestDeadline(signal, 45000);
  try {
    const response = await fetch(`${base}${suffix}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      signal: deadline.signal, headers: { 'x-mindbliss-wallet-subject': subject, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text(); if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (text.length > 131072) throw Error('wallet_production_unavailable');
    let value; try { value = JSON.parse(text); } catch { throw Error('wallet_production_unavailable'); }
    if (!response.ok) throw Object.assign(Error(typeof value?.error === 'string' && /^[a-z0-9_]{1,80}$/.test(value.error) ? value.error : 'wallet_production_unavailable'), { status: response.status });
    return value;
  } finally { deadline.dispose(); }
}
/** @param {string} country @param {ProductionWalletRequest} [options] */
export async function readProductionDiscovery(country = '', options = {}) {
  if (country && !/^[A-Z]{2}$/.test(country)) throw Error('invalid_request');
  return check(walletProductionDiscovery(await request(`/discovery${country ? `?country=${country}` : ''}`, options), country));
}
export async function readProductionOptions(country, sourceCurrencyCode, options = {}) {
  if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(sourceCurrencyCode)) throw Error('invalid_request');
  const safe = walletProductionOptions(await request(`/options?${new URLSearchParams({ country, sourceCurrencyCode })}`, options));
  return check(safe?.country === country && safe.sourceCurrencyCode === sourceCurrencyCode ? safe : null);
}
export async function quoteProductionFunding(input, address, options = {}) {
  const body = walletProductionInput(input); if (!body || !sandboxWalletAddress(address)) throw Error('invalid_request');
  return check(walletProductionQuote(await request('/quote', { ...options, body }), body, address));
}
export async function createProductionFunding(input, address, options = {}) {
  const body = walletProductionInput(input, true); if (!body || !sandboxWalletAddress(address)) throw Error('invalid_request');
  const safe = walletProductionAcknowledgement(await request('/session', { ...options, body }), body);
  return check(safe?.destination.address === address.toLowerCase() ? safe : null);
}
export const readProductionHistory = async options => check(walletProductionHistory(await request('/history', options)));
export async function readProductionStatus(reference, options = {}) {
  if (!FUNDING_UUID.test(reference || '')) throw Error('invalid_request');
  const safe = walletProductionStatus(await request(`/status?checkoutReference=${reference}`, options));
  return check(safe?.checkoutReference === reference.toLowerCase() ? safe : null);
}
