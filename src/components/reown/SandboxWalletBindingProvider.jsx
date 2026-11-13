'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useMemberSession } from '@/lib/member-session-context';
import { walletReownOwnerKey } from '@/lib/wallet-reown-connection.mjs';
import { useWalletReown } from './WalletReownContext';
import { readSandboxWalletStatus, requestSandboxWalletChallenge, verifySandboxWallet } from '@/lib/sandbox-wallet-client.mjs';
import { readAdministrativeProvider, switchAdministrativeProviderNetwork, administrativeProviderMatches, signAdministrativeOwnership } from '@/lib/administrative-injected-provider.mjs';
import { subscribeMemberLogout } from '@/lib/member-logout-sync.mjs';
import { subscribeMemberSessionReplacement } from '@/lib/member-session-sync.mjs';

/** @type {{loading: boolean, configured: boolean, status: string, address: string, linkedAddress: string, verified: boolean,
 * expiresAt: string, error: string, busy: boolean, mismatch: boolean, canFund: () => boolean,
 * refresh: () => Promise<void>, activate: () => Promise<void>, retire: () => void, invalidateActivation: () => void}} */
const empty = Object.freeze({ loading: false, configured: false, status: 'unlinked', address: '', linkedAddress: '', verified: false,
  expiresAt: '', error: '', busy: false, mismatch: false, canFund: () => false, refresh: async () => {}, activate: async () => {}, retire: () => {}, invalidateActivation: () => {} });
export const SandboxWalletBindingContext = createContext(empty);
export function useSandboxWalletBinding() { return useContext(SandboxWalletBindingContext); }
const sameAddress = (a, b) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());
export function sandboxWalletBindingError(error) {
  const code = error?.message;
  if (['unauthenticated', 'sandbox_wallet_forbidden', 'wallet_reown_session_changed'].includes(code)) return 'sessionChanged';
  if (code === 'sandbox_wallet_unconfigured') return 'unconfigured';
  if (code === 'sandbox_wallet_address_in_use') return 'addressUsed';
  if (code === 'sandbox_wallet_already_linked') return 'mismatch';
  if (code === 'sandbox_wallet_invalid_challenge' || code === 'sandbox_wallet_verification_required') return 'expired';
  if (code === 'sandbox_wallet_rate_limited') return 'rateLimited';
  return 'unavailable';
}

export default function SandboxWalletBindingProvider({ children }) {
  const session = useMemberSession(), owner = walletReownOwnerKey(session);
  return owner ? <OwnedSandboxWalletBinding key={owner} owner={owner} ownerSubject={session.subject}>{children}</OwnedSandboxWalletBinding>
    : <SandboxWalletBindingContext.Provider value={empty}>{children}</SandboxWalletBindingContext.Provider>;
}

export function OwnedSandboxWalletBinding({ owner, ownerSubject, children }) {
  const reown = useWalletReown(), mounted = useRef(false), epoch = useRef(0), request = useRef(null), locked = useRef(false);
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [retired, setRetired] = useState(false);
  const live = useRef(null);
  live.current = { owner, ownerSubject, reown, data, retired };
  const current = useCallback((generation, address = '', provider = null) => mounted.current && !locked.current && epoch.current === generation
    && live.current.owner === owner && (!address || sameAddress(live.current.reown.address, address))
    && (!provider || live.current.reown.provider === provider), [owner]);
  const canFund = useCallback(() => {
    const state = live.current, wallet = state?.reown, binding = state?.data;
    return Boolean(mounted.current && !locked.current && !request.current && state?.owner === owner && !state.retired && binding?.configured
      && binding.status === 'linked' && binding.verified && Date.parse(binding.expiresAt) > Date.now()
      && wallet?.isConnected && wallet.chainId === 137 && wallet.provider && sameAddress(wallet.address, binding.address));
  }, [owner]);
  const retire = useCallback(() => {
    locked.current = true; epoch.current++; request.current?.controller.abort(); request.current = null;
    if (mounted.current) { setData(null); setLoading(false); setBusy(false); setRetired(true); setError('sessionChanged'); }
  }, []);
  const fail = useCallback(failure => { const reason = sandboxWalletBindingError(failure); if (reason === 'sessionChanged') retire(); else setError(reason); }, [retire]);
  const refresh = useCallback(async () => {
    if (!mounted.current || locked.current || request.current) return;
    const controller = new AbortController(), generation = ++epoch.current, operation = { controller };
    request.current = operation; setLoading(true); setError('');
    try { const next = await readSandboxWalletStatus({ signal: controller.signal, ownerSubject });
      if (current(generation) && !controller.signal.aborted) setData(next);
    } catch (failure) { if (current(generation) && !controller.signal.aborted) { setData(null); fail(failure); } }
    finally { if (request.current === operation) { request.current = null; if (mounted.current) setLoading(false); } }
  }, [ownerSubject, current, fail]);
  useEffect(() => {
    mounted.current = true; void refresh();
    const stopLogout = subscribeMemberLogout(retire), stopReplacement = subscribeMemberSessionReplacement(retire);
    return () => { mounted.current = false; epoch.current++; request.current?.controller.abort(); request.current = null; stopLogout(); stopReplacement(); };
  }, [refresh, retire]);
  useEffect(() => {
    const operation = request.current;
    if (operation?.address && (!sameAddress(operation.address, reown.address) || operation.provider !== reown.provider || !reown.isConnected)) {
      epoch.current++; operation.controller.abort(); request.current = null; setBusy(false); setError('connectionChanged');
    }
  }, [reown.address, reown.provider, reown.isConnected]);

  const activate = useCallback(async () => {
    const wallet = live.current?.reown, binding = live.current?.data;
    if (!mounted.current || locked.current || request.current || !binding?.configured || !wallet?.isConnected || !wallet.provider || !wallet.address) return;
    if (binding.status === 'linked' && !sameAddress(binding.address, wallet.address)) { setError('mismatch'); return; }
    const address = wallet.address, provider = wallet.provider, controller = new AbortController(), generation = ++epoch.current;
    const operation = { controller, address, provider }; request.current = operation; setBusy(true); setError('');
    try {
      const before = await readAdministrativeProvider(provider, { signal: controller.signal });
      if (!current(generation, address, provider) || controller.signal.aborted) return;
      if (before.chainId !== '0x89') {
        await switchAdministrativeProviderNetwork(provider, { signal: controller.signal });
        if (current(generation, address, provider) && !controller.signal.aborted) setError('networkUpdated');
        return;
      }
      if (!administrativeProviderMatches(before, address)) throw Error('wallet_reown_session_changed');
      const challenge = await requestSandboxWalletChallenge(address, { signal: controller.signal, ownerSubject });
      if (!current(generation, address, provider) || controller.signal.aborted) return;
      const signature = await signAdministrativeOwnership(provider, challenge.message, address, { signal: controller.signal });
      if (!current(generation, address, provider) || controller.signal.aborted) return;
      const next = await verifySandboxWallet({ challengeId: challenge.challengeId, signature }, address, { signal: controller.signal, ownerSubject });
      if (current(generation, address, provider) && !controller.signal.aborted) setData(next);
    } catch (failure) { if (current(generation, address, provider) && !controller.signal.aborted) fail(failure); }
    finally { if (request.current === operation) { request.current = null; if (mounted.current) setBusy(false); } }
  }, [ownerSubject, current, fail]);

  const verified = Boolean(data?.verified && Date.parse(data.expiresAt) > Date.now());
  const mismatch = Boolean(data?.status === 'linked' && reown.isConnected && !sameAddress(data.address, reown.address));
  const invalidateActivation = useCallback(() => { setData(previous => previous ? { ...previous, verified: false, expiresAt: undefined } : previous); }, []);
  const value = useMemo(() => ({ loading, configured: data?.configured === true, status: retired ? 'retired' : data?.status || 'unlinked',
    address: retired ? '' : data?.address || (reown.isConnected ? reown.address : ''), linkedAddress: retired ? '' : data?.address || '',
    verified, expiresAt: data?.expiresAt || '', error, busy, mismatch, canFund, refresh, activate, retire, invalidateActivation }),
  [loading, data, retired, reown.isConnected, reown.address, verified, error, busy, mismatch, canFund, refresh, activate, retire, invalidateActivation]);
  return <SandboxWalletBindingContext.Provider value={value}>{children}</SandboxWalletBindingContext.Provider>;
}
