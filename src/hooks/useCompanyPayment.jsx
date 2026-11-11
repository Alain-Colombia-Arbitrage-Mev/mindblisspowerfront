"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { companyPaymentView } from "@/lib/company-payment-contract.mjs";
import { readCompanyPaymentHistory, writeCompanyPayment } from "@/lib/company-payment-client.mjs";
import { clearCompanyRecovery, readCompanyRecovery, saveCompanyRecovery } from "@/lib/company-payment-recovery.mjs";
import { createPersonalCompanyPaymentTransfer, readPersonalCompanyPaymentBalance } from "@/lib/personal-company-payment.mjs";
import { PERSONAL_COMPANY_PAYMENT, personalCompanyPaymentAmountAtomic } from "@/lib/personal-company-payment-values.mjs";

export function companyPaymentErrorKey(failure) {
  const code = failure?.message || "";
  if (failure?.name === "AbortError") return "";
  const keys = {
    personal_company_insufficient_pol: "zeroGas", personal_company_balance_changed: "balanceChanged", personal_company_rejected: "rejected",
    personal_company_wallet_changed: "walletMismatch", personal_company_wallet_unavailable: "walletMismatch", personal_company_chain_changed: "switchNetwork",
    personal_company_intent_expired: "expired", personal_company_recovery_unavailable: "recoveryUnavailable",
    personal_company_intent_abandoned: "abandonedCopy",
    personal_company_broadcast_ambiguous: "ambiguousCopy", personal_company_previous_payment_unresolved: "ambiguousCopy",
    personal_company_insufficient_usdt: "insufficientBalance", company_payment_insufficient_balance: "insufficientBalance",
    company_payment_pending_exists: "pendingExists", company_payment_unconfigured: "serviceUnavailable", company_payment_forbidden: "walletMismatch",
    company_payment_wallet_not_linked: "walletMismatch", unauthenticated: "connectCopy", company_payment_transaction_pending: "pendingCopy",
    company_payment_transaction_mismatch: "paymentFailed", company_payment_hash_reused: "paymentFailed",
  };
  return `companyPayment.${keys[code] || "networkUnavailable"}`;
}

/** Signature requests happen only in confirm(), never in an effect or a retry. */
export function useCompanyPayment(reown) {
  const wallet = typeof reown.linkedAddress === "string" ? reown.linkedAddress.toLowerCase() : "";
  const verified = reown.linkStatus === "linked" && /^0x[0-9a-f]{40}$/.test(wallet);
  const connected = verified && reown.isConnected && reown.isLinked;
  const mounted = useRef(false), owner = useRef(wallet), inflight = useRef(null), controller = useRef(null), selected = useRef(null);
  const epoch = useRef({ wallet, version: 0 });
  if (epoch.current.wallet !== wallet) epoch.current = { wallet, version: epoch.current.version + 1 };
  const generation = epoch.current.version;
  const registrations = useRef(new Map());
  const persisted = useRef(false);
  owner.current = wallet;
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState({ wallet: "", loading: false, balanceAtomic: null, error: "" });
  const [history, setHistory] = useState({ wallet: "", loading: true, records: [], error: "" });
  const [payment, setPayment] = useState(null), [stage, setStage] = useState("form"), [transfer, setTransfer] = useState(null);
  const [busy, setBusy] = useState(false), [errorKey, setErrorKey] = useState(""), [revision, setRevision] = useState(0);
  const [recovery, setRecovery] = useState(null), [manualHash, setManualHash] = useState("");
  const live = useCallback(address => mounted.current && owner.current === address && epoch.current.version === generation, [generation]);
  const select = useCallback((value, nextStage = "status", registered = true) => { selected.current = value; persisted.current = registered; setPayment(value); setStage(nextStage); }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => {
    selected.current = null; persisted.current = false; setPayment(null); setRecovery(null); setTransfer(null); setStage("form"); setAmount(""); setManualHash(""); setErrorKey("");
    controller.current?.abort();
    inflight.current = null; setBusy(false);
  }, [wallet]);

  const refreshHistory = useCallback(async (signal = undefined) => {
    if (!verified) { setHistory({ wallet, loading: false, records: [], error: "" }); return; }
    setHistory(current => ({ ...current, wallet, loading: true, error: "" }));
    try {
      const result = await readCompanyPaymentHistory({ signal });
      if (!live(wallet) || signal?.aborted) return;
      setHistory({ wallet, loading: false, records: result.records, error: "" });
      const pending = result.records.find(record => record.status === "submitted" || (record.status === "prepared" && ((!record.abandonedAt && Date.parse(record.expiresAt) > Date.now()) || readCompanyRecovery(window.localStorage, record.walletAddress, record.paymentId))));
      if (!selected.current && pending) {
        select(pending); setRecovery(readCompanyRecovery(window.localStorage, pending.walletAddress, pending.paymentId));
      }
    } catch (failure) {
      if (live(wallet) && !signal?.aborted) setHistory({ wallet, loading: false, records: [], error: companyPaymentErrorKey(failure) });
    }
  }, [verified, wallet, live, select]);

  useEffect(() => {
    const request = new AbortController();
    void refreshHistory(request.signal);
    return () => request.abort();
  }, [refreshHistory, revision]);

  useEffect(() => {
    if (!connected) { setBalance({ wallet, loading: false, balanceAtomic: null, error: "" }); return undefined; }
    const request = new AbortController();
    setBalance({ wallet, loading: true, balanceAtomic: null, error: "" });
    Promise.resolve().then(() => readPersonalCompanyPaymentBalance({ walletProvider: reown.getCompanyPaymentProvider(), walletAddress: wallet, signal: request.signal }))
      .then(result => { if (live(wallet) && !request.signal.aborted) setBalance({ wallet, loading: false, balanceAtomic: result.balanceAtomic, error: "" }); })
      .catch(failure => { if (live(wallet) && !request.signal.aborted) setBalance({ wallet, loading: false, balanceAtomic: null, error: companyPaymentErrorKey(failure) }); });
    return () => request.abort();
  }, [connected, wallet, reown.getCompanyPaymentProvider, live, revision]);

  const save = useCallback(value => {
    const safe = companyPaymentView(value);
    if (!safe) throw new Error("company_payment_unavailable");
    const current = selected.current;
    if (current && current.paymentId === safe.paymentId && ["confirmed", "failed"].includes(current.status)) return current;
    if (live(wallet) && (!current || current.paymentId === safe.paymentId)) select(safe, safe.status === "prepared" && !safe.abandonedAt ? "review" : "status");
    return safe;
  }, [live, wallet, select]);

  function registerHash(value, hash) {
    const key = `${value.paymentId}:${hash}`;
    if (registrations.current.has(key)) return registrations.current.get(key);
    const operation = (async () => {
      let saved = await writeCompanyPayment("submit", { paymentId: value.paymentId, transactionHash: hash });
      if (saved.walletAddress !== value.walletAddress || saved.amountAtomic !== value.amountAtomic) throw new Error("company_payment_unavailable");
      const current = selected.current;
      if (current?.paymentId === saved.paymentId && ["confirmed", "failed"].includes(current.status)) saved = current;
      if (["confirmed", "failed"].includes(saved.status)) clearCompanyRecovery(window.localStorage, saved.walletAddress, saved.paymentId);
      else saveCompanyRecovery(window.localStorage, { version: 1, paymentId: saved.paymentId, walletAddress: saved.walletAddress,
        amountAtomic: saved.amountAtomic, phase: "submitted", transactionHash: hash });
      if (live(wallet) && (!current || current.paymentId === saved.paymentId)) { save(saved); setRecovery(readCompanyRecovery(window.localStorage, saved.walletAddress, saved.paymentId)); setErrorKey(""); }
      return saved;
    })().finally(() => { if (registrations.current.get(key) === operation) registrations.current.delete(key); });
    registrations.current.set(key, operation);
    return operation;
  }

  function review() {
    const atomic = personalCompanyPaymentAmountAtomic(amount);
    if (inflight.current || !connected || !atomic || balance.wallet !== wallet || balance.balanceAtomic === null || BigInt(atomic) > BigInt(balance.balanceAtomic)) return;
    if (persisted.current && selected.current && selected.current.status === "prepared" && selected.current.amountAtomic !== atomic) { setErrorKey("companyPayment.pendingExists"); setStage("status"); return; }
    setErrorKey("");
    // The preview is local and editable. Persist the exact intent on Confirm,
    // before opening the wallet. A preview never claims server registration.
    const value = persisted.current ? selected.current : { paymentId: crypto.randomUUID(), walletKind: "personal", walletAddress: wallet,
      ...PERSONAL_COMPANY_PAYMENT, amountAtomic: atomic, status: "prepared", createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), transactionHash: null, blockNumber: null, blockHash: null,
      confirmations: 0, requiredConfirmations: 12, failureReason: null, abandonedAt: null, membershipAssignment: "pending" };
    select(value, "review", persisted.current);
  }

  async function confirm() {
    const preview = selected.current;
    if (inflight.current || !connected || !preview || preview.status !== "prepared" || preview.abandonedAt || preview.walletAddress !== wallet || balance.balanceAtomic === null) return;
    const stored = readCompanyRecovery(window.localStorage, wallet, preview.paymentId);
    if (stored) { setRecovery(stored); setStage("status"); setErrorKey("companyPayment.ambiguousCopy"); return; }
    const operation = {}; inflight.current = operation; setBusy(true); setErrorKey("");
    const request = new AbortController(); controller.current = request;
    try {
      const prepared = await writeCompanyPayment("prepare", { requestId: preview.paymentId, amountAtomic: preview.amountAtomic }, { signal: request.signal });
      if (request.signal.aborted || inflight.current !== operation || !live(wallet)) return;
      if (prepared.walletAddress !== wallet || prepared.amountAtomic !== preview.amountAtomic) throw new Error("personal_company_wallet_changed");
      if (prepared.status !== "prepared" || prepared.abandonedAt) { save(prepared); return; }
      save(prepared);
      const marker = { version: 1, paymentId: prepared.paymentId, walletAddress: wallet, amountAtomic: prepared.amountAtomic, phase: "signing", transactionHash: null, attemptId: crypto.randomUUID() };
      const sender = createPersonalCompanyPaymentTransfer({ walletProvider: reown.getCompanyPaymentProvider(), walletAddress: wallet,
        onDispatchStart() {
          if (request.signal.aborted || inflight.current !== operation || !live(wallet)) throw new DOMException("Aborted", "AbortError");
          if (readCompanyRecovery(window.localStorage, wallet, prepared.paymentId)) throw new Error("personal_company_previous_payment_unresolved");
          saveCompanyRecovery(window.localStorage, marker); if (live(wallet)) setRecovery(marker);
        },
        onStateChange(value) {
          if (value.phase === "rejected" || (value.phase === "reviewing" && !value.transactionMayExist && value.errorCode)) {
            const current = readCompanyRecovery(window.localStorage, wallet, prepared.paymentId);
            if (current?.attemptId === marker.attemptId) clearCompanyRecovery(window.localStorage, wallet, prepared.paymentId);
          }
          if (live(wallet) && selected.current?.paymentId === prepared.paymentId) { setTransfer(value); setRecovery(readCompanyRecovery(window.localStorage, wallet, prepared.paymentId)); }
        },
        async onBroadcast(value) {
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
      if (live(wallet) && outcome?.phase === "ambiguous") { setStage("status"); setErrorKey("companyPayment.ambiguousCopy"); }
      if (live(wallet) && outcome?.phase === "rejected") setErrorKey("companyPayment.rejected");
    } catch (failure) {
      if (live(wallet)) { setErrorKey(companyPaymentErrorKey(failure)); if (failure?.message === "company_payment_pending_exists") { select(null, "status", false); void refreshHistory(); } }
    } finally {
      if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); }
      if (controller.current === request) controller.current = null;
    }
  }

  async function verifyPayment() {
    const value = selected.current;
    if (!value || inflight.current) return;
    const operation = {}; inflight.current = operation; setBusy(true); setErrorKey("");
    try {
      const hash = recovery?.transactionHash || manualHash.trim().toLowerCase();
      let registered = value;
      if (!value.transactionHash) {
        if (!/^0x[0-9a-f]{64}$/.test(hash)) throw new Error("company_payment_transaction_pending");
        registered = await registerHash(value, hash);
      }
      const result = await writeCompanyPayment("verify", { paymentId: registered.paymentId });
      if (result.walletAddress !== value.walletAddress || result.amountAtomic !== value.amountAtomic) throw new Error("company_payment_unavailable");
      if (live(wallet)) {
        save(result);
        if (["confirmed", "failed"].includes(result.status)) { clearCompanyRecovery(window.localStorage, result.walletAddress, result.paymentId); setRecovery(null); setManualHash(""); }
        setRevision(number => number + 1);
      }
    } catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
    finally { if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); } }
  }

  async function connect() {
    if (busy) return;
    setErrorKey("");
    try {
      if (reown.linkStatus === "error") await reown.refreshLink();
      else if (!reown.isConnected) await reown.openConnect();
      else if (!reown.isLinked && reown.linkStatus !== "linked") await reown.linkWallet();
      else if (!reown.isLinked) await reown.openAccount();
    } catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
  }
  async function switchNetwork() {
    try {
      await reown.getCompanyPaymentProvider().request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x89" }] });
      if (live(wallet)) { setErrorKey(""); setRevision(number => number + 1); }
    } catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
  }
  function edit() { if (!busy) { setErrorKey(""); setStage("form"); } }
  async function abandon() {
    const value = selected.current;
    if (!value || value.status !== "prepared" || inflight.current || manualHash.trim() || readCompanyRecovery(window.localStorage, value.walletAddress, value.paymentId)) return;
    if (!persisted.current) { select(null, "form", false); return; }
    const operation = {}; inflight.current = operation; setBusy(true); setErrorKey("");
    try {
      const discarded = await writeCompanyPayment("abandon", { paymentId: value.paymentId });
      if (!discarded.abandonedAt || discarded.status !== "prepared") throw new Error("company_payment_unavailable");
      if (live(wallet)) { select(null, "form", false); setRecovery(null); setTransfer(null); setRevision(number => number + 1); }
    } catch (failure) { if (live(wallet)) setErrorKey(companyPaymentErrorKey(failure)); }
    finally { if (inflight.current === operation) { inflight.current = null; if (live(wallet)) setBusy(false); } }
  }
  function newPayment() { if (!busy && !manualHash.trim() && !recovery && selected.current && (["confirmed", "failed"].includes(selected.current.status) || (selected.current.status === "prepared" && selected.current.abandonedAt))) { select(null, "form", false); setTransfer(null); setRecovery(null); setAmount(""); setManualHash(""); setRevision(number => number + 1); } }
  return { wallet, verified, connected, amount, setAmount: value => { setAmount(value); setErrorKey(""); },
    balanceAtomic: balance.wallet === wallet ? balance.balanceAtomic : null, loadingBalance: balance.loading,
    errorKey: errorKey || balance.error || history.error, history: history.wallet === wallet ? history.records : [], historyLoading: history.loading,
    payment, stage, transfer, recovery, manualHash, setManualHash, busy, review, confirm, connect, switchNetwork, verifyPayment, edit, abandon, newPayment,
    resume() { if (!busy && selected.current?.status === "prepared" && !selected.current.abandonedAt && !recovery) setStage("review"); },
    refresh: () => setRevision(number => number + 1), selectHistory(value) {
      select(value); setManualHash("");
      if (["confirmed", "failed"].includes(value.status)) clearCompanyRecovery(window.localStorage, value.walletAddress, value.paymentId);
      setRecovery(readCompanyRecovery(window.localStorage, value.walletAddress, value.paymentId)); setErrorKey("");
    },
  };
}
