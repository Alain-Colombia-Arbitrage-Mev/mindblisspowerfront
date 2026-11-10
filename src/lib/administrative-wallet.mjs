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
  const response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'administrative_wallet_unavailable');
  return data;
}
