export const REOWN_FUNDING_TIMEOUT_MS = 90_000;

const cancelled = () => Object.assign(new Error('reown_operation_cancelled'), { name: 'AbortError' });
const timedOut = () => Object.assign(new Error('reown_connection_timeout'), { name: 'TimeoutError' });

/** One user action, including SDK promises that cannot themselves be aborted.
 * Every continuation must enter through wait/run; late SDK results are ignored.
 * Cancelling a request cannot roll back a server write already accepted earlier.
 */
export function createReownFundingOperation({ timeoutMs = REOWN_FUNDING_TIMEOUT_MS, onStop = (_error) => {} } = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 300_000) throw new RangeError('invalid_reown_deadline');
  const controller = new AbortController();
  let active = true;
  let failure;
  let timer;
  const clear = () => { if (timer !== undefined) { clearTimeout(timer); timer = undefined; } };
  const assertActive = () => { if (!active) throw failure || cancelled(); };
  const stop = error => {
    if (!active) return;
    active = false; failure = error; clear();
    controller.abort(error);
    try { onStop(error); } catch { /* cleanup cannot change cancellation */ }
  };
  timer = setTimeout(() => stop(timedOut()), timeoutMs);
  return {
    get active() { return active; },
    signal: controller.signal,
    assertActive,
    cancel() { stop(cancelled()); },
    finish() { active = false; clear(); },
    run(effect) { assertActive(); return effect(); },
    wait(effect) {
      return new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => controller.signal.removeEventListener('abort', abort);
        const abort = () => {
          if (settled) return;
          settled = true; cleanup(); reject(failure || cancelled());
        };
        if (!active) { abort(); return; }
        controller.signal.addEventListener('abort', abort, { once: true });
        Promise.resolve().then(() => { assertActive(); return effect(); }).then(value => {
          if (settled) return;
          settled = true; cleanup();
          try { assertActive(); resolve(value); } catch (error) { reject(error); }
        }, error => {
          if (settled) return;
          settled = true; cleanup(); reject(error);
        });
      });
    },
  };
}

const sameAddress = (left, right) => typeof left === 'string' && typeof right === 'string'
  && /^0x[0-9a-f]{40}$/i.test(left) && /^0x[0-9a-f]{40}$/i.test(right) && left.toLowerCase() === right.toLowerCase();

/** The only successful link is an owned backend acknowledgement after a signature.
 * Connection alone never confirms ownership and never starts a funding intent.
 */
export async function verifyReownWalletOwnership(operation, { address, requestLink, createSigner, onLinked }) {
  const challenge = await operation.wait(() => requestLink('/api/member/wallet-link/challenge', { address }, { signal: operation.signal }));
  if (challenge?.linked === true) {
    if (!sameAddress(challenge.address, address)) throw new Error('wallet_address_mismatch');
    operation.run(() => onLinked(challenge.address));
    return challenge;
  }
  if (!sameAddress(challenge?.address, address) || typeof challenge?.message !== 'string' || !challenge.message.length
    || challenge.message.length > 4096 || !/^[0-9a-f-]{36}$/i.test(challenge?.challengeId || '')) throw new Error('wallet_challenge_invalid');
  const signer = await operation.wait(createSigner);
  if (!sameAddress(await operation.wait(() => signer.getAddress()), address)) throw new Error('wallet_address_mismatch');
  const signature = await operation.wait(() => signer.signMessage(challenge.message));
  const confirmed = await operation.wait(() => requestLink('/api/member/wallet-link/confirm', {
    challengeId: challenge.challengeId, signature,
  }, { signal: operation.signal }));
  if (confirmed?.linked !== true || !sameAddress(confirmed.address, address)) throw new Error('wallet_link_unconfirmed');
  operation.run(() => onLinked(confirmed.address));
  return confirmed;
}
