import { createReownFundingOperation } from './reown-funding-operation.mjs';

const address = value => typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value) ? value.toLowerCase() : '';
const cancelled = () => Object.assign(new Error('wallet_connection_cancelled'), { name: 'AbortError' });

/** One explicit activation action. SDK connection and proof remain separate
 * trust boundaries, but a user need not click a second application button.
 * Provider snapshots are observed, never polled; no effect invokes a proof.
 * @param {{owner:string, read:()=>any, subscribe:(listener:()=>void)=>()=>void,
 * timeoutMs?:number, onSettled?:(error:unknown)=>void}} options */
export function createReownWalletPreparationRequest({ owner, read, subscribe, timeoutMs = 90_000, onSettled = (_error) => {} }) {
  if (typeof owner !== 'string' || !owner || typeof read !== 'function' || typeof subscribe !== 'function') throw new TypeError('invalid_wallet_preparation');
  let pendingConnection;
  const operation = createReownFundingOperation({ timeoutMs, onStop() {
    // Cancel only the connection promise this activation joined. A later
    // independent selection must not be cancelled by an older deadline.
    try { pendingConnection?.cancel?.(pendingConnection.promise); } catch { /* Local UI cancellation only. */ }
  } });
  const current = () => {
    operation.assertActive();
    const value = read();
    if (!value || value.owner !== owner) throw cancelled();
    if (value.linkStatus === 'error' || value.linkStatus === 'unavailable') throw new Error('wallet_status_unavailable');
    return value;
  };
  const linked = value => value.linkStatus === 'linked' && Boolean(address(value.linkedAddress));
  const candidate = value => value.linkStatus === 'unlinked' && value.isConnected === true
    && value.isCandidate === true && Boolean(address(value.address));
  const acknowledgement = value => ({ linked: true, address: value.linkedAddress });
  const observe = predicate => operation.wait(() => new Promise((resolve, reject) => {
    let unsubscribe = () => {}, finished = false;
    const cleanup = () => { unsubscribe(); operation.signal.removeEventListener('abort', cleanup); };
    const check = () => {
      if (finished) return;
      try {
        const value = current();
        if (predicate(value)) { finished = true; cleanup(); resolve({ ...value }); }
      } catch (error) { finished = true; cleanup(); reject(error); }
    };
    unsubscribe = subscribe(check);
    if (finished) { unsubscribe(); return; }
    operation.signal.addEventListener('abort', cleanup, { once: true });
    check();
  }));
  const promise = (async () => {
    let value = await observe(value => linked(value) || value.linkStatus === 'unlinked');
    if (linked(value)) return acknowledgement(value);
    if (!candidate(value)) {
      await operation.wait(() => {
        const latest = current();
        if (typeof latest.connectWallet !== 'function') throw new Error('wallet_not_connected');
        const promise = latest.connectWallet();
        pendingConnection = { promise, cancel: latest.cancelConnection };
        return Promise.resolve(promise).finally(() => {
          if (pendingConnection?.promise === promise) pendingConnection = null;
        });
      });
      value = await observe(value => linked(value) || candidate(value));
    }
    if (linked(value)) return acknowledgement(value);
    const expectedAddress = address(value.address);
    const result = await operation.wait(() => {
      const latest = current();
      if (linked(latest)) return acknowledgement(latest);
      if (!candidate(latest) || address(latest.address) !== expectedAddress || typeof latest.linkWallet !== 'function') {
        throw new Error('wallet_address_mismatch');
      }
      return latest.linkWallet(operation);
    });
    current();
    if (result?.linked !== true || address(result.address) !== expectedAddress) throw new Error('wallet_link_unconfirmed');
    return result;
  })();
  // Cleanup is shared by success, cancellation and provider failures. A failed
  // connection or proof is never retried automatically.
  const settled = promise.then(result => {
    operation.finish(); try { onSettled(null); } catch { /* UI cleanup only. */ } return result;
  }, error => {
    operation.cancel(); try { onSettled(error); } catch { /* UI cleanup only. */ } throw error;
  });
  return { promise: settled, cancel: () => operation.cancel() };
}
