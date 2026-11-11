"use client";

import { createContext, useContext } from "react";

/** @type {import("react").Context<ReownContextValue>} */
export const ReownContext = createContext(Object.freeze({
  configured: false,
  isConnected: false,
  address: "",
  status: "unavailable",
  linkedAddress: "",
  linkStatus: "unavailable",
  linkError: "",
  isLinked: false,
  isLinking: false,
  isRestoring: false,
  connectionStatus: "disconnected",
  connectWallet: async () => { throw new Error("reown_unavailable"); },
  onrampStatus: "idle",
  onrampError: "",
  fundingRevision: 0,
  openConnect: async () => { throw new Error("reown_unavailable"); },
  openOnramp: async () => { throw new Error("reown_unavailable"); },
  startOnramp: async () => { throw new Error("reown_unavailable"); },
  cancelOnramp: () => {},
  clearOnrampError: () => {},
  getCompanyPaymentProvider: () => { throw new Error("personal_company_wallet_unavailable"); },
  switchCompanyPaymentNetwork: async () => { throw new Error("personal_company_wallet_unavailable"); },
  reconnectWallet: async () => { throw new Error("reown_unavailable"); },
  linkWallet: async () => { throw new Error("reown_unavailable"); },
  refreshLink: async () => { throw new Error("reown_unavailable"); },
  openAccount: async () => { throw new Error("reown_unavailable"); },
}));

/**
 * Lightweight hook kept separate from the AppKit implementation. Pages that
 * only render navigation must not download Reown, ethers and wallet adapters.
 *
 * @typedef {Object} ReownContextValue
 * @property {boolean} configured
 * @property {boolean} isConnected
 * @property {string} address
 * @property {string} status
 * @property {string} linkedAddress
 * @property {string} linkStatus
 * @property {string} linkError
 * @property {boolean} isLinked
 * @property {boolean} isLinking
 * @property {boolean} isRestoring
 * @property {string} connectionStatus
 * @property {() => Promise<unknown>} connectWallet
 * @property {string} onrampStatus
 * @property {string} onrampError
 * @property {number} fundingRevision
 * @property {() => Promise<unknown>} openConnect
 * @property {() => Promise<unknown>} openOnramp
 * @property {(input?: {requestId?: string, walletAddress?: string, amount?: number, country?: string, countryCode?: string, paymentMethodType?: string}) => Promise<unknown>} startOnramp
 * @property {() => void} cancelOnramp
 * @property {() => void} clearOnrampError
 * @property {() => {request: (input: {method: string, params?: unknown[]}) => Promise<unknown>}} getCompanyPaymentProvider
 * @property {(chainId?: number) => Promise<unknown>} switchCompanyPaymentNetwork
 * @property {() => Promise<unknown>} reconnectWallet
 * @property {() => Promise<unknown>} linkWallet
 * @property {() => Promise<unknown>} refreshLink
 * @property {() => Promise<unknown>} openAccount
 */
export function useReownWallet() {
  return useContext(ReownContext);
}
