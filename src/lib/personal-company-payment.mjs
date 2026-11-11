import { Interface } from 'ethers';
import { PERSONAL_COMPANY_PAYMENT, personalCompanyPaymentAtomic as atomic, formatPersonalCompanyPaymentAmount } from './personal-company-payment-values.mjs';
export { PERSONAL_COMPANY_PAYMENT, personalCompanyPaymentAmountAtomic, formatPersonalCompanyPaymentAmount } from './personal-company-payment-values.mjs';
const ABI = new Interface(['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)',
  'function transfer(address,uint256) returns (bool)']);
const ADDRESS = /^0x[0-9a-f]{40}$/i;
const HASH = /^0x[0-9a-f]{64}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_UINT256 = (1n << 256n) - 1n;
const error = (code, name = 'Error') => Object.assign(new Error(code), { name, transactionMayExist: false });
const cancelled = () => error('personal_company_cancelled', 'AbortError');
const address = value => typeof value === 'string' && ADDRESS.test(value) ? value.toLowerCase() : null;

export function personalCompanyPaymentIntent(value, walletAddress, now = Date.now()) {
  const sender = address(walletAddress);
  if (value && typeof value === 'object' && value.abandonedAt !== null && value.abandonedAt !== undefined) throw error('personal_company_intent_abandoned');
  if (!value || typeof value !== 'object' || Array.isArray(value) || !sender
    || typeof value.paymentId !== 'string' || !UUID.test(value.paymentId)
    || address(value.walletAddress) !== sender || sender === PERSONAL_COMPANY_PAYMENT.recipientAddress
    || value.chainId !== PERSONAL_COMPANY_PAYMENT.chainId || value.tokenDecimals !== PERSONAL_COMPANY_PAYMENT.tokenDecimals
    || address(value.tokenAddress) !== PERSONAL_COMPANY_PAYMENT.tokenAddress
    || address(value.recipientAddress) !== PERSONAL_COMPANY_PAYMENT.recipientAddress
    || atomic(value.amountAtomic) === null || value.status !== 'prepared'
    || typeof value.expiresAt !== 'string' || value.expiresAt.length > 64 || !Number.isFinite(Date.parse(value.expiresAt))) {
    throw error('personal_company_invalid_intent');
  }
  if (!Number.isFinite(now) || Date.parse(value.expiresAt) <= now) throw error('personal_company_intent_expired');
  return Object.freeze({ paymentId: value.paymentId.toLowerCase(), walletAddress: sender, ...PERSONAL_COMPANY_PAYMENT,
    amountAtomic: value.amountAtomic, status: 'prepared', abandonedAt: null, expiresAt: value.expiresAt });
}

function quantity(value) {
  if (typeof value !== 'string' || value.length > 66 || !/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(value)) throw error('personal_company_rpc_unavailable');
  return BigInt(value);
}

function uintResult(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]{64}$/i.test(value)) throw error('personal_company_rpc_unavailable');
  return BigInt(value);
}

function walletContext(walletProvider, walletAddress, signal, readTimeoutMs) {
  if (!walletProvider || typeof walletProvider.request !== 'function' || !address(walletAddress)) throw error('personal_company_wallet_unavailable');
  let changed;
  const accountsChanged = accounts => { if (!Array.isArray(accounts) || address(accounts[0]) !== walletAddress) changed = 'personal_company_wallet_changed'; };
  const chainChanged = chain => { try { if (quantity(chain) !== 137n) changed = 'personal_company_chain_changed'; } catch { changed = 'personal_company_chain_changed'; } };
  const assertActive = () => { if (signal?.aborted) throw cancelled(); if (changed) throw error(changed); };
  if (typeof walletProvider.on === 'function' && typeof walletProvider.removeListener === 'function') {
    walletProvider.on('accountsChanged', accountsChanged); walletProvider.on('chainChanged', chainChanged);
  }
  async function read(method, params = []) {
    assertActive();
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort); fn(value); };
      const abort = () => finish(reject, cancelled());
      const timer = setTimeout(() => finish(reject, error('personal_company_rpc_unavailable', 'TimeoutError')), readTimeoutMs);
      signal?.addEventListener('abort', abort, { once: true });
      Promise.resolve().then(() => { assertActive(); return walletProvider.request({ method, params }); }).then(value => {
        try { assertActive(); finish(resolve, value); } catch (failure) { finish(reject, failure); }
      }, failure => {
        try { assertActive(); finish(reject, failure?.name === 'AbortError' ? cancelled() : error('personal_company_rpc_unavailable')); }
        catch (changedContext) { finish(reject, changedContext); }
      });
    });
  }
  async function verify() {
    const [chain, accounts] = await Promise.all([read('eth_chainId'), read('eth_accounts')]);
    if (quantity(chain) !== 137n) throw error('personal_company_chain_changed');
    if (!Array.isArray(accounts) || address(accounts[0]) !== walletAddress) throw error('personal_company_wallet_changed');
    assertActive();
  }
  const tokenRead = data => read('eth_call', [{ to: PERSONAL_COMPANY_PAYMENT.tokenAddress, data }, 'latest']).then(uintResult);
  return { assertActive, read, verify,
    balance: () => tokenRead(ABI.encodeFunctionData('balanceOf', [walletAddress])),
    async decimals() { if (await tokenRead(ABI.encodeFunctionData('decimals')) !== 6n) throw error('personal_company_token_mismatch'); },
    dispose() { if (typeof walletProvider.removeListener === 'function') { walletProvider.removeListener('accountsChanged', accountsChanged); walletProvider.removeListener('chainChanged', chainChanged); } },
  };
}

/** Read-only MAX snapshot. No requestAccounts, chain switch, approval or signature. */
export async function readPersonalCompanyPaymentBalance({ walletProvider, walletAddress, signal, readTimeoutMs = 10_000 }) {
  const sender = address(walletAddress);
  const context = walletContext(walletProvider, sender, signal, readTimeoutMs);
  try {
    await context.verify();
    await context.decimals();
    const balance = await context.balance();
    await context.verify();
    return Object.freeze({ walletAddress: sender, ...PERSONAL_COMPANY_PAYMENT,
      balanceAtomic: balance.toString(), amount: formatPersonalCompanyPaymentAmount(balance.toString()) });
  } finally { context.dispose(); }
}

/** One explicit user action. The caller prepares the backend intent first.
 * Persist onDispatchStart before the wallet RPC; persist/submit every onBroadcast
 * hash, even after cancellation. Never automatically retry an ambiguous send.
 */
export function createPersonalCompanyPaymentTransfer({ walletProvider, walletAddress, onDispatchStart, onBroadcast,
  onStateChange = (_state) => {}, now = Date.now, readTimeoutMs = 10_000, broadcastTimeoutMs = 90_000 }) {
  const sender = address(walletAddress);
  if (!sender || !walletProvider || typeof walletProvider.request !== 'function'
    || typeof onDispatchStart !== 'function' || typeof onBroadcast !== 'function' || typeof now !== 'function'
    || typeof onStateChange !== 'function' || !Number.isFinite(readTimeoutMs) || readTimeoutMs <= 0 || readTimeoutMs > 60_000
    || !Number.isFinite(broadcastTimeoutMs) || broadcastTimeoutMs <= 0 || broadcastTimeoutMs > 300_000) throw error('personal_company_wallet_unavailable');
  const records = new Map();
  let current;
  const view = record => record ? Object.freeze({ paymentId: record.intent.paymentId, walletAddress: sender,
    amountAtomic: record.intent.amountAtomic, phase: record.phase, transactionHash: record.transactionHash || null,
    transactionMayExist: record.dispatched && record.phase !== 'rejected', retryable: record.phase === 'rejected',
    ...(record.errorCode ? { errorCode: record.errorCode } : {}) }) : null;
  const notify = record => { try { void Promise.resolve(onStateChange(view(record))).catch(() => {}); } catch { /* state remains available through snapshot */ } };
  const update = (record, phase, errorCode = '') => { record.phase = phase; record.errorCode = errorCode; notify(record); return view(record); };

  function dispatch(record, transaction, signal, assertActive) {
    // Be conservative while notifying UI: it must retain its persisted marker.
    record.dispatched = true;
    update(record, 'signing');
    try { assertActive(); } catch (failure) { record.dispatched = false; throw failure; }
    let walletResult;
    try { walletResult = walletProvider.request({ method: 'eth_sendTransaction', params: [transaction] }); }
    catch (failure) { walletResult = Promise.reject(failure); }
    // This continuation deliberately survives AbortSignal and UI unmount.
    const retainHash = hash => {
      if (typeof hash !== 'string' || !HASH.test(hash)) return update(record, 'ambiguous', 'personal_company_broadcast_ambiguous');
      record.transactionHash = hash.toLowerCase();
      const result = update(record, 'broadcast');
      try { void Promise.resolve(onBroadcast(result)).catch(() => {}); } catch { /* keep hash for registry-only retry */ }
      return view(record);
    };
    const eventual = Promise.resolve(walletResult).then(retainHash, failure => {
      if (typeof failure?.transactionHash === 'string' && HASH.test(failure.transactionHash)) return retainHash(failure.transactionHash);
      return failure?.code === 4001
        ? update(record, 'rejected', 'personal_company_rejected')
        : update(record, 'ambiguous', 'personal_company_broadcast_ambiguous');
    });
    return new Promise(resolve => {
      let settled = false;
      const finish = value => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort); resolve(value); };
      const ambiguous = () => finish(update(record, 'ambiguous', 'personal_company_broadcast_ambiguous'));
      const abort = ambiguous;
      const timer = setTimeout(ambiguous, broadcastTimeoutMs);
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) ambiguous();
      void eventual.then(finish);
    });
  }

  /** @param {any} record @param {{signal?: AbortSignal, reviewedBalanceAtomic: string}} options */
  async function run(record, { signal, reviewedBalanceAtomic }) {
    const context = walletContext(walletProvider, sender, signal, readTimeoutMs);
    try {
      await context.verify();
      await context.decimals();
      const reviewedBalance = atomic(reviewedBalanceAtomic, true);
      const balance = await context.balance();
      if (reviewedBalance === null || balance !== reviewedBalance) throw error('personal_company_balance_changed');
      const amount = BigInt(record.intent.amountAtomic);
      if (amount > balance) throw error('personal_company_insufficient_usdt');
      const transaction = { from: sender, to: PERSONAL_COMPANY_PAYMENT.tokenAddress, value: '0x0', chainId: '0x89',
        data: ABI.encodeFunctionData('transfer', [PERSONAL_COMPANY_PAYMENT.recipientAddress, amount]) };
      const [price, native] = await Promise.all([
        context.read('eth_gasPrice').then(quantity),
        context.read('eth_getBalance', [sender, 'pending']).then(quantity),
      ]);
      if (native === 0n) throw error('personal_company_insufficient_pol');
      const estimated = await context.read('eth_estimateGas', [transaction]).then(quantity);
      if (estimated <= 0n || price <= 0n) throw error('personal_company_gas_unavailable');
      const gasLimit = (estimated * 120n + 99n) / 100n;
      if (gasLimit > MAX_UINT256 || gasLimit * price > native) throw error('personal_company_insufficient_pol');
      transaction.gas = `0x${gasLimit.toString(16)}`;
      transaction.gasPrice = `0x${price.toString(16)}`;
      if (await context.balance() !== reviewedBalance) throw error('personal_company_balance_changed');
      await context.verify();
      personalCompanyPaymentIntent(record.intent, sender, now());
      await onDispatchStart(Object.freeze({ ...record.intent, phase: 'signing' }));
      await context.verify();
      if (await context.balance() !== reviewedBalance) throw error('personal_company_balance_changed');
      context.assertActive();
      personalCompanyPaymentIntent(record.intent, sender, now());
      return await dispatch(record, Object.freeze(transaction), signal, context.assertActive);
    } catch (failure) {
      if (!record.dispatched) update(record, 'reviewing', failure?.message || 'personal_company_unavailable');
      throw failure;
    } finally { context.dispose(); }
  }

  return Object.freeze({
    snapshot(paymentId = current) { return view(records.get(paymentId)); },
    /** @param {unknown} value @param {{signal?: AbortSignal, reviewedBalanceAtomic: string}} options */
    sendPrepared(value, options) {
      if (!options || typeof options !== 'object' || Array.isArray(options) || atomic(options.reviewedBalanceAtomic, true) === null) {
        return Promise.reject(error('personal_company_balance_changed'));
      }
      const intent = personalCompanyPaymentIntent(value, sender, now());
      let record = records.get(intent.paymentId);
      if (record && JSON.stringify(record.intent) !== JSON.stringify(intent)) return Promise.reject(error('personal_company_intent_changed'));
      if (record?.promise) return record.promise;
      if (record?.dispatched && record.phase !== 'rejected') return Promise.resolve(view(record));
      if ([...records.values()].some(item => item !== record && (item.promise || ['signing', 'ambiguous', 'broadcast'].includes(item.phase)))) {
        return Promise.reject(error('personal_company_previous_payment_unresolved'));
      }
      current = intent.paymentId;
      record = { intent, phase: 'reviewing', dispatched: false, transactionHash: null, errorCode: '' };
      records.set(current, record); notify(record);
      record.promise = run(record, options).finally(() => { record.promise = null; });
      return record.promise;
    },
    markSubmitted(paymentId, transactionHash) {
      const record = records.get(paymentId);
      if (!record || record.phase !== 'broadcast' || record.transactionHash !== transactionHash?.toLowerCase()) throw error('personal_company_invalid_transaction');
      return update(record, 'submitted');
    },
  });
}
