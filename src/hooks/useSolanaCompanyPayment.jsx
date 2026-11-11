"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";
import { personalCompanyPaymentAmountAtomic, formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import { SOLANA_PERSONAL_WALLET, SOLANA_UUID, solanaAddress, solanaAtomic, solanaBalanceView, solanaPaymentView } from "@/lib/solana-wallet-contract.mjs";
import { readSolanaBalance, readSolanaCapabilities, readSolanaPayments, readSolanaPayment, writeSolanaPayment } from "@/lib/solana-payment-client.mjs";
import { inspectSolanaPayment, signSolanaPayment } from "@/lib/solana-payment-signing.mjs";
import { createReownFundingOperation } from "@/lib/reown-funding-operation.mjs";

const terminal = value => ["confirmed", "failed", "expired"].includes(value?.status);
const immutable = (left, right) => ["paymentId", "walletAddress", "network", "cluster", "mintAddress", "tokenDecimals", "recipientAddress",
  "sourceTokenAccount", "destinationTokenAccount", "amountAtomic", "blockhash", "lastValidBlockHeight", "messageHash", "feePayerAddress",
  "estimatedFeeLamports", "maxFeeLamports", "createdAt", "expiresAt"].every(key => left?.[key] === right?.[key])
  && (!left?.transactionSignature || left.transactionSignature === right?.transactionSignature);
const phases = new Set(["signing", "submitting", "ambiguous"]);
async function storageKey(sessionKey, wallet) {
  try {
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sessionKey)));
    return `mindbliss:solana-payment:v1:${[...hash].map(byte => byte.toString(16).padStart(2, "0")).join("")}:${wallet}`;
  } catch { return ""; }
}
function readMarker(key, wallet) {
  try {
    const raw = key && window.localStorage.getItem(key); if (!raw || raw.length > 512) return null;
    const value = JSON.parse(raw);
    return value?.version === 1 && value.walletAddress === wallet && typeof value.paymentId === "string" && SOLANA_UUID.test(value.paymentId)
      && phases.has(value.phase) && Object.keys(value).length === 4
      && Object.keys(value).every(key => ["version", "paymentId", "walletAddress", "phase"].includes(key)) ? value : null;
  } catch { return null; }
}
function persistMarker(key, value) {
  if (!key) throw new Error("solana_payment_recovery_unavailable");
  const raw = JSON.stringify(value);
  try { window.localStorage.setItem(key, raw); if (window.localStorage.getItem(key) !== raw) throw new Error(); }
  catch { throw new Error("solana_payment_recovery_unavailable"); }
}
function clearMarker(key, wallet, paymentId) {
  try { if (readMarker(key, wallet)?.paymentId === paymentId) window.localStorage.removeItem(key); } catch { /* backend recovery remains authoritative */ }
}
export function solanaCompanyPaymentErrorKey(failure) {
  if (failure?.name === "AbortError") return "";
  if (failure?.code === 4001 || failure?.code === "ACTION_REJECTED") return "walletTransfer.rejected";
  const keys = { unauthenticated: "session", wallet_connection_timeout: "session", wallet_address_mismatch: "walletMismatch",
    solana_wallet_unavailable: "walletMismatch", solana_payment_wallet_not_linked: "walletMismatch", solana_payment_wallet_changed: "walletMismatch",
    solana_payment_transaction_mismatch: "invalidAuthorization", solana_payment_expired: "expired", solana_payment_blockhash_expired: "expired",
    solana_payment_insufficient_balance: "insufficientBalance", solana_payment_balance_changed: "insufficientBalance",
    solana_payment_pending_exists: "pending", solana_payment_recovery_unavailable: "pending", solana_payment_rate_limited: "rateLimited",
    solana_payment_sponsorship_unavailable: "sponsorshipUnavailable", solana_payment_sponsorship_rejected: "sponsorshipUnavailable",
    solana_payment_budget_exceeded: "budgetUnavailable", reown_connection_timeout: "ambiguous" };
  return `walletTransfer.${keys[failure?.message] || "unavailable"}`;
}

/** Solana's owner, ATA balance and server-paid transaction remain isolated from
 * every EVM flow. The browser only partially signs; only the backend broadcasts. */
export function useSolanaCompanyPayment(solana) {
  const sessionKey = personalWalletBalanceSessionKey(useMemberSession()), wallet = solanaAddress(solana.linkedAddress) || "";
  const verified = Boolean(sessionKey) && Boolean(wallet) && solana.linkStatus === "linked";
  const connected = verified && solana.isConnected === true && solana.isLinked === true;
  const owner = useRef({ sessionKey, wallet, generation: 0 });
  if (owner.current.sessionKey !== sessionKey || owner.current.wallet !== wallet) owner.current = { sessionKey, wallet, generation: owner.current.generation + 1 };
  const generation = owner.current.generation;
  const signer = useRef({ connected, address: solana.address, provider: solana.getProvider, generation: 0 });
  if (signer.current.connected !== connected || signer.current.address !== solana.address || signer.current.provider !== solana.getProvider) {
    signer.current = { connected, address: solana.address, provider: solana.getProvider, generation: signer.current.generation + 1 };
  }
  const signerGeneration = signer.current.generation;
  const keyPromise = useMemo(() => verified ? storageKey(sessionKey, wallet) : Promise.resolve(""), [verified, sessionKey, wallet]);
  const mounted = useRef(false), operation = useRef(null), selected = useRef(null), previewRef = useRef(null), markerRef = useRef(null);
  const displayed = useRef(generation), currentDisplay = displayed.current === generation, edited = useRef(false), selection = useRef(0);
  const terminalSnapshots = useRef(new Map()), poll = useRef({ key: "", deadline: 0 }), verifier = useRef(null);
  const [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), [errorKey, setErrorKey] = useState("");
  const [amount, setAmount] = useState(""), [payment, setPayment] = useState(null), [preview, setPreview] = useState(null), [stage, setStage] = useState("form"), [recovery, setRecovery] = useState(null);
  const [balance, setBalance] = useState({ wallet: "", loading: false, balanceAtomic: null, nativeBalanceAtomic: null, sourceTokenAccount: "", error: "" });
  const [history, setHistory] = useState({ wallet: "", loading: false, payments: [], error: "" });
  const [capabilities, setCapabilities] = useState({ loading: true, transferEnabled: false, error: "" });
  const live = useCallback(() => mounted.current && owner.current.generation === generation && Boolean(sessionKey), [generation, sessionKey]);
  const adopt = useCallback((raw, key) => {
    const safe = solanaPaymentView(raw);
    if (!safe || safe.walletAddress !== wallet || (selected.current?.paymentId === safe.paymentId && !immutable(selected.current, safe))) throw new Error("solana_payment_transaction_mismatch");
    if (selected.current?.paymentId === safe.paymentId && terminal(selected.current)) return selected.current;
    if (live()) {
      selected.current = safe; setPayment(safe); setStage("status");
      if (terminal(safe)) {
        clearMarker(key, wallet, safe.paymentId); const marker = readMarker(key, wallet); markerRef.current = marker; setRecovery(marker); setErrorKey("");
        const notification = `${generation}:${safe.paymentId}`;
        if (!terminalSnapshots.current.has(notification)) {
          terminalSnapshots.current.set(notification, safe); if (terminalSnapshots.current.size > 64) terminalSnapshots.current.delete(terminalSnapshots.current.keys().next().value);
          try { window.dispatchEvent(new Event("vp:personal-solana-wallet-balance-changed")); } catch { /* receipt state does not depend on browser events */ }
        }
      }
    }
    return safe;
  }, [wallet, live, generation]);
  const mark = (key, value, phase) => {
    const next = { version: 1, paymentId: value.paymentId, walletAddress: wallet, phase };
    persistMarker(key, next); if (live()) { markerRef.current = next; setRecovery(next); } return next;
  };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; operation.current?.scope.cancel(); }; }, []);
  useEffect(() => {
    displayed.current = generation; operation.current?.scope.cancel(); operation.current = null;
    selected.current = null; previewRef.current = null; markerRef.current = null; edited.current = false;
    setPayment(null); setPreview(null); setRecovery(null); setAmount(""); setStage("form"); setBusy(false); setErrorKey("");
    setBalance({ wallet, loading: false, balanceAtomic: null, nativeBalanceAtomic: null, sourceTokenAccount: "", error: "" });
    setHistory({ wallet, loading: false, payments: [], error: "" });
  }, [wallet, generation]);
  useEffect(() => { if (operation.current?.signing) operation.current.scope.cancel(); }, [signerGeneration]);
  useEffect(() => {
    if (!verified) { setCapabilities({ loading: false, transferEnabled: false, error: "" }); return undefined; }
    const controller = new AbortController(); setCapabilities(current => ({ ...current, loading: true, error: "" }));
    readSolanaCapabilities({ signal: controller.signal }).then(value => { if (live() && !controller.signal.aborted) setCapabilities({ ...value, loading: false, error: "" }); })
      .catch(failure => { if (live() && !controller.signal.aborted) setCapabilities({ loading: false, transferEnabled: false, error: solanaCompanyPaymentErrorKey(failure) }); });
    return () => controller.abort();
  }, [verified, live, revision]);
  useEffect(() => {
    if (!verified) return undefined;
    const controller = new AbortController(); setBalance(current => ({ ...current, wallet, loading: true, error: "" }));
    readSolanaBalance({ signal: controller.signal }).then(raw => {
      const safe = solanaBalanceView(raw); if (!safe || safe.walletAddress !== wallet) throw new Error("solana_payment_wallet_changed");
      if (live() && !controller.signal.aborted) {
        setBalance({ wallet, loading: false, balanceAtomic: safe.balanceAtomic, nativeBalanceAtomic: safe.nativeBalanceAtomic, sourceTokenAccount: safe.sourceTokenAccount, error: "" });
        if (!edited.current && !selected.current && !previewRef.current) setAmount(safe.balanceAtomic === "0" ? "" : formatPersonalCompanyPaymentAmount(safe.balanceAtomic));
      }
    }).catch(failure => { if (live() && !controller.signal.aborted) setBalance({ wallet, loading: false, balanceAtomic: null, nativeBalanceAtomic: null, sourceTokenAccount: "", error: solanaCompanyPaymentErrorKey(failure) }); });
    return () => controller.abort();
  }, [verified, wallet, live, revision]);
  useEffect(() => {
    if (!verified) return undefined;
    const controller = new AbortController(); setHistory(current => ({ ...current, wallet, loading: true, error: "" }));
    Promise.all([readSolanaPayments({ signal: controller.signal }), keyPromise]).then(async ([result, key]) => {
      if (!live() || controller.signal.aborted) return;
      const payments = result.payments.map(raw => {
        const item = solanaPaymentView(raw); if (!item || item.walletAddress !== wallet) throw new Error("solana_payment_wallet_changed");
        const known = terminalSnapshots.current.get(`${generation}:${item.paymentId}`);
        if (known && !immutable(item, known)) throw new Error("solana_payment_transaction_mismatch");
        return known || item;
      });
      setHistory({ wallet, loading: false, payments, error: "" });
      const marker = readMarker(key, wallet); markerRef.current = marker; setRecovery(marker);
      const current = selected.current, latest = current && payments.find(item => item.paymentId === current.paymentId);
      if (latest) { adopt(latest, key); if (!terminal(current) && terminal(latest)) setRevision(number => number + 1); }
      else if (!current && !previewRef.current) {
        const pending = payments.find(item => item.paymentId === marker?.paymentId) || (!marker && payments.find(item => !terminal(item)));
        if (pending) adopt(pending, key);
        else if (marker) { const restored = await readSolanaPayment(marker.paymentId, { signal: controller.signal }); if (live() && !controller.signal.aborted) adopt(restored, key); }
      }
    }).catch(failure => { if (live() && !controller.signal.aborted) setHistory({ wallet, loading: false, payments: [], error: solanaCompanyPaymentErrorKey(failure) }); });
    return () => controller.abort();
  }, [verified, wallet, live, adopt, keyPromise, revision, generation]);
  const begin = () => {
    if (!currentDisplay || !live() || operation.current) return null;
    const next = { scope: createReownFundingOperation(), signing: false }; operation.current = next; setBusy(true); setErrorKey(""); return next;
  };
  const active = value => { value.scope.assertActive(); if (!live() || operation.current !== value) throw new DOMException("Aborted", "AbortError"); };
  const finish = value => { value.scope.finish(); if (operation.current === value) { operation.current = null; if (live()) setBusy(false); } };
  async function enabled(value) {
    const result = await value.scope.wait(() => readSolanaCapabilities({ signal: value.scope.signal })); active(value);
    setCapabilities({ ...result, loading: false, error: "" }); if (!result.transferEnabled) throw new Error("solana_payment_sponsorship_unavailable");
  }
  async function review() {
    const atomic = solanaAtomic(personalCompanyPaymentAmountAtomic(amount), false);
    if (!connected || !atomic || balance.wallet !== wallet || balance.balanceAtomic === null || BigInt(atomic) > BigInt(balance.balanceAtomic)) return;
    if (selected.current && !terminal(selected.current)) { setStage("status"); setErrorKey("walletTransfer.pending"); return; }
    const value = begin(); if (!value) return;
    try {
      await enabled(value); const key = await value.scope.wait(() => keyPromise); active(value);
      if (readMarker(key, wallet)) throw new Error("solana_payment_pending_exists");
      const provider = solana.getProvider();
      if (provider?.publicKey?.toBase58() !== wallet) throw new Error("solana_payment_wallet_changed");
      const next = { requestId: crypto.randomUUID(), walletAddress: wallet, amountAtomic: atomic, reviewedBalanceAtomic: balance.balanceAtomic,
        sourceTokenAccount: balance.sourceTokenAccount, ...SOLANA_PERSONAL_WALLET };
      previewRef.current = next; setPreview(next); setStage("review");
    } catch (failure) { if (live()) setErrorKey(solanaCompanyPaymentErrorKey(failure)); } finally { finish(value); }
  }
  async function confirm() {
    const local = previewRef.current;
    if (!connected || !local || operation.current || (selected.current && (selected.current.status !== "prepared" || selected.current.paymentId !== local.requestId))) return;
    const value = begin(); if (!value) return; value.signing = true;
    let key = "", prepared = /** @type {ReturnType<typeof solanaPaymentView>} */ (null), prompt = false, submitting = false;
    try {
      const captured = signerGeneration, provider = solana.getProvider();
      const assertSigner = () => {
        active(value); if (signer.current.generation !== captured || !signer.current.connected || solana.getProvider() !== provider
          || provider?.publicKey?.toBase58() !== wallet
          || (selected.current?.paymentId === local.requestId && terminal(selected.current))) throw new DOMException("Aborted", "AbortError");
      };
      await enabled(value); key = await value.scope.wait(() => keyPromise); assertSigner();
      if (!key) throw new Error("solana_payment_recovery_unavailable");
      const funds = solanaBalanceView(await value.scope.wait(() => readSolanaBalance({ signal: value.scope.signal }))); assertSigner();
      if (!funds || funds.walletAddress !== wallet || funds.sourceTokenAccount !== local.sourceTokenAccount) throw new Error("solana_payment_wallet_changed");
      setBalance({ wallet, loading: false, balanceAtomic: funds.balanceAtomic, nativeBalanceAtomic: funds.nativeBalanceAtomic, sourceTokenAccount: funds.sourceTokenAccount, error: "" });
      if (funds.balanceAtomic !== local.reviewedBalanceAtomic || BigInt(local.amountAtomic) > BigInt(funds.balanceAtomic)) throw new Error("solana_payment_balance_changed");
      const locks = globalThis.navigator?.locks; if (!locks?.request) throw new Error("solana_payment_recovery_unavailable");
      await locks.request(`mindbliss:solana-payment:${wallet}`, { mode: "exclusive", ifAvailable: true }, async lock => {
        assertSigner(); if (!lock || readMarker(key, wallet)) throw new Error("solana_payment_pending_exists");
        prepared = await value.scope.wait(() => writeSolanaPayment("prepare", { requestId: local.requestId, amountAtomic: local.amountAtomic }, { signal: value.scope.signal })); assertSigner();
        if (!solanaPaymentView(prepared) || prepared.walletAddress !== wallet || prepared.amountAtomic !== local.amountAtomic || prepared.sourceTokenAccount !== local.sourceTokenAccount) throw new Error("solana_payment_transaction_mismatch");
        const latest = await value.scope.wait(() => readSolanaPayment(prepared.paymentId, { signal: value.scope.signal })); assertSigner();
        if (!immutable(prepared, latest)) throw new Error("solana_payment_transaction_mismatch");
        const adopted = adopt(latest, key); if (adopted.status !== "prepared") return;
        // Status may omit public unsigned bytes. Its immutable message digest
        // must still match the durable prepare ACK before using those bytes.
        const intent = { ...latest, transactionBase64: latest.transactionBase64 ?? prepared.transactionBase64 };
        await value.scope.wait(() => inspectSolanaPayment(intent, wallet)); assertSigner();
        const signed = await value.scope.wait(() => signSolanaPayment(intent, { publicKey: provider.publicKey, signTransaction(transaction) {
          assertSigner(); if (prompt) throw new Error("solana_payment_transaction_mismatch"); mark(key, latest, "signing"); prompt = true;
          return provider.signTransaction(transaction);
        } }, wallet, assertSigner)); assertSigner();
        if (signed.paymentId !== latest.paymentId) throw new Error("solana_payment_transaction_mismatch");
        mark(key, latest, "submitting"); submitting = true;
        const sent = await value.scope.wait(() => writeSolanaPayment("submit", signed, { signal: value.scope.signal })); active(value);
        if (!immutable(latest, sent)) throw new Error("solana_payment_transaction_mismatch");
        adopt(sent, key); if (terminal(sent)) setRevision(number => number + 1);
      });
    } catch (failure) {
      if (prepared && selected.current?.paymentId === prepared.paymentId && terminal(selected.current) && immutable(prepared, selected.current)) {
        clearMarker(key, wallet, prepared.paymentId);
      } else if (prepared && prompt && !submitting && (failure?.code === 4001 || failure?.code === "ACTION_REJECTED")) {
        clearMarker(key, wallet, prepared.paymentId); if (live()) { markerRef.current = null; setRecovery(null); setStage("review"); }
      } else if (prepared && (prompt || submitting)) {
        try { mark(key, prepared, "ambiguous"); } catch { /* keep the last durable marker */ }
        if (live()) setStage("status");
      }
      if (live() && !terminal(selected.current)) setErrorKey(prepared && (prompt || submitting) && failure?.code !== 4001 && failure?.code !== "ACTION_REJECTED"
        && failure?.name !== "AbortError" ? "walletTransfer.ambiguous" : solanaCompanyPaymentErrorKey(failure));
    } finally { finish(value); }
  }
  /** @param {{signal?: AbortSignal}} [options] */
  async function verifyPayment({ signal } = {}) {
    const current = selected.current; if (!verified || !current || signal?.aborted) return;
    const value = begin(); if (!value) return;
    const abort = () => value.scope.cancel(); signal?.addEventListener("abort", abort, { once: true });
    try {
      const key = await value.scope.wait(() => keyPromise);
      let result = await value.scope.wait(() => readSolanaPayment(current.paymentId, { signal: value.scope.signal })); active(value);
      if (!immutable(current, result)) throw new Error("solana_payment_transaction_mismatch");
      if (!terminal(result)) {
        result = await value.scope.wait(() => writeSolanaPayment("verify", { paymentId: current.paymentId }, { signal: value.scope.signal })); active(value);
        if (!immutable(current, result)) throw new Error("solana_payment_transaction_mismatch");
      }
      adopt(result, key); if (terminal(result)) setRevision(number => number + 1);
    } catch (failure) { if (live() && !value.scope.signal.aborted) setErrorKey(solanaCompanyPaymentErrorKey(failure)); }
    finally { signal?.removeEventListener("abort", abort); finish(value); }
  }
  verifier.current = verifyPayment;
  useEffect(() => {
    if (!verified || !payment || terminal(payment) || (!recovery && !["broadcasting", "ambiguous", "submitted"].includes(payment.status)) || typeof document === "undefined") return undefined;
    const key = `${generation}:${wallet}:${payment.paymentId}`; if (poll.current.key !== key) poll.current = { key, deadline: Date.now() + 15 * 60_000 };
    let stopped = false, timer, request;
    const eligible = () => !stopped && live() && selected.current?.paymentId === payment.paymentId && !terminal(selected.current) && Date.now() < poll.current.deadline;
    const schedule = () => { clearTimeout(timer); if (eligible() && document.visibilityState === "visible") { timer = setTimeout(check, Math.min(12_000, poll.current.deadline - Date.now())); timer?.unref?.(); } };
    const check = async () => {
      if (!eligible() || document.visibilityState !== "visible") return;
      if (operation.current) { schedule(); return; }
      request = new AbortController(); try { await verifier.current({ signal: request.signal }); } finally { request = null; schedule(); }
    };
    const visibility = () => { if (document.visibilityState === "visible") schedule(); else { clearTimeout(timer); request?.abort(); } };
    document.addEventListener("visibilitychange", visibility); schedule();
    return () => { stopped = true; clearTimeout(timer); request?.abort(); document.removeEventListener("visibilitychange", visibility); };
  }, [verified, generation, wallet, live, payment?.paymentId, payment?.status, recovery?.phase]);
  async function connect() {
    const value = begin(); if (!value) return;
    try {
      if (!solana.isConnected || (!solana.isLinked && solana.linkStatus === "linked")) await value.scope.wait(() => solana.connectWallet());
      else if (!solana.isLinked && solana.linkStatus === "unlinked") await value.scope.wait(() => solana.linkWallet()); active(value);
    } catch (failure) { if (live()) setErrorKey(solanaCompanyPaymentErrorKey(failure)); } finally { finish(value); }
  }
  async function resume() {
    const current = selected.current;
    if (!connected || current?.status !== "prepared" || operation.current || balance.balanceAtomic === null) return;
    const value = begin(); if (!value) return;
    try {
      const key = await value.scope.wait(() => keyPromise); active(value);
      if (readMarker(key, wallet)) throw new Error("solana_payment_pending_exists");
      if (Date.parse(current.expiresAt) <= Date.now()) throw new Error("solana_payment_expired");
      if (current.sourceTokenAccount !== balance.sourceTokenAccount || BigInt(current.amountAtomic) > BigInt(balance.balanceAtomic)) throw new Error("solana_payment_balance_changed");
      const next = { requestId: current.paymentId, walletAddress: wallet, amountAtomic: current.amountAtomic,
        sourceTokenAccount: current.sourceTokenAccount, reviewedBalanceAtomic: balance.balanceAtomic, ...SOLANA_PERSONAL_WALLET };
      previewRef.current = next; setPreview(next); setAmount(formatPersonalCompanyPaymentAmount(current.amountAtomic)); setStage("review");
    } catch (failure) { if (live()) setErrorKey(solanaCompanyPaymentErrorKey(failure)); } finally { finish(value); }
  }
  function newPayment() {
    if (!live() || operation.current || (selected.current && !terminal(selected.current)) || markerRef.current) return;
    selected.current = null; previewRef.current = null; setPayment(null); setPreview(null); setStage("form"); setRecovery(null); setErrorKey(""); edited.current = false; setAmount(""); setRevision(number => number + 1);
  }
  return { wallet, verified, connected: currentDisplay && connected, restoring: currentDisplay && solana.isRestoring === true,
    needsVerification: currentDisplay && Boolean(sessionKey) && solana.isConnected === true && solana.linkStatus === "unlinked", busy: currentDisplay && busy,
    amount: currentDisplay ? amount : "", setAmount(value) { if (live() && !operation.current) { edited.current = true; setAmount(value); setErrorKey(""); } },
    balanceAtomic: currentDisplay && balance.wallet === wallet ? balance.balanceAtomic : null, nativeBalanceAtomic: currentDisplay && balance.wallet === wallet ? balance.nativeBalanceAtomic : null,
    loadingBalance: !currentDisplay || balance.loading, capabilities: currentDisplay ? capabilities : { loading: true, transferEnabled: false },
    transferEnabled: currentDisplay && capabilities.transferEnabled, errorKey: currentDisplay ? errorKey || balance.error || history.error || capabilities.error : "",
    preview: currentDisplay ? preview : null, stage: currentDisplay ? stage : "form", payment: currentDisplay ? payment : null, recovery: currentDisplay ? recovery : null,
    history: currentDisplay && history.wallet === wallet ? history.payments : [], historyLoading: !currentDisplay || history.loading,
    review, confirm, verifyPayment, connect, resume, newPayment,
    refresh() { if (live() && !operation.current) setRevision(number => number + 1); },
    cancelReview() {
      if (!live() || operation.current || markerRef.current) return;
      previewRef.current = null; setPreview(null);
      if (selected.current && !terminal(selected.current)) { setStage("status"); setErrorKey("walletTransfer.pending"); }
      else { setStage("form"); setErrorKey(""); }
    },
    selectHistory(raw) {
      const safe = solanaPaymentView(raw); if (!live() || operation.current || !safe || safe.walletAddress !== wallet) return;
      if ((selected.current && selected.current.paymentId !== safe.paymentId && !terminal(selected.current))
        || (markerRef.current && markerRef.current.paymentId !== safe.paymentId)) { setErrorKey("walletTransfer.pending"); return; }
      const choice = ++selection.current;
      void keyPromise.then(key => { if (live() && !operation.current && selection.current === choice) { adopt(safe, key); previewRef.current = null; setPreview(null); } })
        .catch(failure => { if (live() && selection.current === choice) setErrorKey(solanaCompanyPaymentErrorKey(failure)); });
    },
  };
}
