import { getAddress } from 'ethers';
import { memberSessionOwnerKey } from './member-session-boundary.mjs';

const markerKey = 'mindbliss.wallet-reown.owner.v1';
export const walletReownOwnerKey = memberSessionOwnerKey;
export function walletReownAddress(value) {
  try { return typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value) ? getAddress(value) : ''; }
  catch { return ''; }
}
export function walletReownChainId(value) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && /^(?:[1-9]\d{0,9}|0x[0-9a-f]{1,8})$/i.test(value) ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 0xffffffff ? parsed : null;
}
export async function walletReownOwnerFingerprint(owner, cryptoImpl = globalThis.crypto) {
  if (!owner || typeof owner !== 'string' || owner.length > 1024) throw Error('wallet_reown_owner_required');
  const bytes = await cryptoImpl.subtle.digest('SHA-256', new TextEncoder().encode(owner));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}
export function readWalletReownOwner(browser = globalThis.window) {
  try { const value = browser?.sessionStorage?.getItem(markerKey); return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value) ? value : ''; }
  catch { return ''; }
}
export function rememberWalletReownOwner(fingerprint, browser = globalThis.window) {
  if (typeof fingerprint !== 'string' || !/^[0-9a-f]{64}$/.test(fingerprint)) return false;
  try { browser?.sessionStorage?.setItem(markerKey, fingerprint); return Boolean(browser?.sessionStorage); } catch { return false; }
}
export function forgetWalletReownOwner(browser = globalThis.window) {
  try { browser?.sessionStorage?.removeItem(markerKey); } catch { /* A blocked store never authorizes a connection. */ }
}

/** Presentation lease only. It never proves ownership or changes a backend binding. */
export function createWalletReownBoundary() {
  let owner = '', generation = 0, allowed = false;
  const setOwner = next => { if (owner !== next) { owner = next; generation++; allowed = false; } return generation; };
  const retire = () => { generation++; allowed = false; };
  const current = (expected, epoch) => Boolean(expected && owner === expected && generation === epoch);
  return { setOwner, retire, current,
    authorize(expected, epoch) { if (!current(expected, epoch)) return false; allowed = true; return true; },
    permits(expected, epoch) { return allowed && current(expected, epoch); },
    generation: () => generation };
}

/** Old React closures cannot reuse an SDK provider after the native owner retires. */
export function guardWalletReownProvider(provider, allowed, { address = '', chainId = () => null } = {}) {
  if (!provider || typeof provider.request !== 'function') return null;
  const checked = () => { if (!allowed()) throw Error('wallet_reown_session_changed'); };
  const listeners = new Map();
  return { request: async input => {
    checked();
    if (!input || !['eth_accounts', 'eth_chainId', 'eth_requestAccounts', 'personal_sign', 'wallet_switchEthereumChain'].includes(input.method)) throw Error('wallet_reown_method_disabled');
    if (input.method === 'wallet_switchEthereumChain' && (!Array.isArray(input.params) || input.params.length !== 1
      || !input.params[0] || Object.keys(input.params[0]).join(',') !== 'chainId' || input.params[0].chainId !== '0x89')) throw Error('wallet_reown_network_required');
    if (input.method === 'personal_sign' && (chainId() !== 137 || !Array.isArray(input.params) || input.params.length !== 2
      || !walletReownAddress(input.params[1]) || walletReownAddress(input.params[1]).toLowerCase() !== address.toLowerCase())) throw Error('wallet_reown_network_required');
    const result = await provider.request(input); checked(); return result;
  },
    on: (event, listener) => {
      checked(); if (typeof listener !== 'function') return;
      let registered = listeners.get(event); if (!registered) { registered = new Map(); listeners.set(event, registered); }
      if (registered.has(listener)) return;
      const callback = (...args) => { if (allowed()) listener(...args); };
      registered.set(listener, callback); provider.on?.(event, callback);
    },
    removeListener: (event, listener) => { const registered = listeners.get(event), callback = registered?.get(listener);
      if (callback) { provider.removeListener?.(event, callback); registered.delete(listener); if (!registered.size) listeners.delete(event); } } };
}
