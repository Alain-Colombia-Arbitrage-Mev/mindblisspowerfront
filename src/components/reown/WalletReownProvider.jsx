'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAppKit, useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider, useAppKitState } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { polygon } from '@reown/appkit/networks';
import { useMemberSession } from '@/lib/member-session-context';
import { subscribeMemberLogout } from '@/lib/member-logout-sync.mjs';
import { subscribeMemberSessionReplacement } from '@/lib/member-session-sync.mjs';
import { browserRequestDeadline } from '@/lib/browser-request-deadline.mjs';
import { walletReownConfiguration } from '@/lib/wallet-reown-config.mjs';
import { createWalletReownBoundary, forgetWalletReownOwner, guardWalletReownProvider, readWalletReownOwner,
  rememberWalletReownOwner, walletReownAddress, walletReownChainId, walletReownOwnerFingerprint, walletReownOwnerKey } from '@/lib/wallet-reown-connection.mjs';
import { WalletReownContext, WALLET_REOWN_UNAVAILABLE } from './WalletReownContext';

const configuration = walletReownConfiguration(process.env.NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID || '',
  typeof window === 'undefined' ? '' : window.location.origin, { allowLocal: process.env.NODE_ENV !== 'production' });
/** @type {ReturnType<typeof createAppKit> | null} */
let walletAppKit = null;
// This client module is lazy-mounted by the native member shell. No project,
// other portal's origin, or server evaluation can initialize a wallet instance.
if (typeof window !== 'undefined' && configuration) {
  try {
    walletAppKit = createAppKit(/** @type {Parameters<typeof createAppKit>[0]} */ ({ ...configuration,
      adapters: [new EthersAdapter()], networks: [polygon], defaultNetwork: polygon }));
  } catch { /* A missing SDK capability never grants a usable connection. */ }
}

let disconnectFlight;
function disconnectSdk() {
  if (!walletAppKit) return Promise.resolve();
  if (!disconnectFlight) {
    // 1.8.24 otherwise skips an adapter reset while its address is restoring.
    walletAppKit.updateOptions({ enableReconnect: false });
    let pending;
    try { pending = walletAppKit.disconnect('eip155'); }
    finally { walletAppKit.updateOptions({ enableReconnect: true }); }
    disconnectFlight = Promise.resolve(pending).finally(() => { disconnectFlight = null; });
  }
  return disconnectFlight;
}
async function bounded(operation, signal) {
  const deadline = browserRequestDeadline(signal, 12000);
  let aborted;
  try {
    return await Promise.race([Promise.resolve().then(() => { if (deadline.signal.aborted) throw Error('wallet_reown_cancelled'); return operation(); }),
      new Promise((_, reject) => { aborted = () => reject(Error('wallet_reown_cancelled')); deadline.signal.addEventListener('abort', aborted, { once: true });
        if (deadline.signal.aborted) aborted(); })]);
  } finally { deadline.signal.removeEventListener('abort', aborted); deadline.dispose(); }
}

export default function WalletReownProvider({ children }) {
  const [clientMounted, setClientMounted] = useState(false);
  useEffect(() => { setClientMounted(true); }, []);
  // SSR and the first hydration pass expose the same safe context. SDK creation
  // remains at module scope, not in this mounted-state effect.
  return clientMounted && walletAppKit ? <ConfiguredWalletReownProvider>{children}</ConfiguredWalletReownProvider>
    : <WalletReownContext.Provider value={WALLET_REOWN_UNAVAILABLE}>{children}</WalletReownContext.Provider>;
}

export function ConfiguredWalletReownProvider({ children }) {
  const { open, close } = useAppKit(), account = useAppKitAccount({ namespace: 'eip155' });
  const { chainId: sdkChainId } = useAppKitNetwork(), { walletProvider } = useAppKitProvider('eip155'), sdk = useAppKitState();
  const owner = walletReownOwnerKey(useMemberSession());
  const fence = useRef(createWalletReownBoundary()), mounted = useRef(false), operation = useRef(null);
  const generation = fence.current.setOwner(owner);
  const [scope, setScope] = useState({ owner: '', fingerprint: '', ready: false, error: false });
  const [activity, setActivity] = useState('');
  const modal = useRef({ open, close }); modal.current = { open, close };
  const modalWasOpen = useRef(false);
  const address = walletReownAddress(account.address), chainId = walletReownChainId(sdkChainId);
  const live = useRef(null);
  live.current = { owner, generation, address, chainId, walletProvider, connected: account.isConnected === true };
  const active = useCallback(() => mounted.current && live.current?.owner === owner && fence.current.current(owner, generation), [owner, generation]);
  const retire = useCallback(() => {
    fence.current.retire(); operation.current?.abort(); operation.current = null; forgetWalletReownOwner();
    void modal.current.close().catch(() => {}); void disconnectSdk().catch(() => {});
    if (mounted.current) { setActivity('session_changed'); setScope({ owner: '', fingerprint: '', ready: false, error: false }); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const stopLogout = subscribeMemberLogout(retire), stopReplacement = subscribeMemberSessionReplacement(retire);
    return () => {
      mounted.current = false; operation.current?.abort(); operation.current = null; stopLogout(); stopReplacement();
      // StrictMode's immediate setup replay cancels this unmount-only reset.
      void Promise.resolve().then(() => { if (!mounted.current) { fence.current.retire(); void modal.current.close().catch(() => {}); void disconnectSdk().catch(() => {}); } });
    };
  }, [retire]);

  useEffect(() => {
    if (!owner) { forgetWalletReownOwner(); void disconnectSdk().catch(() => {}); return undefined; }
    if (!sdk.initialized) return undefined;
    const controller = new AbortController();
    setScope({ owner, fingerprint: '', ready: false, error: false });
    void walletReownOwnerFingerprint(owner).then(async fingerprint => {
      if (!active() || controller.signal.aborted) return;
      if (readWalletReownOwner() === fingerprint) fence.current.authorize(owner, generation);
      else {
        forgetWalletReownOwner();
        await bounded(disconnectSdk, controller.signal);
      }
      if (active() && !controller.signal.aborted) setScope({ owner, fingerprint, ready: true, error: false });
    }).catch(() => {
      if (active() && !controller.signal.aborted) setScope({ owner, fingerprint: '', ready: false, error: true });
    });
    return () => controller.abort();
  }, [owner, generation, sdk.initialized, active]);

  useEffect(() => {
    const provider = /** @type {any} */ (walletProvider);
    if (!provider?.on) return undefined;
    const accountsChanged = accounts => {
      if (fence.current.permits(owner, generation) && address
        && (!Array.isArray(accounts) || walletReownAddress(accounts[0]).toLowerCase() !== address.toLowerCase())) retire();
    };
    const chainChanged = value => { if (fence.current.permits(owner, generation) && walletReownChainId(value) !== 137) retire(); };
    const disconnected = () => { if (fence.current.permits(owner, generation)) retire(); };
    provider.on('accountsChanged', accountsChanged); provider.on('chainChanged', chainChanged); provider.on('disconnect', disconnected);
    return () => { provider.removeListener?.('accountsChanged', accountsChanged); provider.removeListener?.('chainChanged', chainChanged); provider.removeListener?.('disconnect', disconnected); };
  }, [walletProvider, address, owner, generation, retire]);

  useEffect(() => {
    if (sdk.open) modalWasOpen.current = true;
    else if (modalWasOpen.current) { modalWasOpen.current = false; if (activity === 'connecting') setActivity(''); }
  }, [sdk.open, activity]);

  const connectWallet = useCallback(async () => {
    if (!active() || !scope.ready || scope.owner !== owner || !scope.fingerprint || operation.current) throw Error('wallet_reown_unavailable');
    if (live.current?.connected && !fence.current.permits(owner, generation)) throw Error('wallet_reown_session_changed');
    const controller = new AbortController(); operation.current = controller;
    fence.current.authorize(owner, generation); rememberWalletReownOwner(scope.fingerprint); setActivity('connecting');
    try { await bounded(() => modal.current.open({ view: 'Connect', namespace: 'eip155' }), controller.signal); }
    catch (error) { if (active() && !controller.signal.aborted) setActivity('error'); throw error; }
    finally { if (operation.current === controller) operation.current = null; }
  }, [active, owner, generation, scope]);
  const disconnectWallet = useCallback(async () => {
    if (!active()) throw Error('wallet_reown_session_changed');
    retire();
    await bounded(disconnectSdk);
  }, [active, retire]);

  const permitted = scope.owner === owner && scope.ready && fence.current.permits(owner, generation);
  const isConnected = Boolean(permitted && account.isConnected && address && walletProvider);
  const provider = useMemo(() => isConnected ? guardWalletReownProvider(walletProvider, () => active() && fence.current.permits(owner, generation)
    && live.current?.connected && live.current?.address === address && live.current?.walletProvider === walletProvider,
  { address, chainId: () => live.current?.chainId }) : null, [isConnected, walletProvider, active, owner, generation, address]);
  const isRestoring = Boolean(owner && (!sdk.initialized || scope.owner !== owner || (!scope.ready && !scope.error)));
  const status = !owner ? 'unauthenticated' : scope.owner === owner && scope.error ? 'error' : isRestoring ? 'restoring'
    : isConnected ? chainId === 137 ? 'connected' : 'wrong_network' : activity || 'disconnected';
  const value = useMemo(() => ({ configured: true, address: isConnected ? address : '', chainId: isConnected ? chainId : null,
    isConnected, isRestoring, provider, status, connectWallet, disconnectWallet }),
  [isConnected, address, chainId, isRestoring, provider, status, connectWallet, disconnectWallet]);
  return <WalletReownContext.Provider value={value}>{children}</WalletReownContext.Provider>;
}

export { useWalletReown } from './WalletReownContext';
