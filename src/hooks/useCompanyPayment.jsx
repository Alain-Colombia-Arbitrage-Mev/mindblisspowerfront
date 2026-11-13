"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { companyPaymentView } from "@/lib/company-payment-contract.mjs";
import { readCompanyPaymentHistory, recordCompanyPaymentEvent, writeCompanyPayment } from "@/lib/company-payment-client.mjs";
import { clearCompanyRecovery, readCompanyRecovery, saveCompanyRecovery } from "@/lib/company-payment-recovery.mjs";
import { createPersonalCompanyPaymentTransfer, readPersonalCompanyPaymentBalance } from "@/lib/personal-company-payment.mjs";
import { personalCompanyPaymentPolicy, personalCompanyPaymentAmountAtomic, formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import { readPersonalWalletBalances } from "@/lib/personal-wallet-balance.mjs";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";

export function companyPaymentErrorKey(failure) {
  const code = failure?.message || "";
  if (failure?.name === "AbortError") return "";
  const keys = {
    personal_company_insufficient_eth: "zeroGas", personal_company_insufficient_pol: "polygonZeroGas", personal_company_balance_changed: "balanceChanged", personal_company_rejected: "rejected",
    wallet_connection_timeout: "connectionTimeout", wallet_address_mismatch: "walletMismatch",
    personal_company_wallet_changed: "walletMismatch", personal_company_wallet_unavailable: "walletMismatch", personal_company_chain_changed: "switchNetwork",
    personal_company_intent_expired: "expired", personal_company_recovery_unavailable: "recoveryUnavailable",
    personal_company_intent_abandoned: "abandonedCopy",
    personal_company_broadcast_ambiguous: "ambiguousCopy", personal_company_previous_payment_unresolved: "ambiguousCopy",
    personal_company_insufficient_usdt: "insufficientBalance", company_payment_insufficient_balance: "insufficientBalance",
    company_payment_pending_exists: "pendingExists", company_payment_unconfigured: "serviceUnavailable", company_payment_forbidden: "walletMismatch",
    company_payment_wallet_not_linked: "walletMismatch", unauthenticated: "connectCopy", company_payment_transaction_pending: "pendingCopy",
    company_payment_transaction_mismatch: "paymentFailed", company_payment_hash_reused: "paymentFailed",
    company_payment_network_retired: "networkUnavailable",
    company_payment_network_changed: "networkChanged",
  };
  return `companyPayment.${keys[code] || "networkUnavailable"}`;
}

/** UUIDv5 is only an idempotency key; it never authorizes or confirms a payment. */
export async function companyPaymentAuditEventId(input) {
  const namespace = "6ba7b8119dad11d180b400c04fd430c8".match(/../g).map(byte => Number.parseInt(byte, 16));
  const name = new TextEncoder().encode(JSON.stringify(["mindbliss/company-payment/events/v1", input.paymentId,
    input.attemptId || null, input.event, input.transactionHash || null, input.code || null]));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", new Uint8Array([...namespace, ...name]))).slice(0, 16);
  digest[6] = (digest[6] & 0x0f) | 0x50; digest[8] = (digest[8] & 0x3f) | 0x80;
  const value = [...digest].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function auditCode(failure, fallback = "unknown") {
  const code = failure?.message || failure?.errorCode || "";
  if (code === "personal_company_rejected") return "user_rejected";
  if (["personal_company_wallet_changed", "personal_company_wallet_unavailable", "wallet_address_mismatch"].includes(code)) return "wallet_changed";
  if (code === "personal_company_chain_changed") return "network_changed";
  if (code === "personal_company_recovery_unavailable") return "recovery_unavailable";
  if (["personal_company_rpc_unavailable", "company_payment_rpc_unavailable", "personal_company_gas_unavailable"].includes(code)) return "rpc_unavailable";
  return fallback;
}
const terminal = value => ["confirmed", "failed"].includes(value?.status);
const samePayment = (left, right) => ["paymentId", "walletAddress", "chainId", "tokenAddress", "tokenDecimals", "recipientAddress", "amountAtomic"]
  .every(key => left?.[key] === right?.[key]) && (!left?.transactionHash || !right?.transactionHash || left.transactionHash === right.transactionHash);

/** Signature requests happen only in confirm(), never in an effect or a retry. */
export function useCompanyPayment(reown) {
  const sessionKey = personalWalletBalanceSessionKey(useMemberSession());
  const wallet = typeof reown.linkedAddress === "string" ? reown.linkedAddress.toLowerCase() : "";
  const verified = Boolean(sessionKey) && reown.linkStatus === "linked" && /^0x[0-9a-f]{40}$/.test(wallet);
  const connected = verified && reown.isConnected && reown.isLinked;
  const mounted = useRef(false), owner = useRef(wallet), inflight = useRef(null), controller = useRef(null), selected = useRef(null);
  const epoch = useRef({ wallet, sessionKey, version: 0 });
  if (epoch.current.wallet !== wallet || epoch.current.sessionKey !== sessionKey) epoch.current = { wallet, sessionKey, version: epoch.current.version + 1 };
  const generation = epoch.current.version;
  const displayedGeneration = useRef(generation);
  const currentDisplay = displayedGeneration.current === generation;
  const registrations = useRef(new Map());
  const auditRequests = useRef(new Map());
  const persisted = useRef(false);
  const amountEdited = useRef(false);
  owner.current = wallet;
  const [chainId, setChainId] = useState(1);
  const activeChain = useRef(chainId);
  activeChain.current = chainId;
  const [amount, setAmount] = useState("");
  const [balances, setBalance] = useState({ wallet: "", loading: false, records: [], error: "" });
  const selectedBalance = balances.records.find(record => record.chainId === chainId);
  const balance = { ...balances, balanceAtomic: selectedBalance?.balanceAtomic ?? null,
    error: selectedBalance?.error ? companyPaymentErrorKey({ message: selectedBalance.error }) : balances.error };
  const [history, setHistory] = useState({ wallet: "", loading: true, records: [], error: "" });
  const [payment, setPayment] = useState(null), [stage, setStage] = useState("form"), [transfer, setTransfer] = useState(null);
  const [busy, setBusy] = useState(false), [errorKey, setErrorKey] = useState(""), [revision, setRevision] = useState(0);
  const [recovery, setRecovery] = useState(null), [manualHash, setManualHash] = useState("");
  const busySnapshot = useRef(busy), verifyCurrent = useRef(null), polling = useRef({ key: "", deadline: 0 });
  const terminalNotifications = useRef(new Set());
  busySnapshot.current = busy;
  const live = useCallback(address => mounted.current && owner.current === address && epoch.current.version === generation, [generation]);
  const select = useCallback((value, nextStage = "status", registered = true) => {
    if (value && personalCompanyPaymentPolicy(value.chainId)) { activeChain.current = value.chainId; setChainId(value.chainId); }
    selected.current = value; persisted.current = registered; setPayment(value); setStage(nextStage);
  }, []);
  const audit = useCallback((value, event, details = /** @type {any} */ ({})) => {
    if (!verified || value?.walletAddress !== wallet || epoch.current.version !== generation) return;
    const input = { paymentId: value.paymentId, event,
      ...(details.attemptId ? { attemptId: details.attemptId } : {}),
      ...(details.transactionHash ? { transactionHash: details.transactionHash } : {}),
      ...(details.code ? { code: details.code } : {}) };
    const key = `${generation}:${JSON.stringify(input)}`;
    if (auditRequests.current.has(key)) return;
    // This journal supplements canonical prepare/submit/receipt records. A log
    // outage must never queue another signature or interrupt hash recovery.
    const operation = Promise.resolve().then(async () => {
      const eventId = await companyPaymentAuditEventId(input);
      if (epoch.current.version !== generation) return;
      await recordCompanyPaymentEvent({ ...input, eventId }, { isActive: () => epoch.current.version === generation });
    }).catch(() => { if (auditRequests.current.get(key) === operation) auditRequests.current.delete(key); });
    auditRequests.current.set(key, operation);
    if (auditRequests.current.size > 128) auditRequests.current.delete(auditRequests.current.keys().next().value);
  }, [verified, wallet, generation]);
  const finishTerminal = useCallback(value => {
    if (!terminal(value) || !live(wallet) || value.walletAddress !== wallet || selected.current?.paymentId !== value.paymentId) return;
    const notification = `${generation}:${value.paymentId}`;
    if (!terminalNotifications.current.has(notification)) {
      terminalNotifications.current.add(notification);
      if (terminalNotifications.current.size > 64) terminalNotifications.current.delete(terminalNotifications.current.values().next().value);
      try { window.dispatchEvent(new Event("vp:personal-wallet-balance-changed")); } catch { /* receipt state does not depend on browser events */ }
    }
    const marker = readCompanyRecovery(window.localStorage, wallet, value.paymentId);
    if (marker?.transactionHash && marker.transactionHash !== value.transactionHash) {
      setRecovery(marker); setErrorKey("companyPayment.paymentFailed"); setStage("status"); return;
    }
    clearCompanyRecovery(window.localStorage, wallet, value.paymentId);
    setRecovery(current => current?.paymentId === value.paymentId ? null : current);
    setTransfer(current => current?.paymentId === value.paymentId ? null : current);
    setManualHash(""); setErrorKey(""); setStage("status");
  }, [live, wallet, generation]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => {
    displayedGeneration.current = generation;
    selected.current = null; persisted.current = false; setPayment(null); setRecovery(null); setTransfer(null); setStage("form"); setAmount(""); setManualHash(""); setErrorKey("");
    setBalance({ wallet, loading: false, records: [], error: "" });
    activeChain.current = 1; setChainId(1);
    setHistory({ wallet, loading: false, records: [], error: "" });
    amountEdited.current = false;
    controller.current?.abort();
    inflight.current = null; setBusy(false);
  }, [wallet, sessionKey, generation]);

  const refreshHistory = useCallback(async (signal = undefined) => {
    if (!verified) { setHistory({ wallet, loading: false, records: [], error: "" }); return; }
    setHistory(current => ({ ...current, wallet, loading: true, error: "" }));
    try {
      const result = await readCompanyPaymentHistory({ signal });
      if (!live(wallet) || signal?.aborted) return;
      if (result.records.some(record => record.walletAddress !== wallet)) throw new Error("personal_company_wallet_changed");
      const current = selected.current;
      const latest = current && result.records.find(record => record.paymentId === current.paymentId);
      if (latest && !samePayment(current, latest)) throw new Error("company_payment_transaction_mismatch");
      setHistory({ wallet, loading: false, records: result.records, error: "" });
      if (latest && (terminal(current) || terminal(latest))) {
        const accepted = terminal(current) ? current : latest;
        select(accepted); finishTerminal(accepted);
        if (!terminal(current)) setRevision(number => number + 1);
      }
      const pending = result.records.find(record => record.status === "submitted" || (record.status === "prepared" && ((!record.abandonedAt && Date.parse(record.expiresAt) > Date.now()) || readCompanyRecovery(window.localStorage, record.walletAddress, record.paymentId))));
      if (!selected.current && pending) {
        const marker = readCompanyRecovery(window.localStorage, pending.walletAddress, pending.paymentId);
        select(pending); setRecovery(marker);
        if (marker) audit(pending, "recovery_detected", { attemptId: marker.attemptId, transactionHash: marker.transactionHash });
      }
    } catch (failure) {
      if (live(wallet) && !signal?.aborted) setHistory({ wallet, loading: false, records: [], error: companyPaymentErrorKey(failure) });
    }
  }, [verified, wallet, live, select, audit, finishTerminal]);

  useEffect(() => {
    const request = new AbortController();
    void refreshHistory(request.signal);
    return () => request.abort();
  }, [refreshHistory, revision]);

  useEffect(() => {
    if (!verified) { setBalance({ wallet, loading: false, records: [], error: "" }); return undefined; }
    const request = new AbortController();
    setBalance({ wallet, loading: true, records: [], error: "" });
    Promise.resolve().then(() => readPersonalWalletBalances({ signal: request.signal }).then(value => {
        if (value.walletAddress !== wallet) throw new Error("personal_company_wallet_changed");
        return value;
      }))
      .then(result => { if (live(wallet) && !request.signal.aborted) {
        setBalance({ wallet, loading: false, records: result.balances, error: "" });
        const currentBalance = result.balances.find(record => record.chainId === activeChain.current);
        if (!amountEdited.current && !selected.current && currentBalance && !currentBalance.error && currentBalance.balanceAtomic !== null && BigInt(currentBalance.balanceAtomic) > 0n) {
          setAmount(current => current === "" ? formatPersonalCompanyPaymentAmount(currentBalance.balanceAtomic) : current);
        }
      } })
      .catch(failure => { if (live(wallet) && !request.signal.aborted) setBalance({ wallet, loading: false, records: [], error: companyPaymentErrorKey(failure) }); });
    return () => request.abort();
  }, [verified, wallet, live, revision]);

  useEffect(() => {
    if (!verified || busy || typeof window === "undefined" || typeof document === "undefined") return undefined;
    let timer;
    const returned = () => {
      clearTimeout(timer);
      if (document.visibilityState !== "visible" || inflight.current || !live(wallet)) return;
      timer = setTimeout(() => {
        if (document.visibilityState === "visible" && !inflight.current && live(wallet)) setRevision(number => number + 1);
      }, 250);
    };
    window.addEventListener("focus", returned);
    window.addEventListener("pageshow", returned);
    document.addEventListener("visibilitychange", returned);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", returned);
      window.removeEventListener("pageshow", returned);
      document.removeEventListener("visibilitychange", returned);
    };
  }, [verified, wallet, live, busy]);

  const save = useCallback(value => {
    const safe = companyPaymentView(value);
    if (!safe) throw new Error("company_payment_unavailable");
    const current = selected.current;
    if (current?.paymentId === safe.paymentId && !samePayment(current, safe)) throw new Error("company_payment_unavailable");
    if (current && current.paymentId === safe.paymentId && terminal(current)) { finishTerminal(current); return current; }
    if (current?.paymentId === safe.paymentId && current.transactionHash && !safe.transactionHash) return current;
    if (live(wallet) && (!current || current.paymentId === safe.paymentId)) {
      select(safe, safe.status === "prepared" && !safe.abandonedAt ? "review" : "status"); finishTerminal(safe);
    }
    return safe;
  }, [live, wallet, select, finishTerminal]);

  function registerHash(value, hash) {
    const key = `${value.paymentId}:${hash}`;
    if (registrations.current.has(key)) return registrations.current.get(key);
    const marker = readCompanyRecovery(window.localStorage, value.walletAddress, value.paymentId);
    const operation = (async () => {
      let saved = await writeCompanyPayment("submit", { paymentId: value.paymentId, transactionHash: hash });
      if (saved.walletAddress !== value.walletAddress || saved.amountAtomic !== value.amountAtomic || saved.chainId !== value.chainId || saved.tokenAddress !== value.tokenAddress) throw new Error("company_payment_unavailable");
      const current = selected.current;
      if (current?.paymentId === saved.paymentId && terminal(current)) {
        if (current.transactionHash !== hash) throw new Error("company_payment_transaction_mismatch");
        saved = current;
      }
      if (["confirmed", "failed"].includes(saved.status)) clearCompanyRecovery(window.localStorage, saved.walletAddress, saved.paymentId);
      else saveCompanyRecovery(window.localStorage, { version: 1, paymentId: saved.paymentId, walletAddress: saved.walletAddress,
        chainId: saved.chainId, amountAtomic: saved.amountAtomic, phase: "submitted", transactionHash: hash,
        ...(marker?.attemptId ? { attemptId: marker.attemptId } : {}) });
      if (live(wallet) && (!current || current.paymentId === saved.paymentId)) { save(saved); setRecovery(readCompanyRecovery(window.localStorage, saved.walletAddress, saved.paymentId)); setErrorKey(""); }
      return saved;
    })().catch(failure => {
      audit(value, "registration_failed", { attemptId: marker?.attemptId, transactionHash: hash, code: "registration_unavailable" });
      throw failure;
    }).finally(() => { if (registrations.current.get(key) === operation) registrations.current.delete(key); });
    registrations.current.set(key, operation);
    return operation;
  }

  async function review() {
    const policy = personalCompanyPaymentPolicy(chainId);
    const atomic = personalCompanyPaymentAmountAtomic(amount);
    if (!currentDisplay || !live(wallet) || activeChain.current !== chainId || !policy || inflight.current || !connected || !atomic || balance.wallet !== wallet || balance.balanceAtomic === null || BigInt(atomic) > BigInt(balance.balanceAtomic)) return;
    if (persisted.current && selected.current && selected.current.status === "prepared"
      && (selected.current.chainId !== chainId || selected.current.amountAtomic !== atomic)) { setErrorKey("companyPayment.pendingExists"); setStage("status"); return; }
    const operation = {}; inflight.current = operation; setBusy(true); setErrorKey("");
    const request = new AbortController(); controller.current = request;
    const previous = selected.current;
    try {
      // Reviewing proves that the live SDK can read this exact account/network.
      // It never prepares a backend payment, requests a signature or sends funds.
      const result = await readPersonalCompanyPaymentBalance({ walletProvider: reown.getCompanyPaymentProvider(), walletAddress: wallet,
        chainId, signal: request.signal, readTimeoutMs: 10_000 });
      if (request.signal.aborted || inflight.current !== operation || !live(wallet) || activeChain.current !== chainId || selected.current !== previous) return;
      if (result.balanceAtomic !== balance.balanceAtomic) {
        setBalance(current => current.wallet !== wallet ? current : { ...current, records: current.records.map(record => record.chainId === chainId
          ? { ...record, balanceAtomic: result.balanceAtomic, error: undefined } : record) });
        throw new Error("personal_company_balance_changed");
      }
      // The preview is local and editable. Persist only after explicit Confirm.
      const value = persisted.current ? selected.current : { paymentId: crypto.randomUUID(), walletKind: "personal", walletAddress: wallet,
        ...policy, amountAtomic: atomic, status: "prepared", createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), transactionHash: null, blockNumber: null, blockHash: null,
        confirmations: 0, requiredConfirmations: 12, failureReason: null, abandonedAt: null, membershipAssignment: "pending" };
      select(value, "review", persisted.current);
    } catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
    finally {
      if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); }
      if (controller.current === request) controller.current = null;
    }
  }

  async function confirm() {
    const preview = selected.current;
    if (!currentDisplay || !live(wallet) || activeChain.current !== chainId || inflight.current || !connected || !preview || !personalCompanyPaymentPolicy(chainId) || preview.chainId !== chainId || preview.status !== "prepared" || preview.abandonedAt || preview.walletAddress !== wallet || balance.balanceAtomic === null) return;
    const stored = readCompanyRecovery(window.localStorage, wallet, preview.paymentId);
    if (stored) {
      if (persisted.current) audit(preview, "recovery_detected", { attemptId: stored.attemptId, transactionHash: stored.transactionHash });
      setRecovery(stored); setStage("status"); setErrorKey("companyPayment.ambiguousCopy"); return;
    }
    const operation = {}; inflight.current = operation; setBusy(true); setErrorKey("");
    const request = new AbortController(); controller.current = request;
    let auditPayment = null, attemptId;
    try {
      // Display reads do not need AppKit. Signing still verifies its live
      // account, network and exact token balance before preparing any payment.
      const liveBalance = await readPersonalCompanyPaymentBalance({ walletProvider: reown.getCompanyPaymentProvider(), walletAddress: wallet, chainId: preview.chainId, signal: request.signal });
      if (request.signal.aborted || inflight.current !== operation || !live(wallet)) return;
      if (liveBalance.balanceAtomic !== balance.balanceAtomic) throw new Error("personal_company_balance_changed");
      const prepared = await writeCompanyPayment("prepare", { requestId: preview.paymentId, amountAtomic: preview.amountAtomic, chainId: preview.chainId }, { signal: request.signal });
      if (request.signal.aborted || inflight.current !== operation || !live(wallet)) return;
      if (prepared.walletAddress !== wallet || prepared.amountAtomic !== preview.amountAtomic || prepared.chainId !== preview.chainId || prepared.tokenAddress !== preview.tokenAddress) throw new Error("personal_company_wallet_changed");
      if (prepared.status !== "prepared" || prepared.abandonedAt) { save(prepared); return; }
      save(prepared);
      const marker = { version: 1, paymentId: prepared.paymentId, walletAddress: wallet, chainId: prepared.chainId, amountAtomic: prepared.amountAtomic, phase: "signing", transactionHash: null, attemptId: crypto.randomUUID() };
      auditPayment = prepared; attemptId = marker.attemptId;
      const sender = createPersonalCompanyPaymentTransfer({ walletProvider: reown.getCompanyPaymentProvider(), walletAddress: wallet, chainId: prepared.chainId,
        onDispatchStart() {
          if (request.signal.aborted || inflight.current !== operation || !live(wallet)) throw new DOMException("Aborted", "AbortError");
          if (readCompanyRecovery(window.localStorage, wallet, prepared.paymentId)) throw new Error("personal_company_previous_payment_unresolved");
          saveCompanyRecovery(window.localStorage, marker); if (live(wallet)) setRecovery(marker);
        },
        onStateChange(value) {
          if (selected.current?.paymentId === prepared.paymentId && terminal(selected.current)) { finishTerminal(selected.current); return; }
          if (value.phase === "signing") audit(prepared, "wallet_prompt_opened", { attemptId });
          if (value.phase === "rejected") audit(prepared, "wallet_rejected", { attemptId, code: "user_rejected" });
          if (value.phase === "ambiguous") audit(prepared, "broadcast_uncertain", { attemptId, code: auditCode(value) });
          if (value.phase === "reviewing" && !value.transactionMayExist && value.errorCode) audit(prepared, "wallet_failed", { attemptId, code: auditCode(value) });
          if (value.phase === "rejected" || (value.phase === "reviewing" && !value.transactionMayExist && value.errorCode)) {
            const current = readCompanyRecovery(window.localStorage, wallet, prepared.paymentId);
            if (current?.attemptId === marker.attemptId) clearCompanyRecovery(window.localStorage, wallet, prepared.paymentId);
          }
          if (live(wallet) && selected.current?.paymentId === prepared.paymentId) { setTransfer(value); setRecovery(readCompanyRecovery(window.localStorage, wallet, prepared.paymentId)); }
        },
        async onBroadcast(value) {
          audit(prepared, "broadcast_observed", { attemptId, transactionHash: value.transactionHash });
          if (selected.current?.paymentId === prepared.paymentId && selected.current.walletAddress === wallet && terminal(selected.current)
            && selected.current.transactionHash === value.transactionHash) {
            clearCompanyRecovery(window.localStorage, wallet, prepared.paymentId); finishTerminal(selected.current); return;
          }
          // Persist and register a late hash even if its page was closed. Never
          // repeat the transfer when only backend registration needs a retry.
          const broadcast = { ...marker, phase: "broadcast", transactionHash: value.transactionHash };
          try { saveCompanyRecovery(window.localStorage, broadcast); } catch { /* the in-memory hash still permits registration */ }
          if (live(wallet) && selected.current?.paymentId === prepared.paymentId) { setRecovery(broadcast); setStage("status"); }
          try { await registerHash(prepared, value.transactionHash); sender.markSubmitted(prepared.paymentId, value.transactionHash); }
          catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
        },
      });
      const locks = globalThis.navigator?.locks;
      if (!locks?.request) throw new Error("personal_company_recovery_unavailable");
      // A browser-wide exclusive lock closes the read/write race between tabs.
      // Never queue a signature that could open after another payment finishes.
      const outcome = await locks.request(`mindbliss:company-payment:${wallet}`, { mode: "exclusive", ifAvailable: true }, async lock => {
        if (!lock) throw new Error("personal_company_previous_payment_unresolved");
        if (request.signal.aborted || inflight.current !== operation || !live(wallet)) throw new DOMException("Aborted", "AbortError");
        if (readCompanyRecovery(window.localStorage, wallet, prepared.paymentId)) throw new Error("personal_company_previous_payment_unresolved");
        return sender.sendPrepared(prepared, { signal: request.signal, reviewedBalanceAtomic: balance.balanceAtomic });
      });
      if (live(wallet) && !terminal(selected.current) && outcome?.phase === "ambiguous") { setStage("status"); setErrorKey("companyPayment.ambiguousCopy"); }
      if (live(wallet) && !terminal(selected.current) && outcome?.phase === "rejected") setErrorKey("companyPayment.rejected");
    } catch (failure) {
      if (auditPayment && failure?.name !== "AbortError") audit(auditPayment, "wallet_failed", { attemptId, code: auditCode(failure) });
      if (live(wallet)) { setErrorKey(companyPaymentErrorKey(failure)); if (failure?.message === "company_payment_pending_exists") { select(null, "status", false); void refreshHistory(); } }
    } finally {
      if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); }
      if (controller.current === request) controller.current = null;
    }
  }

  /** @param {{ signal?: AbortSignal }} [options] */
  async function verifyPayment({ signal } = {}) {
    const value = selected.current;
    if (!currentDisplay || !live(wallet) || !verified || !value || inflight.current || signal?.aborted) return;
    const operation = {}; inflight.current = operation; setBusy(true); setErrorKey("");
    const request = new AbortController(); controller.current = request;
    const abort = () => request.abort(); signal?.addEventListener("abort", abort, { once: true });
    const marker = readCompanyRecovery(window.localStorage, value.walletAddress, value.paymentId);
    const hash = value.transactionHash || recovery?.transactionHash || manualHash.trim().toLowerCase();
    const auditDetails = { attemptId: marker?.attemptId, ...(/^0x[0-9a-f]{64}$/.test(hash) ? { transactionHash: hash } : {}) };
    if (marker) audit(value, "recovery_detected", auditDetails);
    audit(value, "verification_requested", auditDetails);
    try {
      let registered = value;
      if (!value.transactionHash) {
        if (!/^0x[0-9a-f]{64}$/.test(hash)) throw new Error("company_payment_transaction_pending");
        registered = await registerHash(value, hash);
      }
      if (request.signal.aborted || !live(wallet)) return;
      const result = await writeCompanyPayment("verify", { paymentId: registered.paymentId }, { signal: request.signal });
      if (result.walletAddress !== value.walletAddress || result.amountAtomic !== value.amountAtomic || result.chainId !== value.chainId || result.tokenAddress !== value.tokenAddress) throw new Error("company_payment_unavailable");
      if (live(wallet) && !request.signal.aborted) {
        save(result);
        setRevision(number => number + 1);
      }
    } catch (failure) {
      if (!request.signal.aborted && failure?.name !== "AbortError") {
        audit(value, "verification_failed", { ...auditDetails, code: auditCode(failure, "verification_unavailable") });
        if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure));
      }
    }
    finally {
      signal?.removeEventListener("abort", abort);
      if (controller.current === request) controller.current = null;
      if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); }
    }
  }
  verifyCurrent.current = verifyPayment;

  useEffect(() => {
    if (!verified || !live(wallet) || payment?.status !== "submitted" || !payment.transactionHash || typeof document === "undefined") return undefined;
    const key = `${generation}:${wallet}:${payment.paymentId}`;
    if (polling.current.key !== key) polling.current = { key, deadline: Date.now() + 15 * 60_000 };
    let stopped = false, timer, request;
    const eligible = () => !stopped && live(wallet) && selected.current?.paymentId === payment.paymentId
      && selected.current.status === "submitted" && Date.now() < polling.current.deadline;
    const schedule = () => {
      clearTimeout(timer);
      if (eligible() && document.visibilityState === "visible") {
        timer = setTimeout(check, Math.min(12_000, polling.current.deadline - Date.now())); timer?.unref?.();
      }
    };
    const check = async () => {
      if (!eligible() || document.visibilityState !== "visible") return;
      if (busySnapshot.current || inflight.current) { schedule(); return; }
      request = new AbortController();
      try { await verifyCurrent.current({ signal: request.signal }); }
      finally { request = null; schedule(); }
    };
    const visibility = () => {
      if (document.visibilityState === "visible") schedule();
      else { clearTimeout(timer); request?.abort(); }
    };
    document.addEventListener("visibilitychange", visibility); schedule();
    return () => { stopped = true; clearTimeout(timer); request?.abort(); document.removeEventListener("visibilitychange", visibility); };
  }, [verified, live, wallet, generation, payment?.paymentId, payment?.status, payment?.transactionHash]);

  async function connect() {
    if (!currentDisplay || !live(wallet) || !sessionKey || busy || inflight.current || reown.isRestoring) return;
    const operation = {}; inflight.current = operation; setBusy(true);
    setErrorKey("");
    try {
      if (reown.linkStatus === "error") await reown.refreshLink();
      if (!live(wallet) || inflight.current !== operation) return;
      if (!reown.isConnected || (!reown.isLinked && reown.linkStatus === "linked")) await (reown.connectWallet ? reown.connectWallet() : reown.openConnect());
      else if (!reown.isLinked && reown.linkStatus !== "linked") await reown.linkWallet();
    } catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
    finally { if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); } }
  }
  async function switchNetwork() {
    if (!currentDisplay || !live(wallet) || !sessionKey || inflight.current) return;
    const operation = {}; inflight.current = operation; setBusy(true);
    let timer;
    try {
      await Promise.race([reown.switchCompanyPaymentNetwork(selected.current?.chainId || chainId), new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("personal_company_rpc_unavailable")), 12_000);
      })]);
      if (live(wallet)) { setErrorKey(""); setRevision(number => number + 1); }
    } catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
    finally { clearTimeout(timer); if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); } }
  }
  function changeNetwork(nextChainId) {
    if (!currentDisplay || !live(wallet) || !verified || inflight.current || busy || ![1, 137].includes(nextChainId) || !personalCompanyPaymentPolicy(nextChainId) || nextChainId === activeChain.current) return;
    const value = selected.current;
    const marker = value && readCompanyRecovery(window.localStorage, value.walletAddress, value.paymentId);
    if (marker || recovery || transfer?.transactionMayExist || manualHash.trim()) { setErrorKey("companyPayment.ambiguousCopy"); setStage("status"); return; }
    if (persisted.current && value && (value.status === "submitted" || (value.status === "prepared" && !value.abandonedAt))) {
      setErrorKey("companyPayment.pendingExists"); setStage("status"); return;
    }
    activeChain.current = nextChainId; setChainId(nextChainId);
    select(null, "form", false); setTransfer(null); setRecovery(null); setManualHash(""); setErrorKey("");
    amountEdited.current = false;
    const next = balances.wallet === wallet && !balances.loading ? balances.records.find(record => record.chainId === nextChainId) : null;
    setAmount(next && !next.error && next.balanceAtomic !== null && BigInt(next.balanceAtomic) > 0n ? formatPersonalCompanyPaymentAmount(next.balanceAtomic) : "");
  }
  function edit() { if (currentDisplay && live(wallet) && !busy) { setErrorKey(""); setStage("form"); } }
  async function abandon() {
    const value = selected.current;
    if (!currentDisplay || !live(wallet) || !verified || !value || value.status !== "prepared" || inflight.current || manualHash.trim() || readCompanyRecovery(window.localStorage, value.walletAddress, value.paymentId)) return;
    if (!persisted.current) { select(null, "form", false); return; }
    const operation = {}; inflight.current = operation; setBusy(true); setErrorKey("");
    try {
      const discarded = await writeCompanyPayment("abandon", { paymentId: value.paymentId });
      if (!discarded.abandonedAt || discarded.status !== "prepared") throw new Error("company_payment_unavailable");
      if (live(wallet)) { select(null, "form", false); setRecovery(null); setTransfer(null); setRevision(number => number + 1); }
    } catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
    finally { if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); } }
  }
  function newPayment() { if (currentDisplay && live(wallet) && !busy && !manualHash.trim() && !recovery && selected.current && (["confirmed", "failed"].includes(selected.current.status) || (selected.current.status === "prepared" && selected.current.abandonedAt))) { select(null, "form", false); setTransfer(null); setRecovery(null); setAmount(""); amountEdited.current = false; setManualHash(""); setRevision(number => number + 1); } }
  return { wallet, verified, chainId, changeNetwork, chainBalances: [1, 137].map(id => {
    const entry = currentDisplay && verified && balances.wallet === wallet ? balances.records.find(record => record.chainId === id) : null;
    return { chainId: id, balanceAtomic: entry?.balanceAtomic ?? null, error: entry?.error || balances.error,
      loading: !currentDisplay || balances.loading };
  }), connected: currentDisplay && connected, needsVerification: currentDisplay && Boolean(sessionKey) && reown.isConnected === true && reown.linkStatus === "unlinked" && reown.isLinked !== true,
    restoring: currentDisplay && reown.isRestoring === true, amount: currentDisplay ? amount : "", setAmount: value => { if (!currentDisplay || !live(wallet)) return; amountEdited.current = true; setAmount(value); setErrorKey(""); },
    balanceAtomic: currentDisplay && verified && balance.wallet === wallet ? balance.balanceAtomic : null, loadingBalance: !currentDisplay || balance.loading,
    nativeBalanceAtomic: currentDisplay && verified && balance.wallet === wallet && !balance.loading && !balance.error ? selectedBalance?.nativeBalanceAtomic ?? null : null,
    errorKey: currentDisplay ? errorKey || balance.error || history.error : "", history: currentDisplay && verified && history.wallet === wallet ? history.records : [], historyLoading: !currentDisplay || history.loading,
    payment: currentDisplay ? payment : null, stage: currentDisplay ? stage : "form", transfer: currentDisplay ? transfer : null,
    recovery: currentDisplay ? recovery : null, manualHash: currentDisplay ? manualHash : "", setManualHash: value => { if (currentDisplay && live(wallet)) setManualHash(value); }, busy: currentDisplay && busy,
    review, confirm, connect, switchNetwork, verifyPayment, edit, abandon, newPayment,
    resume() { if (currentDisplay && live(wallet) && !busy && personalCompanyPaymentPolicy(selected.current?.chainId) && selected.current?.status === "prepared" && !selected.current.abandonedAt && !recovery && !readCompanyRecovery(window.localStorage, wallet, selected.current.paymentId)) setStage("review"); },
    refresh: () => setRevision(number => number + 1), selectHistory(value) {
      const safe = companyPaymentView(value);
      if (!currentDisplay || !live(wallet) || !verified || !safe || safe.walletAddress !== wallet || inflight.current) return;
      const current = selected.current;
      if (current?.paymentId === safe.paymentId && !samePayment(current, safe)) {
        setErrorKey("companyPayment.networkUnavailable"); return;
      }
      if (current?.paymentId === safe.paymentId && (terminal(current) || (current.transactionHash && !safe.transactionHash))) {
        finishTerminal(current); return;
      }
      if (current && current.paymentId !== safe.paymentId && (readCompanyRecovery(window.localStorage, current.walletAddress, current.paymentId)
        || transfer?.transactionMayExist || (persisted.current && (current.status === "submitted" || (current.status === "prepared" && !current.abandonedAt))))) {
        setErrorKey("companyPayment.pendingExists"); setStage("status"); return;
      }
      select(safe); setManualHash("");
      if (terminal(safe)) finishTerminal(safe);
      else { setRecovery(readCompanyRecovery(window.localStorage, safe.walletAddress, safe.paymentId)); setErrorKey(""); }
    },
  };
}
