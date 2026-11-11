"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMemberSession } from "@/lib/member-session-context";
import { usePersonalWalletBalance } from "@/hooks/usePersonalWalletBalance";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";
import { readPersonalWalletBalances } from "@/lib/personal-wallet-balance.mjs";
import { personalCompanyPaymentAmountAtomic, formatPersonalCompanyPaymentAmount, POLYGON_COMPANY_PAYMENT } from "@/lib/personal-company-payment-values.mjs";
import { readPolygonRelayCapabilities, readPolygonRelayHistory, readPolygonRelayStatus, writePolygonRelay } from "@/lib/polygon-relay-client.mjs";
import { polygonRelayView } from "@/lib/polygon-relay-contract.mjs";
import { signPolygonRelay } from "@/lib/polygon-relay-signing.mjs";
import { isPolygonRelayChain } from "@/lib/polygon-relay-chain.mjs";
import { createReownFundingOperation } from "@/lib/reown-funding-operation.mjs";
import { FUNDING_UUID } from "@/lib/wallet-funding-contract.mjs";

const terminal = value => ["confirmed", "failed", "expired"].includes(value?.status);
const proofStates = new Set(["broadcasting", "ambiguous", "submitted", "reconciliation_required"]);
const receiptPollDelays = [12_000, 30_000, 60_000];
const immutable = (left, right) => ["paymentId", "walletAddress", "executionMode", "chainId", "tokenAddress", "recipientAddress", "amountAtomic",
  "authorizationNonce", "authorizationDigest", "relayerAddress", "entryPointAddress"].every(key => left?.[key] === right?.[key]);
const unresolved = value => value && !terminal(value);
const phases = new Set(["signing", "authorizing", "authorized", "submitting", "ambiguous"]);
async function recoveryKey(owner, wallet) {
  try {
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(owner)));
    return `mindbliss:polygon-relay:v1:${[...hash].map(byte => byte.toString(16).padStart(2, "0")).join("")}:${wallet}`;
  } catch { return ""; }
}
function readRecovery(key, wallet) {
  try {
    const raw = key && window.localStorage.getItem(key);
    if (!raw || raw.length > 512) return null;
    const value = JSON.parse(raw);
    return value?.version === 1 && value.walletAddress === wallet && typeof value.paymentId === "string" && value.paymentId === value.paymentId.toLowerCase()
      && FUNDING_UUID.test(value.paymentId) && phases.has(value.phase)
      && Object.keys(value).every(key => ["version", "walletAddress", "paymentId", "phase"].includes(key)) ? value : null;
  } catch { return null; }
}
function persistRecovery(key, value) {
  if (!key) throw new Error("polygon_relay_recovery_unavailable");
  const raw = JSON.stringify({ version: 1, walletAddress: value.walletAddress, paymentId: value.paymentId, phase: value.phase });
  try { window.localStorage.setItem(key, raw); if (window.localStorage.getItem(key) !== raw) throw new Error(); }
  catch { throw new Error("polygon_relay_recovery_unavailable"); }
}
function clearRecovery(key, id, wallet) {
  try { if (readRecovery(key, wallet)?.paymentId === id) window.localStorage.removeItem(key); } catch { /* backend evidence remains authoritative */ }
}
export function polygonRelayErrorKey(failure) {
  if (failure?.name === "AbortError") return "";
  if (failure?.code === 4001 || failure?.code === "ACTION_REJECTED") return "walletTransfer.rejected";
  const code = failure?.message || "";
  if (code === "polygon_relay_balance_changed") return "companyPayment.balanceChanged";
  const keys = { unauthenticated: "session", wallet_connection_timeout: "session", reown_connection_timeout: "ambiguous",
    wallet_address_mismatch: "walletMismatch", personal_company_wallet_unavailable: "walletMismatch", polygon_relay_wallet_changed: "walletMismatch",
    polygon_relay_wallet_not_linked: "walletMismatch", polygon_relay_expired: "expired", polygon_relay_insufficient_balance: "insufficientBalance",
    polygon_relay_pending_exists: "pending", polygon_relay_recovery_unavailable: "pending",
    polygon_relay_invalid_authorization: "invalidAuthorization", polygon_relay_signature_invalid: "invalidAuthorization",
    polygon_relay_authorization_nonce_changed: "invalidAuthorization", polygon_relay_forbidden: "walletMismatch",
    polygon_relay_rate_limited: "rateLimited", polygon_relay_budget_exceeded: "budgetUnavailable",
    polygon_relay_account_busy: "pending", polygon_relay_queue_busy: "pending", polygon_relay_lease_active: "pending", polygon_relay_nonce_reserved: "pending",
    polygon_relay_budget_unavailable: "budgetUnavailable", polygon_relay_sponsorship_rejected: "sponsorshipUnavailable",
    polygon_relay_sponsorship_unavailable: "sponsorshipUnavailable", polygon_relay_ambiguous: "ambiguous", polygon_relay_network_mismatch: "networkMismatch" };
  return `walletTransfer.${keys[code] || "unavailable"}`;
}

/** Personal Polygon native-meta relay only. No signed authorization is cached or replayed. */
export function usePolygonRelay(reown) {
  const sessionKey = personalWalletBalanceSessionKey(useMemberSession());
  const wallet = typeof reown.linkedAddress === "string" ? reown.linkedAddress.toLowerCase() : "";
  const verified = Boolean(sessionKey) && reown.linkStatus === "linked" && /^0x[0-9a-f]{40}$/.test(wallet);
  const sharedBalance = usePersonalWalletBalance(wallet, "polygon", verified);
  const connected = verified && reown.isConnected === true && reown.isLinked === true;
  const owner = useRef({ wallet, sessionKey, generation: 0 });
  if (owner.current.wallet !== wallet || owner.current.sessionKey !== sessionKey) owner.current = { wallet, sessionKey, generation: owner.current.generation + 1 };
  const generation = owner.current.generation;
  const signer = useRef({ connected, address: reown.address, provider: reown.getCompanyPaymentProvider, generation: 0 });
  if (signer.current.connected !== connected || signer.current.address !== reown.address || signer.current.provider !== reown.getCompanyPaymentProvider) {
    signer.current = { connected, address: reown.address, provider: reown.getCompanyPaymentProvider, generation: signer.current.generation + 1 };
  }
  const signerGeneration = signer.current.generation;
  const keyPromise = useMemo(() => verified ? recoveryKey(sessionKey, wallet) : Promise.resolve(""), [verified, sessionKey, wallet]);
  const mounted = useRef(false), operation = useRef(null), selected = useRef(null), previewRef = useRef(null), markerRef = useRef(null);
  const displayGeneration = useRef(generation), currentDisplay = displayGeneration.current === generation;
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false), [errorKey, setErrorKey] = useState("");
  const [amount, setAmountState] = useState(""), edited = useRef(false);
  const [balance, setBalance] = useState({ wallet: "", loading: false, balanceAtomic: null, nativeBalanceAtomic: null, error: "" });
  const [history, setHistory] = useState({ wallet: "", loading: false, payments: [], error: "" });
  const [capabilities, setCapabilities] = useState({ loading: true, transferEnabled: false, error: "" });
  const [payment, setPayment] = useState(null), [preview, setPreview] = useState(null), [stage, setStage] = useState("form"), [recovery, setRecovery] = useState(null);
  const live = useCallback(() => mounted.current && owner.current.generation === generation && Boolean(sessionKey), [generation, sessionKey]);
  const historySelection = useRef(0);
  const terminalNotifications = useRef(new Set());
  const busyRef = useRef(busy), verifier = useRef(null), poll = useRef({ key: "", deadline: 0, attempts: 0 }); busyRef.current = busy;
  const adopt = useCallback((value, key = "") => {
    const safe = polygonRelayView(value);
    if (!safe || safe.walletAddress !== wallet || (selected.current?.paymentId === safe.paymentId && !immutable(selected.current, safe))) throw new Error("polygon_relay_invalid_authorization");
    const previous = selected.current;
    if (previous?.paymentId === safe.paymentId && terminal(previous)) return previous;
    if (live()) {
      selected.current = safe; setPayment(safe); setStage("status");
      if (terminal(safe)) {
        clearRecovery(key, safe.paymentId, wallet); markerRef.current = null; setRecovery(null); setErrorKey("");
        const notification = `${generation}:${safe.paymentId}`;
        if (!terminalNotifications.current.has(notification)) {
          terminalNotifications.current.add(notification);
          if (terminalNotifications.current.size > 64) terminalNotifications.current.delete(terminalNotifications.current.values().next().value);
          try { window.dispatchEvent(new Event("vp:personal-wallet-balance-changed")); } catch { /* canonical state remains available without browser events */ }
        }
      }
    }
    return safe;
  }, [wallet, live, generation]);
  const updateMarker = useCallback((key, value, phase) => {
    const marker = { version: 1, paymentId: value.paymentId, walletAddress: wallet, phase };
    persistRecovery(key, marker);
    if (live()) { markerRef.current = marker; setRecovery(marker); }
    return marker;
  }, [wallet, live]);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; operation.current?.scope.cancel(); }; }, []);
  useEffect(() => {
    displayGeneration.current = generation; operation.current?.scope.cancel(); operation.current = null;
    selected.current = null; previewRef.current = null; markerRef.current = null; edited.current = false;
    setPayment(null); setPreview(null); setRecovery(null); setStage("form"); setAmountState(""); setBusy(false); setErrorKey("");
    setBalance({ wallet, loading: false, balanceAtomic: null, nativeBalanceAtomic: null, error: "" });
    setHistory({ wallet, loading: false, payments: [], error: "" });
  }, [wallet, generation]);
  useEffect(() => { if (operation.current?.signing) operation.current.scope.cancel(); }, [signerGeneration]);
  useEffect(() => {
    if (!verified) { setCapabilities({ loading: false, transferEnabled: false, error: "" }); return undefined; }
    const controller = new AbortController();
    setCapabilities(current => ({ ...current, loading: true, error: "" }));
    readPolygonRelayCapabilities({ signal: controller.signal }).then(value => {
      if (live() && !controller.signal.aborted) setCapabilities({ ...value, loading: false, error: "" });
    }).catch(failure => { if (live() && !controller.signal.aborted) setCapabilities({ loading: false, transferEnabled: false, error: polygonRelayErrorKey(failure) }); });
    return () => controller.abort();
  }, [verified, live, revision]);
  useEffect(() => {
    if (!verified) {
      setBalance(current => current.loading ? { ...current, loading: false } : current);
      return undefined;
    }
    if (!live()) return undefined;
    if (sharedBalance.loading || (!sharedBalance.walletAddress && !sharedBalance.error)) {
      setBalance(current => ({ ...current, wallet, loading: true, error: "" }));
    } else if (sharedBalance.error || sharedBalance.walletAddress !== wallet || sharedBalance.balanceAtomic === null) {
      setBalance({ wallet, loading: false, balanceAtomic: null, nativeBalanceAtomic: null,
        error: polygonRelayErrorKey(new Error(sharedBalance.walletAddress && sharedBalance.walletAddress !== wallet ? "polygon_relay_wallet_changed" : "polygon_relay_unavailable")) });
    } else {
      setBalance({ wallet, loading: false, balanceAtomic: sharedBalance.balanceAtomic, nativeBalanceAtomic: sharedBalance.nativeBalanceAtomic ?? null, error: "" });
      if (!edited.current && !selected.current && !previewRef.current) setAmountState(formatPersonalCompanyPaymentAmount(sharedBalance.balanceAtomic));
    }
    return undefined;
  }, [verified, wallet, live, sharedBalance.walletAddress, sharedBalance.balanceAtomic, sharedBalance.nativeBalanceAtomic,
    sharedBalance.loading, sharedBalance.error, sharedBalance.updatedAt]);
  useEffect(() => {
    if (!verified) return undefined;
    const controller = new AbortController(); setHistory(current => ({ ...current, wallet, loading: true, error: "" }));
    Promise.all([readPolygonRelayHistory({ signal: controller.signal }), keyPromise]).then(async ([result, key]) => {
      if (!live() || controller.signal.aborted) return;
      if (result.payments.some(item => item.walletAddress !== wallet)) throw new Error("polygon_relay_wallet_changed");
      setHistory({ wallet, loading: false, payments: result.payments, error: "" });
      const marker = readRecovery(key, wallet); markerRef.current = marker; setRecovery(marker);
      const current = selected.current, reviewed = previewRef.current;
      const expectedId = current?.paymentId || reviewed?.requestId;
      const latest = expectedId && result.payments.find(item => item.paymentId === expectedId);
      if (latest) {
        if (!current && (!reviewed || latest.walletAddress !== reviewed.walletAddress || latest.amountAtomic !== reviewed.amountAtomic)) throw new Error("polygon_relay_invalid_authorization");
        adopt(latest, key); if (!terminal(current) && terminal(latest)) setRevision(number => number + 1);
      }
      else if (!current && !previewRef.current) {
        const pending = result.payments.find(item => item.paymentId === marker?.paymentId) || result.payments.find(unresolved);
        if (pending) adopt(pending, key);
        else if (marker) {
          const restored = await readPolygonRelayStatus(marker.paymentId, { signal: controller.signal });
          if (live() && !controller.signal.aborted) adopt(restored, key);
        }
      }
    }).catch(failure => { if (live() && !controller.signal.aborted) setHistory({ wallet, loading: false, payments: [], error: polygonRelayErrorKey(failure) }); });
    return () => controller.abort();
  }, [verified, wallet, live, adopt, keyPromise, revision]);

  const begin = () => {
    if (!currentDisplay || !live() || operation.current) return null;
    const scope = createReownFundingOperation(), next = { scope, signing: false }; operation.current = next; setBusy(true); setErrorKey(""); return next;
  };
  const finish = value => { value.scope.finish(); if (operation.current === value) {
    operation.current = null;
    if (live()) {
      setBusy(false);
    }
  } };
  const active = value => { value.scope.assertActive(); if (!live() || operation.current !== value) throw new DOMException("Aborted", "AbortError"); };
  async function enabled(value) {
    const result = await value.scope.wait(() => readPolygonRelayCapabilities({ signal: value.scope.signal })); active(value);
    setCapabilities({ ...result, loading: false, error: "" });
    if (!result.transferEnabled) throw new Error("polygon_relay_sponsorship_unavailable");
  }
  async function identity(value, provider) {
    const captured = signer.current.generation;
    const [chain, accounts] = await value.scope.wait(() => Promise.all([
      provider.request({ method: "eth_chainId" }), provider.request({ method: "eth_accounts" }),
    ])); active(value);
    if (signer.current.generation !== captured || !signer.current.connected || !Array.isArray(accounts) || accounts.length !== 1
      || typeof accounts[0] !== "string" || accounts[0].toLowerCase() !== wallet) throw new Error("polygon_relay_wallet_changed");
    if (!isPolygonRelayChain(chain)) throw new Error("polygon_relay_network_mismatch");
  }
  async function review() {
    const atomic = personalCompanyPaymentAmountAtomic(amount);
    if (!currentDisplay || !connected || !atomic || balance.wallet !== wallet || balance.balanceAtomic === null || BigInt(atomic) > BigInt(balance.balanceAtomic)) return;
    if (selected.current && unresolved(selected.current)) { setErrorKey("walletTransfer.pending"); setStage("status"); return; }
    const value = begin(); if (!value) return; value.signing = true;
    const capturedSigner = signer.current.generation;
    const assertReview = () => {
      active(value);
      if (signer.current.generation !== capturedSigner || !signer.current.connected) throw new DOMException("Aborted", "AbortError");
    };
    try {
      await enabled(value); assertReview(); await identity(value, reown.getCompanyPaymentProvider()); assertReview();
      const key = await value.scope.wait(() => keyPromise); assertReview();
      if (readRecovery(key, wallet)) throw new Error("polygon_relay_pending_exists");
      const readFunds = async () => {
        const result = await value.scope.wait(() => readPersonalWalletBalances({ signal: value.scope.signal })); assertReview();
        if (result.walletAddress !== wallet) throw new Error("polygon_relay_wallet_changed");
        const entry = result.balances.find(item => item.chainId === 137);
        if (!entry) return null;
        if (entry.error && entry.error !== "company_payment_rpc_unavailable") throw new Error("polygon_relay_unavailable");
        return entry.error || entry.balanceAtomic === null ? null : entry;
      };
      let funds;
      try { funds = await readFunds(); }
      catch (failure) { assertReview(); if (failure?.message !== "company_payment_rpc_unavailable") throw failure; }
      // Retry one transient, owner-matched chain read. Never repeat preparation,
      // authorization, identity changes or any write/signing operation here.
      if (!funds) { assertReview(); funds = await readFunds(); }
      if (!funds) throw new Error("polygon_relay_unavailable");
      if (funds.balanceAtomic !== balance.balanceAtomic) {
        setBalance({ wallet, loading: false, balanceAtomic: funds.balanceAtomic, nativeBalanceAtomic: funds.nativeBalanceAtomic ?? null, error: "" });
        if (!edited.current && !selected.current && !previewRef.current) setAmountState(formatPersonalCompanyPaymentAmount(funds.balanceAtomic));
        if (edited.current && BigInt(atomic) > BigInt(funds.balanceAtomic)) throw new Error("polygon_relay_insufficient_balance");
        throw new Error("polygon_relay_balance_changed");
      }
      if (selected.current && unresolved(selected.current)) throw new Error("polygon_relay_pending_exists");
      const next = Object.freeze({ requestId: crypto.randomUUID(), walletAddress: wallet, amountAtomic: atomic, reviewedBalanceAtomic: funds.balanceAtomic, ...POLYGON_COMPANY_PAYMENT });
      previewRef.current = next; setPreview(next); setStage("review");
    } catch (failure) { if (live()) setErrorKey(polygonRelayErrorKey(failure)); } finally { finish(value); }
  }

  async function sendAuthorized(value, prepared, key) {
    active(value);
    const canonical = selected.current;
    if (!canonical || !immutable(canonical, prepared)) throw new Error("polygon_relay_invalid_authorization");
    if (terminal(canonical)) return;
    if (canonical.status !== "authorized") throw new Error("polygon_relay_invalid_authorization");
    updateMarker(key, canonical, "submitting");
    const sent = await value.scope.wait(() => writePolygonRelay("submit", { paymentId: prepared.paymentId }, { signal: value.scope.signal })); active(value);
    if (!immutable(prepared, sent)) throw new Error("polygon_relay_invalid_authorization");
    adopt(sent, key); if (terminal(sent)) setRevision(number => number + 1);
  }
  async function confirm() {
    const local = previewRef.current;
    if (!currentDisplay || !connected || !local || operation.current) return;
    if (selected.current && (selected.current.status !== "prepared" || selected.current.paymentId !== local.requestId)) return;
    const value = begin(); if (!value) return; value.signing = true;
    let key = "", prepared = /** @type {ReturnType<typeof polygonRelayView>} */ (null), prompt = false, authorizing = false;
    try {
      const capturedSigner = signerGeneration, provider = reown.getCompanyPaymentProvider();
      const assertSigner = () => { active(value); if (signer.current.generation !== capturedSigner || !signer.current.connected || reown.getCompanyPaymentProvider() !== provider) throw new DOMException("Aborted", "AbortError"); };
      const assertUnsigned = () => {
        assertSigner();
        if (selected.current?.paymentId === local.requestId && selected.current.status !== "prepared") throw new DOMException("Aborted", "AbortError");
      };
      await enabled(value); await identity(value, provider); key = await value.scope.wait(() => keyPromise); assertSigner();
      if (!key) throw new Error("polygon_relay_recovery_unavailable");
      if (readRecovery(key, wallet)) throw new Error("polygon_relay_pending_exists");
      const locks = globalThis.navigator?.locks; if (!locks?.request) throw new Error("polygon_relay_recovery_unavailable");
      await locks.request(`mindbliss:polygon-relay:${wallet}`, { mode: "exclusive", ifAvailable: true }, async lock => {
        if (!lock || readRecovery(key, wallet)) throw new Error("polygon_relay_pending_exists"); assertSigner();
        prepared = await value.scope.wait(() => writePolygonRelay("prepare", { requestId: local.requestId, amountAtomic: local.amountAtomic }, { signal: value.scope.signal })); assertSigner();
        if (!polygonRelayView(prepared) || prepared.paymentId !== local.requestId || prepared.walletAddress !== wallet
          || prepared.amountAtomic !== local.amountAtomic) throw new Error("polygon_relay_invalid_authorization");
        const latest = await value.scope.wait(() => readPolygonRelayStatus(prepared.paymentId, { signal: value.scope.signal })); assertSigner();
        if (!immutable(prepared, latest)) throw new Error("polygon_relay_invalid_authorization");
        const canonical = adopt(latest, key); if (canonical.status !== "prepared") return;
        assertUnsigned();
        const signed = await value.scope.wait(() => signPolygonRelay(prepared, { request(input) {
          assertUnsigned();
          if (input.method === "eth_signTypedData_v4") { if (prompt) throw new Error("polygon_relay_invalid_authorization"); updateMarker(key, prepared, "signing"); prompt = true; }
          return provider.request(input);
        } }, wallet, assertUnsigned)); assertUnsigned();
        if (signed.paymentId !== prepared.paymentId) throw new Error("polygon_relay_invalid_authorization");
        updateMarker(key, prepared, "authorizing"); authorizing = true;
        const authorized = await value.scope.wait(() => writePolygonRelay("authorize", signed, { signal: value.scope.signal })); assertSigner();
        if (!immutable(prepared, authorized)) throw new Error("polygon_relay_invalid_authorization");
        const accepted = adopt(authorized, key);
        if (accepted.status === "authorized") { updateMarker(key, accepted, "authorized"); await sendAuthorized(value, accepted, key); }
      });
    } catch (failure) {
      if (prepared && selected.current?.paymentId === prepared.paymentId && terminal(selected.current) && immutable(prepared, selected.current)) {
        clearRecovery(key, prepared.paymentId, wallet); if (live()) { markerRef.current = null; setRecovery(null); setErrorKey(""); }
      } else if (prepared && prompt && !authorizing && (failure?.code === 4001 || failure?.code === "ACTION_REJECTED")) {
        clearRecovery(key, prepared.paymentId, wallet); if (live()) { markerRef.current = null; setRecovery(null); setStage("review"); }
      } else if (prepared && (prompt || authorizing)) {
        try { updateMarker(key, prepared, "ambiguous"); } catch { /* retain the earlier marker */ }
        if (live()) setStage("status");
      }
      if (live() && !terminal(selected.current)) setErrorKey(prepared && (prompt || authorizing) && failure?.code !== 4001 && failure?.code !== "ACTION_REJECTED"
        && (!failure?.status || failure.status >= 500) && failure?.name !== "AbortError" ? "walletTransfer.ambiguous" : polygonRelayErrorKey(failure));
    } finally { finish(value); }
  }
  async function submitAuthorized() {
    const current = selected.current; if (!verified || !current || operation.current) return;
    const value = begin(); if (!value) return; let key = "";
    try {
      await enabled(value); key = await value.scope.wait(() => keyPromise);
      const latest = await value.scope.wait(() => readPolygonRelayStatus(current.paymentId, { signal: value.scope.signal })); active(value);
      if (!immutable(current, latest)) throw new Error("polygon_relay_invalid_authorization");
      const canonical = adopt(latest, key); if (canonical.status === "authorized") await sendAuthorized(value, canonical, key);
    } catch (failure) {
      if (readRecovery(key, wallet)) { try { updateMarker(key, current, "ambiguous"); } catch { /* keep prior marker */ } }
      if (live()) setErrorKey(polygonRelayErrorKey(failure));
    } finally { finish(value); }
  }
  /** @param {{signal?: AbortSignal}} [options] */
  async function verifyPayment({ signal } = {}) {
    const current = selected.current; if (!verified || !current || signal?.aborted) return;
    const value = begin(); if (!value) return;
    const abort = () => value.scope.cancel(); signal?.addEventListener("abort", abort, { once: true });
    try {
      const key = await value.scope.wait(() => keyPromise);
      let result = await value.scope.wait(() => readPolygonRelayStatus(current.paymentId, { signal: value.scope.signal })); active(value);
      if (!immutable(current, result)) throw new Error("polygon_relay_invalid_authorization");
      const expiredPreparation = result.status === "prepared" && Date.parse(result.expiresAt) <= Date.now();
      if (!terminal(result) && (proofStates.has(result.status) || expiredPreparation)) {
        result = await value.scope.wait(() => writePolygonRelay("verify", { paymentId: result.paymentId }, { signal: value.scope.signal })); active(value);
        if (!immutable(current, result)) throw new Error("polygon_relay_invalid_authorization");
      }
      adopt(result, key); if (terminal(result)) setRevision(number => number + 1);
    } catch (failure) { if (live() && !value.scope.signal.aborted) setErrorKey(polygonRelayErrorKey(failure)); }
    finally { signal?.removeEventListener("abort", abort); finish(value); }
  }
  verifier.current = verifyPayment;
  useEffect(() => {
    if (!verified || !payment || terminal(payment) || payment.status === "reconciliation_required" || (!recovery && !proofStates.has(payment.status)) || typeof document === "undefined") return undefined;
    const key = `${generation}:${wallet}:${payment.paymentId}`; if (poll.current.key !== key) poll.current = { key, deadline: Date.now() + 15 * 60_000, attempts: 0 };
    let stopped = false, timer, request;
    const eligible = () => !stopped && live() && poll.current.key === key && selected.current?.paymentId === payment.paymentId && !terminal(selected.current) && Date.now() < poll.current.deadline;
    const schedule = () => {
      clearTimeout(timer);
      if (!eligible() || document.visibilityState !== "visible") return;
      const delay = receiptPollDelays[Math.min(poll.current.attempts, receiptPollDelays.length - 1)];
      timer = setTimeout(check, Math.min(delay, poll.current.deadline - Date.now())); timer?.unref?.();
    };
    const check = async () => {
      if (!eligible() || document.visibilityState !== "visible") return;
      if (busyRef.current || operation.current) { schedule(); return; }
      request = new AbortController();
      try { await verifier.current({ signal: request.signal }); }
      finally {
        request = null;
        if (poll.current.key === key) poll.current.attempts++;
        schedule();
      }
    };
    const visibility = () => { if (document.visibilityState === "visible") schedule(); else { clearTimeout(timer); request?.abort(); } };
    document.addEventListener("visibilitychange", visibility); schedule();
    return () => { stopped = true; clearTimeout(timer); request?.abort(); document.removeEventListener("visibilitychange", visibility); };
  }, [verified, generation, wallet, live, payment?.paymentId, payment?.status, recovery?.phase]);

  async function connect() {
    const value = begin(); if (!value) return;
    try {
      if (!reown.isConnected || (!reown.isLinked && reown.linkStatus === "linked")) await value.scope.wait(() => reown.connectWallet());
      else if (!reown.isLinked && reown.linkStatus === "unlinked") await value.scope.wait(() => reown.linkWallet()); active(value);
    } catch (failure) { if (live()) setErrorKey(polygonRelayErrorKey(failure)); } finally { finish(value); }
  }
  async function refresh() {
    if (!live() || operation.current) return;
    if (!verified && ["error", "unavailable"].includes(reown.linkStatus) && typeof reown.refreshLink === "function") {
      const value = begin(); if (!value) return;
      try {
        await value.scope.wait(() => reown.refreshLink()); active(value);
        setRevision(number => number + 1);
      } catch (failure) { if (live() && !value.scope.signal.aborted) setErrorKey(polygonRelayErrorKey(failure)); }
      finally { finish(value); }
      return;
    }
    void sharedBalance.refresh();
    setRevision(number => number + 1);
  }
  async function switchNetwork() {
    const value = begin(); if (!value) return;
    try {
      await value.scope.wait(() => reown.switchCompanyPaymentNetwork(137)); active(value);
      // AppKit's React switch wrapper may swallow a rejected network change.
      // The account's actual provider must acknowledge Polygon before clearing the CTA.
      await identity(value, reown.getCompanyPaymentProvider());
    }
    catch (failure) { if (live()) setErrorKey(polygonRelayErrorKey(failure)); } finally { finish(value); }
  }
  function newPayment() {
    if (!live() || operation.current || (selected.current && !terminal(selected.current)) || markerRef.current) return;
    selected.current = null; previewRef.current = null; setPayment(null); setPreview(null); setStage("form"); setRecovery(null); setErrorKey(""); edited.current = false;
    setAmountState(balance.wallet === wallet && balance.balanceAtomic !== null ? formatPersonalCompanyPaymentAmount(balance.balanceAtomic) : "");
    void sharedBalance.refresh(); setRevision(number => number + 1);
  }
  async function resume() {
    const current = selected.current;
    if (!connected || current?.status !== "prepared" || operation.current || balance.balanceAtomic === null) return;
    const value = begin(); if (!value) return;
    try {
      const key = await value.scope.wait(() => keyPromise); active(value);
      if (readRecovery(key, wallet)) throw new Error("polygon_relay_pending_exists");
      const next = Object.freeze({ requestId: current.paymentId, walletAddress: wallet, amountAtomic: current.amountAtomic,
        reviewedBalanceAtomic: balance.balanceAtomic, ...POLYGON_COMPANY_PAYMENT });
      previewRef.current = next; setPreview(next); setAmountState(formatPersonalCompanyPaymentAmount(current.amountAtomic)); setStage("review");
    } catch (failure) { if (live()) setErrorKey(polygonRelayErrorKey(failure)); } finally { finish(value); }
  }
  async function abandon() {
    const current = selected.current;
    if (!verified || current?.status !== "prepared" || operation.current || markerRef.current) return;
    const value = begin(); if (!value) return;
    try {
      const key = await value.scope.wait(() => keyPromise); active(value);
      const locks = globalThis.navigator?.locks;
      if (!locks?.request) throw new Error("polygon_relay_recovery_unavailable");
      await locks.request(`mindbliss:polygon-relay:${wallet}`, { mode: "exclusive", ifAvailable: true }, async lock => {
        active(value);
        if (!lock || readRecovery(key, wallet)) throw new Error("polygon_relay_pending_exists");
        const latest = await value.scope.wait(() => readPolygonRelayStatus(current.paymentId, { signal: value.scope.signal })); active(value);
        if (!immutable(current, latest)) throw new Error("polygon_relay_invalid_authorization");
        adopt(latest, key);
        if (latest.status !== "prepared") { if (!terminal(latest)) setErrorKey("walletTransfer.pending"); return; }
        const result = await value.scope.wait(() => writePolygonRelay("abandon", { paymentId: current.paymentId }, { signal: value.scope.signal })); active(value);
        if (!immutable(current, result) || result.status !== "expired" || result.failureReason !== "preparation_abandoned"
          || result.userOperationHash !== null || result.transactionHash !== null) throw new Error("polygon_relay_invalid_authorization");
        adopt(result, key);
        selected.current = null; previewRef.current = null; setPayment(null); setPreview(null); setStage("form"); setErrorKey("");
        setRevision(number => number + 1);
      });
    } catch (failure) { if (live()) setErrorKey(polygonRelayErrorKey(failure)); } finally { finish(value); }
  }
  return { wallet, verified, connected: currentDisplay && connected, restoring: currentDisplay && reown.isRestoring === true,
    needsVerification: currentDisplay && reown.isConnected === true && reown.linkStatus === "unlinked", busy: currentDisplay && busy,
    amount: currentDisplay ? amount : "", setAmount(value) { if (!live() || operation.current) return; edited.current = true; setAmountState(value); setErrorKey(""); },
    balanceAtomic: currentDisplay && balance.wallet === wallet ? balance.balanceAtomic : null, nativeBalanceAtomic: currentDisplay && balance.wallet === wallet ? balance.nativeBalanceAtomic : null,
    loadingBalance: !currentDisplay || balance.loading,
    refreshingBalance: currentDisplay && balance.wallet === wallet && balance.loading && balance.balanceAtomic !== null,
    history: currentDisplay && history.wallet === wallet ? history.payments : [], historyLoading: !currentDisplay || history.loading,
    capabilities: currentDisplay ? capabilities : { loading: true, transferEnabled: false }, transferEnabled: currentDisplay && capabilities.transferEnabled,
    errorKey: currentDisplay ? errorKey || balance.error || history.error || capabilities.error : "", payment: currentDisplay ? payment : null,
    preview: currentDisplay ? preview : null, recovery: currentDisplay ? recovery : null, stage: currentDisplay ? stage : "form",
    review, confirm, submitAuthorized, verifyPayment, connect, switchNetwork, newPayment, resume, abandon,
    async cancelReview() {
      if (!live() || operation.current || markerRef.current) return;
      if (selected.current?.status === "prepared") { await abandon(); return; }
      previewRef.current = null; setPreview(null);
      if (selected.current && unresolved(selected.current)) { setStage("status"); setErrorKey("walletTransfer.pending"); }
      else { setStage("form"); setErrorKey(""); }
    },
    refresh,
    edit() { if (live() && !operation.current && !selected.current && !markerRef.current) setStage("form"); },
    selectHistory(value) {
      const safe = polygonRelayView(value); if (!live() || operation.current || !safe || safe.walletAddress !== wallet) return;
      if (selected.current && selected.current.paymentId !== safe.paymentId && unresolved(selected.current)) { setErrorKey("walletTransfer.pending"); return; }
      const choice = ++historySelection.current;
      void keyPromise.then(key => { if (live() && !operation.current && historySelection.current === choice) { adopt(safe, key); previewRef.current = null; setPreview(null); } })
        .catch(failure => { if (live() && historySelection.current === choice) setErrorKey(polygonRelayErrorKey(failure)); });
    },
  };
}
