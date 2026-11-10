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
  isLinked: false,
  isLinking: false,
  openConnect: async () => { throw new Error("reown_unavailable"); },
  openOnramp: async () => { throw new Error("reown_unavailable"); },
  startOnramp: async () => { throw new Error("reown_unavailable"); },
  linkWallet: async () => { throw new Error("reown_unavailable"); },
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
 * @property {boolean} isLinked
 * @property {boolean} isLinking
 * @property {() => Promise<unknown>} openConnect
 * @property {() => Promise<unknown>} openOnramp
 * @property {() => Promise<unknown>} startOnramp
 * @property {() => Promise<unknown>} linkWallet
 * @property {() => Promise<unknown>} openAccount
 */
export function useReownWallet() {
  return useContext(ReownContext);
}
