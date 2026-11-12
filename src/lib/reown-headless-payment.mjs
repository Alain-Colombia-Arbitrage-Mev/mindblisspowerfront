import { createReownFundingOperation } from './reown-funding-operation.mjs';

const address = value => typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value) ? value.toLowerCase() : '';
const cancelled = () => Object.assign(new Error('wallet_connection_cancelled'), { name: 'AbortError' });
const empty = () => ({ phase: 'idle', error: '', email: '', resendAt: 0 });

/** Translate provider failures to customer-safe enums, never expose SDK URLs,
 * authentication payloads or arbitrary exception text to the payment screen. */
export function headlessPaymentFailure(error) {
  if (error?.name === 'AbortError') return 'cancelled';
  if (error?.name === 'TimeoutError') return 'timeout';
  const message = String(error?.message || '').toLowerCase();
  if (error?.status === 429 || /rate|limit|too many/.test(message)) return 'rate_limited';
  if (/wallet_address_mismatch|wallet_already_linked/.test(message)) return 'mismatch';
  if (error?.code === 4001 || /reject|denied|popup closed|user cancel/.test(message)) return 'rejected';
  if (/invalid.*(?:otp|code)|(?:otp|code).*invalid|expired/.test(message)) return 'invalid_otp';
  if (/invalid.*email|email_invalid/.test(message)) return 'email_invalid';
  if (/unavailable|not configured|auth connector/.test(message)) return 'unavailable';
  return 'connection_failed';
}

/** Owns only the explicit connection/ownership activation initiated from Pagar.
 * Construction/update never sends OTPs, requests signatures or creates payments.
 * SDK auth promises cannot be cancelled at transport level; every continuation
 * is fenced by owner generation + operation identity before linking a wallet.
 * @param {{read:()=>any,onState:(state:any)=>void,reset:(scope:any)=>Promise<unknown>,restore?:(scope:any,expected:string)=>Promise<boolean>,
 * requestEmail:(email:string,scope:any)=>Promise<any>,verifyEmail:(otp:string,scope:any)=>Promise<unknown>,
 * confirmDevice:(scope:any)=>Promise<unknown>,connectSocial:(social:string,scope:any)=>Promise<unknown>,
 * connectExternal:(walletId:string,scope:any)=>Promise<unknown>,markCandidate:(value:any)=>void,
 * link:(scope:any)=>Promise<any>,openNative?:(scope:any)=>Promise<unknown>,fetchWallets?:()=>Promise<unknown>,cleanup?:()=>void,
 * now?:()=>number,timeoutMs?:number}} options */
export function createHeadlessPaymentConnection({ read, onState, reset, restore = async () => false, requestEmail, verifyEmail, confirmDevice,
  connectSocial, connectExternal, markCandidate, link, openNative, fetchWallets = async () => {}, cleanup = () => {}, now = Date.now, timeoutMs = 300_000 }) {
  let active = null, state = empty(), sendPolicy = { owner: '', generation: -1, resendAt: 0 };
  const listeners = new Set();
  const publish = patch => { state = { ...state, ...patch }; onState({ ...state }); };
  const current = request => {
    request.scope.assertActive();
    const value = read();
    if (active !== request || !value?.live || value.owner !== request.owner || value.generation !== request.generation) throw cancelled();
    return value;
  };
  const observe = (request, predicate) => request.scope.wait(() => new Promise((resolve, reject) => {
    let finished = false;
    const stop = () => { listeners.delete(check); request.scope.signal.removeEventListener('abort', stop); };
    const check = () => {
      if (finished) return;
      try { const value = current(request); if (predicate(value)) { finished = true; stop(); resolve(value); } }
      catch (error) { finished = true; stop(); reject(error); }
    };
    listeners.add(check); request.scope.signal.addEventListener('abort', stop, { once: true }); check();
  }));
  const ready = value => value.isConnected === true && Boolean(address(value.address)) && value.providerReady === true
    && (!address(value.linkedAddress) || address(value.linkedAddress) === address(value.address));
  /** @param {boolean} [prepare] @param {{signal?:AbortSignal}} [options] */
  function start(prepare = false, { signal } = {}) {
    const value = read();
    if (signal?.aborted || !value?.live || !value.owner) return Promise.reject(cancelled());
    if (active) { try { current(active); return active.promise; } catch { active.scope.cancel(); active = null; } }
    if (!value.available) return Promise.reject(new Error('headless_unavailable'));
    if (ready(value) && value.linkStatus === 'linked') return Promise.resolve(prepare ? { linked: true, address: value.linkedAddress } : { connected: true });
    let complete;
    const request = { owner: value.owner, generation: value.generation, scope: createReownFundingOperation({ timeoutMs }),
      selected: new Promise(resolve => { complete = resolve; }), complete, action: null, promise: null };
    // The resolver is assigned while constructing the Promise above.
    request.complete = complete;
    active = request;
    const abort = () => { if (active === request) request.scope.cancel(); };
    signal?.addEventListener('abort', abort, { once: true });
    const resendAt = sendPolicy.owner === value.owner && sendPolicy.generation === value.generation ? sendPolicy.resendAt : 0;
    publish({ ...empty(), phase: 'connecting', email: typeof value.email === 'string' ? value.email : '', resendAt });
    request.promise = (async () => {
      let selected = current(request);
      const restoringAddress = address(selected.linkedAddress);
      if (selected.linkStatus === 'linked' && restoringAddress && selected.isConnected !== true
        && (!address(selected.address) || address(selected.address) === restoringAddress)) {
        // The embedded frame can retain its authenticated session while AppKit
        // has not published an account yet. Probe/resume only on this explicit
        // action, before a reset would sign that reusable session out.
        const resumed = await request.scope.wait(() => { current(request); return restore(request.scope, restoringAddress); });
        selected = current(request);
        const sameBinding = value => {
          if (value.linkStatus !== 'linked' || address(value.linkedAddress) !== restoringAddress
            || (address(value.address) && address(value.address) !== restoringAddress)) throw new Error('wallet_address_mismatch');
          return value.isConnected === true && address(value.address) === restoringAddress && value.providerReady === true;
        };
        const restored = sameBinding(selected);
        if (resumed === true || restored) {
          selected = restored ? selected : await observe(request, sameBinding);
          return prepare ? { linked: true, address: selected.linkedAddress } : { connected: true };
        }
      }
      if (selected.linkStatus === 'linked' && selected.isConnected === true && restoringAddress
        && address(selected.address) === restoringAddress && selected.providerReady !== true) {
        // AppKit may restore the account before its signing provider. Keep the
        // matching session while it finishes; the existing deadline and parent
        // abort still apply. A changed identity needs a new explicit action.
        selected = await observe(request, value => {
          if (value.linkStatus !== 'linked' || address(value.linkedAddress) !== restoringAddress
            || address(value.address) !== restoringAddress || value.isConnected !== true) throw new Error('wallet_address_mismatch');
          return value.providerReady === true;
        });
        return prepare ? { linked: true, address: selected.linkedAddress } : { connected: true };
      }
      if (!(ready(selected) && selected.candidate === true)) {
        await request.scope.wait(() => { current(request); return reset(request.scope); }); current(request);
        await observe(request, value => value.isConnected !== true);
        publish({ phase: 'choosing' });
        // A user opened activation. Wallet discovery is allowed here, never on mount.
        void request.scope.wait(fetchWallets).catch(() => {});
        await request.scope.wait(() => request.selected); current(request);
        const connected = await observe(request, value => value.isConnected && value.providerReady && Boolean(address(value.address)));
        if (address(connected.linkedAddress) && address(connected.address) !== address(connected.linkedAddress)) throw new Error('wallet_address_mismatch');
        current(request); markCandidate(connected);
        selected = await observe(request, value => ready(value) && (value.linkStatus === 'linked' || value.candidate === true));
      }
      if (!prepare) return { connected: true };
      if (selected.linkStatus === 'linked') return { linked: true, address: selected.linkedAddress };
      publish({ phase: 'verifying', error: '' });
      const expected = address(selected.address);
      const result = await request.scope.wait(() => { current(request); return link(request.scope); });
      current(request);
      if (result?.linked !== true || address(result.address) !== expected) throw new Error('wallet_address_mismatch');
      return result;
    })().then(result => {
      if (active === request) { active = null; publish(empty()); }
      request.scope.finish(); return result;
    }, error => {
      if (active === request) {
        active = null;
        const value = read();
        if (value?.live && value.owner === request.owner && value.generation === request.generation) {
          // Leaving Pagar aborts its parent scope while this provider stays
          // mounted across routes. That cancellation is not a persistent error.
          const cancelledScope = error?.name === 'AbortError' && request.scope.signal.aborted;
          publish(cancelledScope ? empty() : { phase: 'error', error: headlessPaymentFailure(error) });
        }
      }
      request.scope.cancel(); throw error;
    }).finally(() => signal?.removeEventListener('abort', abort));
    return request.promise;
  }
  async function action(kind, effect, fallback, allowed = ['choosing', 'code', 'device']) {
    const request = active;
    if (!request || !allowed.includes(state.phase)) return;
    current(request);
    if (request.action) return request.action;
    publish({ phase: kind, error: '' });
    const pending = request.scope.wait(() => { current(request); return effect(request); }).catch(error => {
      try { current(request); publish({ phase: fallback, error: headlessPaymentFailure(error),
        ...(headlessPaymentFailure(error) === 'rate_limited' ? { resendAt: now() + 60_000 } : {}) }); } catch { /* Old owner/cancelled action has no UI authority. */ }
      throw error;
    }).finally(() => { if (request.action === pending) request.action = null; });
    request.action = pending; return pending;
  }
  return {
    start,
    update() { const value = read(); if (active && (!value?.live || value.owner !== active.owner || value.generation !== active.generation)) active.scope.cancel(); for (const notify of listeners) notify(); },
    cancel() { const request = active; active = null; request?.scope.cancel(); if (request) { try { cleanup(); } catch { /* Best effort SDK UI cleanup, never unlink. */ } } publish(empty()); },
    async requestEmail(email) {
      const normalized = typeof email === 'string' ? email.trim() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) { if (active) publish({ error: 'email_invalid' }); return; }
      if (now() < state.resendAt) return;
      return action('sending', async request => {
        sendPolicy = { owner: request.owner, generation: request.generation, resendAt: now() + 60_000 };
        publish({ email: normalized, resendAt: sendPolicy.resendAt });
        const result = await request.scope.wait(() => requestEmail(normalized, request.scope)); current(request);
        if (result?.action === 'VERIFY_OTP') publish({ phase: 'code' });
        else if (result?.action === 'VERIFY_DEVICE') publish({ phase: 'device' });
        else if (result?.action === 'CONNECT') { publish({ phase: 'connecting' }); request.complete(); }
        else throw new Error('auth_connector_unavailable');
      }, state.phase === 'code' ? 'code' : 'choosing');
    },
    verifyEmail(otp) {
      if (!/^\d{6}$/.test(typeof otp === 'string' ? otp : '')) { if (active) publish({ error: 'invalid_otp' }); return Promise.resolve(); }
      return action('connecting', async request => { await request.scope.wait(() => verifyEmail(otp, request.scope)); current(request); request.complete(); }, 'code', ['code']);
    },
    confirmDevice() { return action('connecting', async request => { await request.scope.wait(() => confirmDevice(request.scope)); current(request); publish({ phase: 'code' }); }, 'device', ['device']); },
    connectSocial(social) {
      if (!['google', 'apple'].includes(social)) return Promise.reject(new Error('auth_connector_unavailable'));
      return action('connecting', async request => { await request.scope.wait(() => connectSocial(social, request.scope)); current(request); request.complete(); }, 'choosing', ['choosing']);
    },
    connectExternal(walletId) { return action('connecting', async request => { await request.scope.wait(() => connectExternal(walletId, request.scope)); current(request); request.complete(); }, 'choosing', ['choosing']); },
    openNative() { return action('connecting', async request => { if (!openNative) throw new Error('auth_connector_unavailable'); await request.scope.wait(() => openNative(request.scope)); current(request); request.complete(); }, 'choosing', ['choosing', 'code', 'device']); },
    get state() { return { ...state }; },
  };
}
