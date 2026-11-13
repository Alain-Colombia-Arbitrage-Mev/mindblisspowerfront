import { readPersonalWalletBalances } from './personal-wallet-balance.mjs';

export const EMPTY_PERSONAL_BALANCE = Object.freeze({ walletAddress: '', balanceAtomic: null, nativeBalanceAtomic: null,
  loading: false, error: '', updatedAt: null });
const returnEvents = ['focus', 'pageshow', 'vp:personal-wallet-linked', 'vp:personal-wallet-balance-changed'];
const invalidationEvents = new Set(['vp:personal-wallet-linked', 'vp:personal-wallet-balance-changed']);
const blockedErrors = new Set(['unauthenticated', 'company_payment_wallet_not_linked', 'company_payment_forbidden', 'company_payment_unconfigured']);

export function personalWalletBalanceSessionKey(session) {
  const email = typeof session?.email === 'string' ? session.email.trim().toLowerCase() : '';
  return email ? JSON.stringify([typeof session.subject === 'string' ? session.subject : '', email]) : '';
}

/** Memory only; authenticated sessions never share snapshots or in-flight work. */
export function createPersonalWalletBalanceStore({ read = readPersonalWalletBalances, now = Date.now,
  windowTarget = typeof window === 'undefined' ? null : window,
  documentTarget = typeof document === 'undefined' ? null : document,
  refreshIntervalMs = 60_000, retryDelays = [5000, 15000, 30000] } = {}) {
  const entries = new Map();
  const publish = (entry, snapshot) => { entry.snapshot = Object.freeze(snapshot); for (const listener of entry.listeners) listener(); };
  const visible = () => !documentTarget || documentTarget.visibilityState === 'visible';
  function retry(key, entry) {
    clearTimeout(entry.retryTimer);
    if (entry.retries >= retryDelays.length) return;
    entry.retryTimer = setTimeout(() => { entry.retryTimer = null; if (visible()) void refresh(key); }, retryDelays[entry.retries++]);
    entry.retryTimer?.unref?.();
  }
  function refresh(key, force = true) {
    const entry = entries.get(key);
    if (!entry || !entry.listeners.size) return Promise.resolve(null);
    if (entry.flight) { if (force) entry.pending = true; return entry.flight; }
    // Focus/pageshow/visibility events can arrive repeatedly while a wallet
    // iframe opens. Coalesce failed reads too; they must not bypass backoff.
    if (!force && (entry.retryTimer || (entry.lastAttemptAt !== null && now() - entry.lastAttemptAt < 5000))) return Promise.resolve(entry.snapshot);
    const controller = new AbortController(), token = ++entry.token;
    entry.lastAttemptAt = now();
    clearTimeout(entry.retryTimer); entry.retryTimer = null;
    entry.controller = controller;
    publish(entry, { ...EMPTY_PERSONAL_BALANCE, loading: true });
    const current = () => entries.get(key) === entry && entry.token === token && !controller.signal.aborted;
    entry.flight = Promise.resolve().then(() => read({ signal: controller.signal })).then(value => {
      if (!current()) return null;
      const networks = Object.fromEntries(value.balances.map(item => [item.network, Object.freeze({
        walletAddress: value.walletAddress, balanceAtomic: item.balanceAtomic, nativeBalanceAtomic: item.nativeBalanceAtomic,
        loading: false, error: item.error || '', updatedAt: item.observedAt,
      })]));
      entry.lastAttemptAt = now();
      publish(entry, { ...networks.ethereum, networks });
      if (value.balances.some(item => item.error)) retry(key, entry);
      else entry.retries = 0;
      return value;
    }).catch(error => {
      if (current()) {
        entry.lastAttemptAt = now();
        publish(entry, { ...EMPTY_PERSONAL_BALANCE, error: error?.message || 'company_payment_unavailable' });
        if (!blockedErrors.has(error?.message)) retry(key, entry);
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
        lastAttemptAt: null, timer: null, onReturn: null, returnForce: false,
        pending: false, retryTimer: null, retries: 0, pollTimer: null };
      entries.set(key, entry);
      entry.onReturn = event => {
        clearTimeout(entry.timer);
        entry.returnForce ||= invalidationEvents.has(event?.type);
        if (!visible()) return;
        entry.timer = setTimeout(() => {
          if (!visible()) return;
          const force = entry.returnForce; entry.returnForce = false;
          if (force || !blockedErrors.has(entry.snapshot.error)) void refresh(key, force);
        }, 250);
      };
      for (const event of returnEvents) windowTarget?.addEventListener(event, entry.onReturn);
      documentTarget?.addEventListener('visibilitychange', entry.onReturn);
      entry.pollTimer = setInterval(() => {
        if (visible() && !entry.flight && !blockedErrors.has(entry.snapshot.error)) void refresh(key, false);
      }, refreshIntervalMs);
      entry.pollTimer?.unref?.();
    }
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
      if (entry.listeners.size) return;
      entry.token++; entry.controller?.abort(); clearTimeout(entry.timer); clearTimeout(entry.retryTimer); clearInterval(entry.pollTimer);
      for (const event of returnEvents) windowTarget?.removeEventListener(event, entry.onReturn);
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
