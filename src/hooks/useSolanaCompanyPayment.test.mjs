import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import ts from 'typescript';
import { Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { createTransferCheckedInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import * as contracts from '../lib/solana-wallet-contract.mjs';
import * as signing from '../lib/solana-payment-signing.mjs';
import * as amounts from '../lib/personal-company-payment-values.mjs';
import { personalWalletBalanceSessionKey } from '../lib/personal-wallet-balance-store.mjs';
import { createReownFundingOperation } from '../lib/reown-funding-operation.mjs';

// Deterministic test keys and transactions only. No RPC, wallet app or funds.
const owner = Keypair.fromSeed(new Uint8Array(32).fill(4)), payer = Keypair.fromSeed(new Uint8Array(32).fill(7));
const wallet = owner.publicKey.toBase58(), otherWallet = Keypair.fromSeed(new Uint8Array(32).fill(5)).publicKey.toBase58();
const policy = contracts.SOLANA_PERSONAL_WALLET, source = getAssociatedTokenAddressSync(new PublicKey(policy.mintAddress), owner.publicKey).toBase58();
const id = '11111111-1111-4111-8111-111111111111', balanceAtomic = '10000001';
const createdAt = new Date(Date.now() - 1000).toISOString(), expiresAt = new Date(Date.now() + 600_000).toISOString();
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
let encoded = '', n = BigInt(`0x${Buffer.alloc(64, 8).toString('hex')}`);
while (n) { encoded = alphabet[Number(n % 58n)] + encoded; n /= 58n; }
const transactionSignature = encoded;
function payment(patch = {}) {
  const amountAtomic = patch.amountAtomic ?? balanceAtomic;
  const transaction = new Transaction({ feePayer: payer.publicKey, recentBlockhash: new PublicKey(new Uint8Array(32).fill(9)).toBase58() })
    .add(createTransferCheckedInstruction(new PublicKey(source), new PublicKey(policy.mintAddress), new PublicKey(policy.destinationTokenAccount), owner.publicKey, BigInt(amountAtomic), 6));
  const value = { paymentId: id, walletKind: 'personal', network: policy.network, cluster: policy.cluster, walletAddress: wallet,
    mintAddress: policy.mintAddress, tokenDecimals: 6, recipientAddress: policy.recipientAddress, sourceTokenAccount: source,
    destinationTokenAccount: policy.destinationTokenAccount, amountAtomic, status: 'prepared', transactionSignature: null, createdAt, expiresAt,
    blockhash: transaction.recentBlockhash, lastValidBlockHeight: '1234567', messageHash: createHash('sha256').update(transaction.serializeMessage()).digest('hex'),
    feePayerAddress: payer.publicKey.toBase58(), estimatedFeeLamports: '5000', maxFeeLamports: '3000000',
    transactionBase64: transaction.serialize({ requireAllSignatures: false }).toString('base64'), membershipAssignment: 'pending', slot: null, finalizedAt: null,
    confirmationStatus: 'unconfirmed', ...patch };
  if (value.status !== 'prepared') value.transactionBase64 = null;
  assert.ok(contracts.solanaPaymentView(value), 'test payment violates the wire contract'); return value;
}
const submitted = patch => payment({ status: 'submitted', transactionSignature, ...patch });
const confirmed = patch => payment({ status: 'confirmed', transactionSignature, slot: '1000000', finalizedAt: new Date().toISOString(), confirmationStatus: 'finalized', ...patch });
function balance(patch = {}) { return { walletKind: 'personal', network: policy.network, cluster: policy.cluster, walletAddress: wallet,
  mintAddress: policy.mintAddress, tokenDecimals: 6, sourceTokenAccount: source, scope: 'associated_token_account', balanceAtomic,
  nativeBalanceAtomic: '0', observedAt: new Date().toISOString(), ...patch }; }
function locks() { const held = new Set(); return { async request(key, _options, callback) {
  if (held.has(key)) return callback(null); held.add(key); try { return await callback({ name: key }); } finally { held.delete(key); }
} }; }
function clock() {
  let now = 0, id = 0; const timers = new Map();
  return { setTimeout(callback, duration) { const key = ++id; timers.set(key, { callback, at: now + duration }); return key; },
    clearTimeout(key) { timers.delete(key); }, get now() { return now; }, tick(duration) {
      now += duration; for (const [key, timer] of [...timers]) if (timer.at <= now && timers.delete(key)) timer.callback(); } };
}
function harness(overrides = {}) {
  const slots = [], effects = [], calls = [], signatures = [], storage = overrides.storage || new Map();
  let cursor = 0, dirty = true, current, currentPayment = null, paymentOwner = '', boundWallet = wallet, sdkWallet = wallet, connected = overrides.connected !== false;
  let session = { subject: 'owner-A', email: 'member@example.test' };
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem(key, value) { if (overrides.storageFailure) throw Error('quota'); storage.set(key, value); }, removeItem: key => storage.delete(key) };
  const browser = Object.assign(new EventTarget(), { localStorage }), documentRef = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const provider = { get publicKey() { return new PublicKey(sdkWallet); }, async signTransaction(transaction) {
    signatures.push(transaction); if (overrides.sign) return overrides.sign(transaction);
    transaction.partialSign(owner); return transaction;
  }, signAndSendTransaction() { assert.fail('browser attempted to broadcast'); }, sendTransaction() { assert.fail('browser attempted to broadcast'); } };
  const getProvider = () => provider;
  const solana = () => ({ linkedAddress: boundWallet, address: sdkWallet, linkStatus: 'linked', isConnected: connected, isLinked: connected && sdkWallet === boundWallet,
    getProvider, connectWallet: async () => calls.push({ action: 'connect' }), linkWallet: async () => calls.push({ action: 'link' }), ...overrides.solana });
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]));
  const hooks = {
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useState(value) { const index = cursor++, cell = slots[index] ??= { value: typeof value === 'function' ? value() : value };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update; if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } }; return [cell.value, cell.set]; },
    useCallback(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.value = callback; cell.deps = deps; } return cell.value; },
    useMemo(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.value = callback(); cell.deps = deps; } return cell.value; },
    useEffect(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); }); } },
  };
  const client = {
    async readSolanaCapabilities(options) { calls.push({ action: 'capabilities' }); return overrides.capabilities ? overrides.capabilities(options) : {
      walletKind: 'personal', network: 'solana', cluster: 'mainnet-beta', transferEnabled: true, sponsorship: 'mindbliss' }; },
    async readSolanaBalance(options) { calls.push({ action: 'balance' }); return overrides.balance ? overrides.balance(options) : balance({ walletAddress: boundWallet }); },
    async readSolanaPayments(options) { calls.push({ action: 'history' }); return overrides.history ? overrides.history(options) : { walletKind: 'personal', payments: currentPayment && paymentOwner === session?.subject ? [currentPayment] : [] }; },
    async readSolanaPayment(paymentId, options) { calls.push({ action: 'status', paymentId, options }); return overrides.status ? overrides.status(paymentId, options) : currentPayment || payment(); },
    async writeSolanaPayment(action, input, options) {
      calls.push({ action, input, options }); if (overrides.write) return overrides.write(action, input, options);
      if (action === 'prepare') { currentPayment = payment({ paymentId: input.requestId, amountAtomic: input.amountAtomic }); paymentOwner = session.subject; }
      else if (action === 'submit') {
        const signed = Transaction.from(Buffer.from(input.transactionBase64, 'base64'));
        assert.equal(signed.signatures[0].signature, null); assert.equal(signed.signatures[1].signature.length, 64); assert.ok(signed.verifySignatures(false));
        currentPayment = submitted();
      } else currentPayment = confirmed();
      return currentPayment;
    },
  };
  const mocks = { react: hooks, '@/lib/member-session-context': { useMemberSession: () => session },
    '@/lib/personal-wallet-balance-store.mjs': { personalWalletBalanceSessionKey }, '@/lib/personal-company-payment-values.mjs': amounts,
    '@/lib/solana-wallet-contract.mjs': contracts, '@/lib/solana-payment-client.mjs': client, '@/lib/solana-payment-signing.mjs': signing,
    '@/lib/reown-funding-operation.mjs': { createReownFundingOperation: options => createReownFundingOperation({ ...options, ...(overrides.timeoutMs ? { timeoutMs: overrides.timeoutMs } : {}) }) } };
  const code = ts.transpileModule(readFileSync(new URL('./useSolanaCompanyPayment.jsx', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'document', 'crypto', 'globalThis', 'Date', 'setTimeout', 'clearTimeout', code)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected Solana hook dependency: ${name}`); return mocks[name];
  }, module, module.exports, browser, documentRef, { subtle: webcrypto.subtle, randomUUID: () => id }, { navigator: { locks: overrides.locks || locks() } }, overrides.Date || Date,
  overrides.setTimeout || setTimeout, overrides.clearTimeout || clearTimeout);
  function render() { cursor = 0; dirty = false; current = module.exports.useSolanaCompanyPayment(solana()); }
  return { get flow() { return current; }, calls, signatures, storage, browser, documentRef,
    async flush() { for (let turn = 0, quiet = 0; turn < 80; turn++) {
      if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
      if (dirty || effects.length) quiet = 0; else if (++quiet === 3) return current;
    } assert.fail('Solana hook did not settle'); },
    async session(next, flush = true) { session = next; dirty = true; if (!flush) { render(); return current; } return this.flush(); },
    async account(next) { sdkWallet = next; dirty = true; return this.flush(); },
    async wallet(next) { boundWallet = next; sdkWallet = next; dirty = true; return this.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); } };
}
const writes = h => h.calls.filter(call => ['prepare', 'submit', 'verify'].includes(call.action));
async function review(h) { await h.flush(); h.flow.setAmount('10.000001'); await h.flush(); await h.flow.review(); await h.flush(); }
async function waitForSignature(h) {
  const until = Date.now() + 2000;
  while (!h.signatures.length && Date.now() < until) { await h.flush(); await new Promise(resolve => setTimeout(resolve, 1)); }
  assert.equal(h.signatures.length, 1, `signer did not open: ${h.flow.errorKey}`);
}

test('Solana reads only the bound ATA and local MAX/preview/edit cannot prepare, sign or broadcast', async t => {
  const h = harness(); t.after(() => h.unmount()); await h.flush();
  assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.equal(h.flow.amount, '10.000001'); assert.equal(h.flow.nativeBalanceAtomic, '0');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
  await review(h); assert.equal(h.flow.preview.amountAtomic, balanceAtomic); assert.equal(h.flow.preview.network, 'solana'); assert.equal(h.flow.payment, null);
  h.flow.cancelReview(); await h.flush(); assert.equal(h.flow.stage, 'form'); assert.equal(h.flow.preview, null);
  h.flow.setAmount('18446744073709.551616'); await h.flush(); await h.flow.review(); await h.flush(); assert.equal(h.flow.preview, null);
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('one explicit confirmation durably prepares and validates before one partial signature and backend-only submission', async t => {
  const h = harness(); t.after(() => h.unmount()); await review(h); await h.flow.confirm(); await h.flush();
  assert.deepEqual(writes(h).map(call => call.action), ['prepare', 'submit']); assert.equal(h.signatures.length, 1);
  assert.equal(h.flow.payment.status, 'submitted'); assert.equal(h.flow.recovery.phase, 'submitting');
  assert.deepEqual(writes(h)[0].input, { requestId: id, amountAtomic: balanceAtomic });
  for (const [key, raw] of h.storage) {
    assert.ok(!key.includes('member@example.test')); const value = JSON.parse(raw);
    assert.deepEqual(Object.keys(value).sort(), ['paymentId', 'phase', 'version', 'walletAddress']); assert.equal(value.walletAddress, wallet);
    assert.ok(!raw.includes('transactionBase64')); assert.ok(!raw.includes(writes(h)[1].input.transactionBase64));
  }
  await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1); assert.equal(writes(h).length, 2);
});

test('an immutable status may omit unsigned bytes while a canonical confirmation defeats a late partial signature', async () => {
  const minimal = harness({ status: async () => payment({ transactionBase64: null }) });
  try { await review(minimal); await minimal.flow.confirm(); await minimal.flush(); assert.equal(minimal.flow.payment.status, 'submitted'); assert.equal(minimal.signatures.length, 1); }
  finally { minimal.unmount(); }
  const signer = deferred(), history = deferred();
  const h = harness({ history: async () => history.promise, sign: async transaction => { transaction.partialSign(owner); await signer.promise; return transaction; } });
  try {
    await review(h); const confirming = h.flow.confirm(); await waitForSignature(h);
    history.resolve({ payments: [confirmed()] }); await h.flush(); assert.equal(h.flow.payment.status, 'confirmed');
    signer.resolve(); await confirming; await h.flush(); assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.recovery, null);
    assert.deepEqual(writes(h).map(call => call.action), ['prepare']);
  } finally { signer.resolve(); history.resolve({ payments: [] }); h.unmount(); }
});

test('capability pause, malformed server message, mismatched ATA and unavailable recovery storage stop before a wallet prompt', async () => {
  for (const kind of ['disabled', 'message', 'ata', 'storage']) {
    let enabled = true;
    const h = harness({ storageFailure: kind === 'storage', capabilities: async () => ({ transferEnabled: enabled }),
      status: async () => payment(kind === 'message' ? { messageHash: 'a'.repeat(64) } : kind === 'ata' ? { sourceTokenAccount: otherWallet } : {}) });
    try {
      await review(h); if (kind === 'disabled') enabled = false; await h.flow.confirm(); await h.flush();
      assert.equal(h.signatures.length, 0); assert.equal(writes(h).some(call => call.action === 'submit'), false); assert.ok(h.flow.errorKey);
    } finally { h.unmount(); }
  }
});

test('confirmation rechecks the owner ATA and requires a fresh review if MAX changed before any prepare or signature', async t => {
  let changed = false;
  const h = harness({ balance: async () => balance({ balanceAtomic: changed ? '9000000' : balanceAtomic }) }); t.after(() => h.unmount());
  await review(h); changed = true; await h.flow.confirm(); await h.flush();
  assert.equal(h.flow.balanceAtomic, '9000000'); assert.equal(h.flow.errorKey, 'walletTransfer.insufficientBalance');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('known signature rejection may be explicitly reconfirmed, while unknown signing never signs or submits again', async () => {
  for (const rejected of [true, false]) {
    const h = harness({ sign: async () => { throw rejected ? Object.assign(Error('rejected'), { code: 4001 }) : TypeError('unknown signer result'); } });
    try {
      await review(h); await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1);
      if (rejected) { assert.equal(h.flow.recovery, null); assert.equal(h.flow.stage, 'review'); await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 2); }
      else { assert.equal(h.flow.recovery.phase, 'ambiguous'); await h.flow.confirm(); await h.flow.resume(); await h.flush(); assert.equal(h.signatures.length, 1); }
      assert.equal(writes(h).some(call => call.action === 'submit'), false);
    } finally { h.unmount(); }
  }
});

test('an uncertain submit survives reload and recovers with status/verify, never by signing or resending the partial transaction', async () => {
  const storage = new Map(); let sent = false;
  const a = harness({ storage, status: async () => sent ? submitted() : payment(), write: async (action, input) => {
    if (action === 'prepare') return payment({ paymentId: input.requestId }); sent = true; throw TypeError('lost submit ACK');
  } });
  await review(a); await a.flow.confirm(); await a.flush(); assert.equal(a.flow.recovery.phase, 'ambiguous'); a.unmount();
  const b = harness({ storage, connected: false, history: async () => ({ payments: [submitted()] }), status: async () => submitted(),
    write: async action => { assert.equal(action, 'verify'); return confirmed(); } });
  try {
    await b.flush(); assert.equal(b.flow.payment.status, 'submitted'); assert.equal(b.flow.connected, false);
    await b.flow.confirm(); await b.flow.resume(); await b.flush(); assert.equal(b.signatures.length, 0); assert.deepEqual(writes(b), []);
    await b.flow.verifyPayment(); await b.flush(); assert.equal(b.flow.payment.status, 'confirmed'); assert.equal(b.flow.recovery, null);
    assert.deepEqual(writes(b).map(call => call.action), ['verify']); assert.equal(storage.size, 0);
    b.flow.newPayment(); await b.flush(); assert.equal(b.flow.stage, 'form'); assert.equal(b.flow.payment, null);
  } finally { b.unmount(); }
});

test('owner changes, exact-case account changes and unmount discard a late partial signature before backend submit', async () => {
  for (const kind of ['owner', 'account', 'unmount']) {
    const pending = deferred(), h = harness({ sign: async transaction => { transaction.partialSign(owner); await pending.promise; return transaction; } });
    try {
      await review(h); const confirming = h.flow.confirm(); await waitForSignature(h);
      if (kind === 'owner') await h.session({ subject: 'owner-B', email: 'member@example.test' });
      else if (kind === 'account') await h.account(otherWallet); else h.unmount();
      pending.resolve(); await confirming; await h.flush(); assert.equal(writes(h).some(call => call.action === 'submit'), false);
      if (kind === 'owner') { assert.equal(h.flow.payment, null); assert.equal(h.flow.preview, null); }
    } finally { h.unmount(); }
  }
});

test('foreign owner reads and immutable message changes never overwrite the scoped payment or unlock recovery', async () => {
  const foreign = harness({ history: async () => ({ payments: [payment({ walletAddress: otherWallet })] }), balance: async () => balance({ walletAddress: otherWallet }) });
  try { await foreign.flush(); assert.deepEqual(foreign.flow.history, []); assert.equal(foreign.flow.balanceAtomic, null); assert.equal(foreign.flow.payment, null); }
  finally { foreign.unmount(); }
  let changed = false;
  const h = harness({ history: async () => ({ payments: [changed ? confirmed({ amountAtomic: '1' }) : submitted()] }), status: async () => submitted(),
    write: async action => { assert.equal(action, 'verify'); return confirmed({ amountAtomic: '1' }); } });
  try {
    await h.flush(); await h.flow.verifyPayment(); await h.flush(); assert.equal(h.flow.payment.status, 'submitted'); assert.equal(h.flow.errorKey, 'walletTransfer.invalidAuthorization');
    changed = true; h.flow.refresh(); await h.flush(); assert.equal(h.flow.payment.status, 'submitted');
  } finally { h.unmount(); }
});

test('foreground verification is single-flight, stops when hidden or logged out, and announces a finalized balance once', async t => {
  const timers = clock(), pending = deferred(); let finalized = false, signal, notifications = 0;
  class PollDate extends Date { static now() { return timers.now; } }
  const h = harness({ Date: PollDate, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    history: async () => ({ payments: [finalized ? confirmed() : submitted()] }), status: async () => finalized ? confirmed() : submitted(),
    write: async (action, _input, options) => { assert.equal(action, 'verify'); signal = options.signal; await pending.promise; return finalized ? confirmed() : submitted(); } });
  t.after(() => h.unmount()); h.browser.addEventListener('vp:personal-solana-wallet-balance-changed', () => notifications++);
  await h.flush(); timers.tick(12_000); await h.flush(); assert.equal(writes(h).length, 1);
  timers.tick(24_000); await h.flush(); assert.equal(writes(h).length, 1);
  h.documentRef.visibilityState = 'hidden'; h.documentRef.dispatchEvent(new Event('visibilitychange')); await h.flush(); assert.equal(signal.aborted, true);
  finalized = true; pending.resolve(); await h.flush(); assert.equal(h.flow.payment.status, 'submitted');
  h.documentRef.visibilityState = 'visible'; h.documentRef.dispatchEvent(new Event('visibilitychange')); timers.tick(12_000); await h.flush();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(notifications, 1);
  h.flow.refresh(); await h.flush(); await h.flow.selectHistory(confirmed()); await h.flush(); assert.equal(notifications, 1);
  timers.tick(24_000); await h.flush(); assert.equal(writes(h).length, 1); assert.equal(h.signatures.length, 0);
});

test('u64 MAX preserves all six decimals and zero/unavailable balances stay distinct without an SDK login', async () => {
  const maximum = '18446744073709551615';
  for (const value of [maximum, '0', null]) {
    const h = harness({ connected: false, balance: async () => value === null ? null : balance({ balanceAtomic: value }) });
    try {
      await h.flush(); assert.equal(h.flow.balanceAtomic, value); assert.equal(h.flow.connected, false);
      assert.equal(h.flow.amount, value === maximum ? '18446744073709.551615' : '');
      assert.equal(Boolean(h.flow.errorKey), value === null); assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
    } finally { h.unmount(); }
  }
});

test('a recovered prepared record after an unknown submit cannot be signed again and clears only after canonical expiry', async () => {
  const storage = new Map();
  const a = harness({ storage, write: async (action, input) => {
    if (action === 'prepare') return payment({ paymentId: input.requestId }); throw TypeError('uncertain submission');
  } });
  await review(a); await a.flow.confirm(); await a.flush(); a.unmount();
  const b = harness({ storage, connected: false, history: async () => ({ payments: [] }), status: async () => payment(),
    write: async action => { assert.equal(action, 'verify'); return payment({ status: 'expired' }); } });
  try {
    await b.flush(); assert.equal(b.flow.payment.paymentId, id); assert.equal(b.flow.payment.status, 'prepared'); assert.ok(b.flow.recovery);
    assert.ok(b.calls.some(call => call.action === 'status' && call.paymentId === id));
    await b.flow.resume(); await b.flow.confirm(); b.flow.newPayment(); await b.flush(); assert.deepEqual(writes(b), []); assert.ok(b.flow.payment);
    await b.flow.verifyPayment(); await b.flush(); assert.equal(b.flow.payment.status, 'expired'); assert.equal(b.flow.recovery, null); assert.equal(storage.size, 0);
    assert.equal(b.signatures.length, 0); assert.deepEqual(writes(b).map(call => call.action), ['verify']);
  } finally { b.unmount(); }
});

test('one origin-wide Solana wallet lock prevents a second tab from preparing while the first signature is pending', async () => {
  const lock = locks(), pending = deferred(), a = harness({ locks: lock, sign: async transaction => {
    await pending.promise; transaction.partialSign(owner); return transaction;
  } }), b = harness({ locks: lock });
  try {
    await review(a); await review(b); const first = a.flow.confirm(); await waitForSignature(a);
    await b.flow.confirm(); await b.flush(); assert.deepEqual(writes(b), []); assert.equal(b.signatures.length, 0); assert.equal(b.flow.errorKey, 'walletTransfer.pending');
    pending.resolve(); await first; await a.flush(); assert.equal(a.flow.payment.status, 'submitted');
  } finally { pending.resolve(); a.unmount(); b.unmount(); }
});

test('polling aborts on logout and a read-only refresh cannot extend the fixed fifteen-minute verification window', async () => {
  for (const logout of [true, false]) {
    const timers = clock(), pending = deferred(); let signal;
    class PollDate extends Date { static now() { return timers.now; } }
    const h = harness({ Date: PollDate, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
      history: async () => ({ payments: [submitted()] }), status: async () => submitted(), write: async (action, _input, options) => {
        assert.equal(action, 'verify'); signal = options.signal; if (logout) await pending.promise; return submitted();
      } });
    try {
      await h.flush(); timers.tick(12_000); await h.flush(); assert.equal(writes(h).length, 1);
      if (logout) {
        await h.session(null); assert.equal(signal.aborted, true); pending.resolve(); await h.flush();
        assert.equal(h.flow.payment, null); assert.equal(h.flow.balanceAtomic, null);
      } else {
        h.flow.refresh(); await h.flush(); timers.tick(15 * 60_000); await h.flush(); timers.tick(12_000); await h.flush();
        assert.equal(writes(h).length, 1, 'refresh must not restart the bounded polling window');
      }
      assert.equal(h.signatures.length, 0);
    } finally { pending.resolve(); h.unmount(); }
  }
});
