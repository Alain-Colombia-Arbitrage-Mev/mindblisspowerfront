import { browserRequestDeadline } from './browser-request-deadline.mjs';

export const ADMINISTRATIVE_WALLET_ASSET = 'USDT';
export const ADMINISTRATIVE_WALLET_MELD_ASSET = 'USDT_POLYGON';
export const ADMINISTRATIVE_WALLET_NETWORK = 'Polygon';
export const ADMINISTRATIVE_WALLET_MINIMUM_USD = 50;

/** @param {{signal?: AbortSignal}} [options] */
export async function readAdministrativeWallet({ signal } = {}) {
  return administrativeWalletRequest('/api/member/administrative-wallet', { method: 'GET', signal });
}

/** @param {{signal?: AbortSignal}} [options] */
export async function ensureAdministrativeWallet({ signal } = {}) {
  return administrativeWalletRequest('/api/member/administrative-wallet/ensure', {
    method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: '{}',
  });
}

async function administrativeWalletRequest(path, init) {
  const deadline = browserRequestDeadline(init.signal, 25_000);
  try {
    const response = await fetch(path, { ...init, signal: deadline.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = typeof data?.error === 'string' ? data.error : 'administrative_wallet_unavailable';
      throw Object.assign(new Error(code), { code, status: response.status });
    }
    if (!data || !['assigned', 'pending', 'exhausted'].includes(data.status) || data.addressFamily !== 'EVM' || data.asset !== 'USDT'
      || (data.status !== 'assigned' && (data.address !== undefined || data.checkoutReference !== undefined))
      || (data.status === 'assigned' && (!/^0x[0-9a-f]{40}$/i.test(data.address || '') || typeof data.checkoutReference !== 'string'
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.checkoutReference)
        || !Number.isFinite(Date.parse(data.assignedAt))))) throw new Error('administrative_wallet_unavailable');
    return data;
  } finally { deadline.dispose(); }
}
