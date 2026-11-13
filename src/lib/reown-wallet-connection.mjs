const address = value => typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value) ? value.toLowerCase() : '';

/** A known different embedded login is a UI safety signal for an unbound
 * account. Equal or missing email never proves ownership; a signed backend
 * binding remains authoritative, including wallets using another login email.
 * @param {{bindingStatus?: string, sessionEmail?: unknown, embeddedEmail?: unknown}} [options] */
export function reownWalletIdentityMismatch({ bindingStatus, sessionEmail, embeddedEmail } = {}) {
  const normalize = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
  const member = normalize(sessionEmail), embedded = normalize(embeddedEmail);
  return bindingStatus === 'unlinked' && Boolean(member && embedded && member !== embedded);
}

/** An SDK session restored before this member selected it is not an owned
 * candidate, even when the embedded provider supplies no email.
 * @param {{bindingStatus?: string, owner?: string, currentAddress?: unknown,
 * selectedOwner?: string, selectedAddress?: unknown, identityMismatch?: boolean}} [options] */
export function reownWalletNeedsAccountSelection({ bindingStatus, owner, currentAddress,
  selectedOwner, selectedAddress, identityMismatch = false } = {}) {
  return bindingStatus === 'unlinked' && (identityMismatch || !owner || owner !== selectedOwner
    || !address(currentAddress) || address(currentAddress) !== address(selectedAddress));
}

/** A persisted address is not a live signing session. No RPC or signature is requested here.
 * @param {{ initialized?: boolean, status?: string, loading?: boolean, isConnected?: boolean,
 * currentAddress?: unknown, boundAddress?: unknown, walletProvider?: {request?: unknown}, identityMismatch?: boolean }} [options]
 */
export function reownWalletConnectionState({ initialized = true, status, loading = false, isConnected = false,
  currentAddress, boundAddress, walletProvider, identityMismatch = false } = {}) {
  const current = address(currentAddress), bound = address(boundAddress);
  if (isConnected && identityMismatch) return 'mismatch';
  if (isConnected && current && bound && current !== bound) return 'mismatch';
  if (isConnected && current && typeof walletProvider?.request === 'function') return 'connected';
  if (!initialized || loading || ['connecting', 'reconnecting'].includes(status)
    || (isConnected && current && typeof walletProvider?.request !== 'function')) return 'restoring';
  return 'disconnected';
}

/** Explicit wallet selection is separate from funding. A resolved SDK
 * disconnect alone is insufficient: observe its disconnected account before
 * opening Connect, and ignore every old connected snapshot until then. */
export function createReownWalletSwitchRequest({ disconnect, open, timeoutMs = 90_000,
  initialState = { status: 'connected', modalOpen: false, disconnected: false }, onSettled = (_error) => {} }) {
  if (typeof disconnect !== 'function' || typeof open !== 'function' || !Number.isFinite(timeoutMs)
    || timeoutMs <= 0 || timeoutMs > 300_000) throw new TypeError('invalid_wallet_switch_request');
  let resolve, reject, settled = false, resetting = false, reset = false, opened = false, connection;
  let state = initialState;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  const finish = (error = null) => {
    if (settled) return;
    settled = true; clearTimeout(timer); connection?.cancel();
    try { onSettled(error); } catch { /* Cleanup cannot change selection. */ }
    if (error) reject(error); else resolve({ connected: true });
  };
  const cancel = () => finish(Object.assign(new Error('wallet_connection_cancelled'), { name: 'AbortError' }));
  const timer = setTimeout(() => finish(Object.assign(new Error('wallet_connection_timeout'), { name: 'TimeoutError' })), timeoutMs);
  const continueAfterReset = () => {
    if (settled || !reset || state.disconnected !== true || connection) return;
    connection = createReownWalletConnectionRequest({ timeoutMs, initialState: { status: 'disconnected', modalOpen: false },
      open: () => { if (settled) return; opened = true; return open(); } });
    connection.promise.then(() => finish(), finish);
  };
  const beginReset = () => {
    if (settled || resetting || state.status === 'restoring') return;
    resetting = true;
    Promise.resolve().then(() => { if (!settled) return disconnect(); }).then(() => {
      if (settled) return;
      reset = true; continueAfterReset();
    }, finish);
  };
  beginReset();
  return { promise, cancel,
    update(next) {
      if (settled) return;
      state = next;
      beginReset();
      continueAfterReset();
      if (opened) connection?.update(next);
    },
  };
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
