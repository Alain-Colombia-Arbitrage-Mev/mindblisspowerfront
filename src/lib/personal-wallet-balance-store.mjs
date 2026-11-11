import { readPersonalWalletBalances } from './personal-wallet-balance.mjs';

export const EMPTY_PERSONAL_BALANCE = Object.freeze({ walletAddress: '', balanceAtomic: null, nativeBalanceAtomic: null,
  loading: false, error: '', updatedAt: null });

export function personalWalletBalanceSessionKey(session) {
  const email = typeof session?.email === 'string' ? session.email.trim().toLowerCase() : '';
  return email ? JSON.stringify([typeof session.subject === 'string' ? session.subject : '', email]) : '';
}

/** Memory only; authenticated sessions never share snapshots or in-flight work. */
export function createPersonalWalletBalanceStore({ read = readPersonalWalletBalances, now = Date.now,
  windowTarget = typeof window === 'undefined' ? null : window,
  documentTarget = typeof document === 'undefined' ? null : document } = {}) {
  const entries = new Map();
  const publish = (entry, snapshot) => { entry.snapshot = Object.freeze(snapshot); for (const listener of entry.listeners) listener(); };
  const visible = () => !documentTarget || documentTarget.visibilityState === 'visible';
  function refresh(key, force = true) {
    const entry = entries.get(key);
    if (!entry || !entry.listeners.size) return Promise.resolve(null);
    if (entry.flight) { if (force) entry.pending = true; return entry.flight; }
    if (!force && entry.successAt !== null && now() - entry.successAt < 5000) return Promise.resolve(entry.snapshot);
    const controller = new AbortController(), token = ++entry.token;
    entry.controller = controller;
    publish(entry, { ...EMPTY_PERSONAL_BALANCE, loading: true });
    const current = () => entries.get(key) === entry && entry.token === token && !controller.signal.aborted;
    entry.flight = Promise.resolve().then(() => read({ signal: controller.signal })).then(value => {
      if (!current()) return null;
      const networks = Object.fromEntries(value.balances.map(item => [item.network, Object.freeze({
        walletAddress: value.walletAddress, balanceAtomic: item.balanceAtomic, nativeBalanceAtomic: item.nativeBalanceAtomic,
        loading: false, error: item.error || '', updatedAt: item.observedAt,
      })]));
      entry.successAt = value.balances.some(item => !item.error) ? now() : null;
      publish(entry, { ...networks.ethereum, networks });
      return value;
    }).catch(error => {
      if (current()) {
        entry.successAt = null;
        publish(entry, { ...EMPTY_PERSONAL_BALANCE, error: error?.message || 'company_payment_unavailable' });
      }
      return null;
    }).finally(() => {
      if (entry.token === token) {
        entry.flight = null; entry.controller = null;
        if (entry.pending && entries.get(key) === entry) { entry.pending = false; void refresh(key); }
      }
    });
    return entry.flight;
  }
  function subscribe(key, listener) {
    if (!key) return () => {};
    let entry = entries.get(key);
    if (!entry) {
      entry = { snapshot: EMPTY_PERSONAL_BALANCE, listeners: new Set(), token: 0, controller: null, flight: null,
        successAt: null, timer: null, onReturn: null, pending: false };
      entries.set(key, entry);
      entry.onReturn = () => {
        clearTimeout(entry.timer);
        if (!visible()) return;
        entry.timer = setTimeout(() => { if (visible()) void refresh(key); }, 250);
      };
      for (const event of ['focus', 'pageshow', 'vp:personal-wallet-linked', 'vp:personal-wallet-balance-changed']) windowTarget?.addEventListener(event, entry.onReturn);
      documentTarget?.addEventListener('visibilitychange', entry.onReturn);
    }
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
      if (entry.listeners.size) return;
      entry.token++; entry.controller?.abort(); clearTimeout(entry.timer);
      for (const event of ['focus', 'pageshow', 'vp:personal-wallet-linked', 'vp:personal-wallet-balance-changed']) windowTarget?.removeEventListener(event, entry.onReturn);
      documentTarget?.removeEventListener('visibilitychange', entry.onReturn);
      if (entries.get(key) === entry) entries.delete(key);
    };
  }
  return Object.freeze({ subscribe, refresh, get: (key, network = 'ethereum') => {
    const snapshot = entries.get(key)?.snapshot;
    return snapshot?.networks?.[network] || snapshot || EMPTY_PERSONAL_BALANCE;
  } });
}

export const personalWalletBalanceStore = createPersonalWalletBalanceStore();
