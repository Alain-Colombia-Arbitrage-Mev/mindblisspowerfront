import { PERSONAL_COMPANY_PAYMENT, LEGACY_POLYGON_COMPANY_PAYMENT, personalCompanyPaymentAtomic } from './personal-company-payment-values.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

/** Read-only onchain funds, separate from the administrative wallet or internal ledger. */
export function personalWalletBalance(value, network = 'ethereum') {
  const policy = network === 'ethereum' ? PERSONAL_COMPANY_PAYMENT : network === 'polygon' ? LEGACY_POLYGON_COMPANY_PAYMENT : null;
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== 'personal'
    || !policy || value.network !== network || value.asset !== 'USDT'
    || typeof value.walletAddress !== 'string' || !/^0x[0-9a-f]{40}$/.test(value.walletAddress)
    || value.chainId !== policy.chainId || value.tokenAddress !== policy.tokenAddress
    || value.tokenDecimals !== policy.tokenDecimals
    || personalCompanyPaymentAtomic(value.balanceAtomic, true) === null
    || personalCompanyPaymentAtomic(value.nativeBalanceAtomic, true) === null
    || typeof value.observedAt !== 'string' || value.observedAt.length > 64 || !Number.isFinite(Date.parse(value.observedAt))) return null;
  return { walletKind: 'personal', walletAddress: value.walletAddress, network, asset: 'USDT',
    chainId: policy.chainId, tokenAddress: policy.tokenAddress,
    tokenDecimals: policy.tokenDecimals, balanceAtomic: value.balanceAtomic, nativeBalanceAtomic: value.nativeBalanceAtomic,
    observedAt: value.observedAt };
}

export function personalWalletBalances(value) {
  if (!value || value.walletKind !== 'personal' || typeof value.walletAddress !== 'string' || !/^0x[0-9a-f]{40}$/.test(value.walletAddress)
    || !Array.isArray(value.balances) || value.balances.length !== 2) return null;
  const balances = ['ethereum', 'polygon'].map(network => {
    const items = value.balances.filter(item => item?.network === network);
    if (items.length !== 1 || items[0].walletAddress !== value.walletAddress) return null;
    const item = items[0];
    if (item.error !== undefined) {
      if (item.error !== 'company_payment_rpc_unavailable' || item.balanceAtomic !== null || item.nativeBalanceAtomic !== null || item.observedAt !== null) return null;
      const safe = personalWalletBalance({ ...item, balanceAtomic: '0', nativeBalanceAtomic: '0', observedAt: '2026-01-01T00:00:00Z' }, network);
      return safe ? { ...safe, balanceAtomic: null, nativeBalanceAtomic: null, observedAt: null, error: item.error } : null;
    }
    return personalWalletBalance(item, network);
  });
  return balances.some(item => !item) ? null : { walletKind: 'personal', walletAddress: value.walletAddress, balances };
}

/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export function readPersonalWalletBalance(options = {}) {
  return balanceRequest('/api/member/company-payments/balance', personalWalletBalance, options);
}
/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export function readPersonalWalletBalances(options = {}) {
  return balanceRequest('/api/member/company-payments/balances', personalWalletBalances, options);
}
/** @param {string} path @param {(value: any) => any} validate @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} options */
async function balanceRequest(path, validate, { signal, fetchImpl = fetch } = {}) {
  const deadline = browserRequestDeadline(signal, 20_000);
  try {
    const response = await fetchImpl(path, { method: 'GET', credentials: 'same-origin',
      cache: 'no-store', redirect: 'error', signal: deadline.signal });
    const raw = await response.text();
    if (raw.length > 8192) throw new Error('company_payment_unavailable');
    let body;
    try { body = JSON.parse(raw); } catch { throw new Error('company_payment_unavailable'); }
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!response.ok) throw new Error(['unauthenticated', 'company_payment_forbidden', 'company_payment_wallet_not_linked',
      'company_payment_unconfigured', 'company_payment_rpc_unavailable'].includes(body?.error) ? body.error : 'company_payment_unavailable');
    const safe = validate(body);
    if (!safe) throw new Error('company_payment_unavailable');
    return safe;
  } finally { deadline.dispose(); }
}
