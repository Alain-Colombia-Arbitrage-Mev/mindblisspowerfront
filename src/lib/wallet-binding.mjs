import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { WALLET_GATEWAY_FAILURE_REASONS } from './wallet-funding-contract.mjs';

const ADDRESS = /^0x[0-9a-f]{40}$/i;
const SAFE_ERRORS = new Set(['unauthenticated', 'invalid_origin', 'invalid_request', 'wallet_link_rate_limited',
  'wallet_already_linked', 'wallet_address_in_use', 'invalid_wallet_address', 'wallet_challenge_invalid',
  'wallet_signature_invalid', 'wallet_identity_unavailable', 'wallet_link_unavailable']);

export class WalletBindingError extends Error {
  constructor(code = "wallet_link_unavailable", status = 0, reason = '') {
    super(code);
    this.name = "WalletBindingError";
    this.code = code;
    this.status = status;
    this.reason = WALLET_GATEWAY_FAILURE_REASONS.includes(reason) ? reason : '';
  }
}

/**
 * Read the server-verified wallet binding. This never infers ownership from
 * AppKit's connected account: only the authenticated backend may mark it linked.
 * @param {{fetchImpl?: typeof fetch, signal?: AbortSignal}} [options]
 */
export async function readWalletBinding({ fetchImpl = fetch, signal } = {}) {
  const data = await bindingRequest('/api/member/wallet-link', { method: 'GET', signal }, fetchImpl);
  if (data?.linked === false) return { linked: false, address: "" };
  if (data?.linked === true && ADDRESS.test(data.address || "")) {
    return { linked: true, address: data.address };
  }
  throw new WalletBindingError("wallet_link_unavailable", 502);
}

/** Ownership verification is separate from connecting an AppKit account. */
/** @param {string} path @param {Record<string, unknown>} body @param {{fetchImpl?: typeof fetch, signal?: AbortSignal}} [options] */
export async function requestWalletLink(path, body, { fetchImpl = fetch, signal } = {}) {
  if (!['/api/member/wallet-link/challenge', '/api/member/wallet-link/confirm'].includes(path)) {
    throw new WalletBindingError('invalid_request', 400);
  }
  return bindingRequest(path, { method: 'POST', signal, headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body) }, fetchImpl);
}

async function bindingRequest(path, init, fetchImpl) {
  const deadline = browserRequestDeadline(init.signal, 15_000);
  try {
    const response = await fetchImpl(path, { ...init, signal: deadline.signal, cache: 'no-store',
      credentials: 'same-origin', redirect: 'error' });
    const raw = await response.text();
    if (raw.length > 16_384) throw new WalletBindingError('wallet_link_unavailable', 502);
    let data;
    try { data = JSON.parse(raw); } catch { throw new WalletBindingError('wallet_link_unavailable', 502); }
    if (!response.ok) throw new WalletBindingError(SAFE_ERRORS.has(data?.error) ? data.error : 'wallet_link_unavailable', response.status, data?.reason);
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    return data;
  } finally { deadline.dispose(); }
}

export function walletBindingFailure(error) {
  if (error?.name === "AbortError") return "aborted";
  if (error?.status === 401 || error?.code === "unauthenticated") return "session";
  if (error?.code === 'wallet_identity_unavailable') return 'identity';
  if (error?.code === 'invalid_origin') return 'origin';
  return "unavailable";
}
