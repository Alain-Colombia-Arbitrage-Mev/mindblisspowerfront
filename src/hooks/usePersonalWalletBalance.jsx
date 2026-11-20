"use client";

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useMemberSession } from '@/lib/member-session-context';
import { EMPTY_PERSONAL_BALANCE, personalWalletBalanceSessionKey, personalWalletBalanceStore as store } from '@/lib/personal-wallet-balance-store.mjs';

export function usePersonalWalletBalance(expectedAddress = '', network = 'ethereum', enabled = true, asset = 'USDT') {
  const session = useMemberSession();
  const key = enabled ? personalWalletBalanceSessionKey(session) : '';
  const address = typeof expectedAddress === 'string' ? expectedAddress.toLowerCase() : '';
  const subscribe = useCallback(listener => store.subscribe(key, listener), [key]);
  const getSnapshot = useCallback(() => store.get(key, network, asset), [key, network, asset]);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_PERSONAL_BALANCE);
  const refresh = useCallback(() => store.refresh(key), [key]);
  useEffect(() => {
    if (key) void store.refresh(key, Boolean(address && store.get(key).walletAddress && address !== store.get(key).walletAddress));
  }, [key, address]);
  const invalid = !['ethereum', 'polygon'].includes(network) || (asset !== 'USDT' && !(network === 'polygon' && asset === 'USDC'))
    || (address && (!/^0x[0-9a-f]{40}$/.test(address) || (value.walletAddress && address !== value.walletAddress)));
  if (invalid) return { ...EMPTY_PERSONAL_BALANCE, error: 'personal_wallet_balance_mismatch', refresh };
  if (!key) return { ...EMPTY_PERSONAL_BALANCE, loading: enabled && session === null, refresh };
  return { ...value, refresh };
}
