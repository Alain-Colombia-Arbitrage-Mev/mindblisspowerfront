import { solanaWalletLinkInput, solanaWalletLinkView } from './solana-wallet-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

const safeErrors = new Set(['unauthenticated', 'invalid_request', 'invalid_origin', 'wallet_link_rate_limited', 'wallet_already_linked',
  'wallet_address_in_use', 'invalid_wallet_address', 'wallet_challenge_invalid', 'wallet_signature_invalid',
  'wallet_identity_unavailable', 'wallet_link_unavailable', 'solana_wallet_unavailable']);
/** @param {string} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
async function request(action, input, { signal, fetchImpl = fetch } = {}) {
  const body = action === 'status' ? null : solanaWalletLinkInput(action, input);
  if (action !== 'status' && !body) throw new Error('invalid_request');
  const deadline = browserRequestDeadline(signal, 20_000);
  try {
    const response = await fetchImpl(`/api/member/solana-wallet-link${action === 'status' ? '' : `/${action}`}`, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline.signal,
      ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const raw = await response.text();
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (raw.length > 16384) throw new Error('solana_wallet_unavailable');
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error('solana_wallet_unavailable'); }
    if (!response.ok) throw Object.assign(new Error(safeErrors.has(data?.error) ? data.error : 'solana_wallet_unavailable'), { status: response.status });
    const safe = solanaWalletLinkView(action, data);
    if (!safe || (action === 'challenge' && safe.address !== body.address)) throw new Error('solana_wallet_unavailable');
    return safe;
  } finally { deadline.dispose(); }
}
/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export const readSolanaWalletLink = (options = {}) => request('status', null, options);
/** @param {string} action @param {object} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export function requestSolanaWalletLink(action, input, options = {}) {
  if (!['challenge', 'confirm'].includes(action)) return Promise.reject(new Error('invalid_request'));
  return request(action, input, options);
}
