const address = value => typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value) ? value.toLowerCase() : '';

/** A persisted address is not a live signing session. No RPC or signature is requested here.
 * @param {{ initialized?: boolean, status?: string, loading?: boolean, isConnected?: boolean,
 * currentAddress?: unknown, boundAddress?: unknown, walletProvider?: {request?: unknown} }} [options]
 */
export function reownWalletConnectionState({ initialized = true, status, loading = false, isConnected = false,
  currentAddress, boundAddress, walletProvider } = {}) {
  const current = address(currentAddress), bound = address(boundAddress);
  if (isConnected && current && bound && current !== bound) return 'mismatch';
  if (isConnected && current && typeof walletProvider?.request === 'function') return 'connected';
  if (!initialized || loading || ['connecting', 'reconnecting'].includes(status)
    || (isConnected && current && typeof walletProvider?.request !== 'function')) return 'restoring';
  return 'disconnected';
}

/** Wait for connection state, rather than treating an opened modal as a connected wallet.
 * @param {{open: () => unknown, timeoutMs?: number, restoreTimeoutMs?: number,
 * initialState?: {status?: string, modalOpen?: boolean}, onSettled?: (error: unknown) => void}} options
 */
export function createReownWalletConnectionRequest({ open, timeoutMs = 90_000, restoreTimeoutMs = 15_000,
  initialState = { status: 'disconnected', modalOpen: false }, onSettled = (_error) => {} }) {
  if (typeof open !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 300_000
    || !Number.isFinite(restoreTimeoutMs) || restoreTimeoutMs < 0 || restoreTimeoutMs > 30_000) throw new TypeError('invalid_wallet_connection_request');
  let resolve, reject, settled = false, seenModal = false, closeTimer, restoreTimer, requestedModal = false;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  const finish = (error = null) => {
    if (settled) return;
    settled = true; clearTimeout(timer); clearTimeout(closeTimer); clearTimeout(restoreTimer);
    try { onSettled(error); } catch { /* View cleanup cannot alter connection outcome. */ }
    if (error) reject(error); else resolve({ connected: true });
  };
  const abort = () => finish(Object.assign(new Error('wallet_connection_cancelled'), { name: 'AbortError' }));
  const timer = setTimeout(() => finish(Object.assign(new Error('wallet_connection_timeout'), { name: 'TimeoutError' })), timeoutMs);
  const requestModal = () => {
    if (settled || requestedModal) return;
    requestedModal = true; clearTimeout(restoreTimer);
    Promise.resolve().then(() => { if (!settled) return open(); }).catch(error => finish(error));
  };
  // A page may ask to connect while the SDK is restoring a live session. Give
  // that read-only restoration a bounded chance before presenting another login.
  if (initialState.status === 'connected') Promise.resolve().then(() => finish());
  else if (initialState.status === 'restoring') restoreTimer = setTimeout(requestModal, restoreTimeoutMs);
  else requestModal();
  return { promise, cancel: abort,
    update({ status, modalOpen }) {
      if (settled) return;
      if (status === 'connected') { finish(); return; }
      if (!requestedModal && status !== 'restoring') requestModal();
      if (modalOpen) { seenModal = true; clearTimeout(closeTimer); closeTimer = undefined; }
      // Closing the modal can precede the final account event. Give that event
      // one short grace period, then release the button without starting a payment.
      else if (seenModal && !closeTimer) closeTimer = setTimeout(() => status === 'mismatch' ? finish(new Error('wallet_address_mismatch')) : abort(), 500);
    },
  };
}
