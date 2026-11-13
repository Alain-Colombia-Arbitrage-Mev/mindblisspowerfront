'use client';

import { createContext, useContext } from 'react';

const unavailable = async () => { throw Error('wallet_reown_unavailable'); };
/** @type {{configured: boolean, address: string, chainId: number | null, isConnected: boolean, isRestoring: boolean,
 * provider: any, status: string, connectWallet: () => Promise<void>, disconnectWallet: () => Promise<void>}} */
export const WALLET_REOWN_UNAVAILABLE = Object.freeze({ configured: false, address: '', chainId: null,
  isConnected: false, isRestoring: false, provider: null, status: 'unavailable',
  connectWallet: unavailable, disconnectWallet: unavailable });
export const WalletReownContext = createContext(WALLET_REOWN_UNAVAILABLE);
export function useWalletReown() { return useContext(WalletReownContext); }
