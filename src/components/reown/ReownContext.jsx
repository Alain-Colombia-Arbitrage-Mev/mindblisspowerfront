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
  onrampStatus: "idle",
  onrampError: "",
  administrativeOnrampStatus: "idle",
  administrativeOnrampError: "",
  openConnect: async () => { throw new Error("reown_unavailable"); },
  openOnramp: async () => { throw new Error("reown_unavailable"); },
  startOnramp: async () => { throw new Error("reown_unavailable"); },
  startAdministrativeOnramp: async () => { throw new Error("reown_unavailable"); },
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
 * @property {string} onrampStatus
 * @property {string} onrampError
 * @property {string} administrativeOnrampStatus
 * @property {string} administrativeOnrampError
 * @property {() => Promise<unknown>} openConnect
 * @property {() => Promise<unknown>} openOnramp
 * @property {(input?: {amount?: number, countryCode?: string, paymentMethodType?: string, serviceProvider?: string}) => Promise<unknown>} startOnramp
 * @property {(input: {address: string, amount?: number, countryCode?: string, paymentMethodType?: string, serviceProvider?: string}) => Promise<unknown>} startAdministrativeOnramp
 * @property {() => Promise<unknown>} reconnectWallet
 * @property {() => Promise<unknown>} linkWallet
 * @property {() => Promise<unknown>} refreshLink
 * @property {() => Promise<unknown>} openAccount
 */
export function useReownWallet() {
  return useContext(ReownContext);
}
