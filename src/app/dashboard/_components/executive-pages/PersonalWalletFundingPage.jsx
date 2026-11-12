"use client";

import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReownWallet } from "@/components/reown/ReownContext";
import PersonalWalletBalances from "@/components/wallet/PersonalWalletBalances";
import { useI18n } from "@/i18n/LanguageProvider";
import { personalFundingFailure } from "@/lib/personal-funding-errors.mjs";
import { FUNDING_UUID } from "@/lib/wallet-funding-contract.mjs";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";
import { PersonalFundingForm } from "./WalletFundingForm";
import WalletFundingStatus from "./WalletFundingStatus";
import ResidenceImportantCard from "./ResidenceImportantCard";
import { WalletActionError, WalletAddress, WalletFundingScreen, walletFailureDiagnostic } from "./WalletFundingUI";
import styles from "./wallet-funding.module.css";

export default function PersonalWalletFundingPage() {
  return <PersonalWalletFunding />;
}

export function personalWalletState(reown) {
  if (!reown.configured) return "unavailable";
  if (reown.linkStatus === "loading") return "checking";
  if (reown.linkStatus === "error") return "error";
  if (reown.linkStatus === "linked" && /^0x[0-9a-f]{40}$/i.test(reown.linkedAddress || "")) return "verified";
  if (reown.walletIdentityMismatch) return "disconnected";
  if (reown.isLinking) return "verifying";
  return reown.isConnected && reown.address ? "connected" : "disconnected";
}

export function PersonalWalletFunding() {
  const { t } = useI18n();
  const reown = useReownWallet();
  const owner = personalWalletBalanceSessionKey(useMemberSession());
  const epoch = useRef({ owner, generation: 0 });
  if (epoch.current.owner !== owner) epoch.current = { owner, generation: epoch.current.generation + 1 };
  const generation = epoch.current.generation;
  const mounted = useRef(false), action = useRef(null);
  const [actionError, setActionError] = useState("");
  const [actionDiagnostic, setActionDiagnostic] = useState("");
  const [copyError, setCopyError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [walletRecovery, setWalletRecovery] = useState({ phase: "", address: "" });
  const [selectedReference, setSelectedReference] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState(-1);
  const [statusFocusKey, setStatusFocusKey] = useState(0);
  const clearSelectedStatus = useCallback(() => {
    if (!mounted.current || !owner || epoch.current.generation !== generation || action.current) return;
    setSelectedReference(""); setStatusFocusKey(0);
    setActionError(""); setActionDiagnostic("");
    reown.clearOnrampError?.();
  }, [generation, owner, reown.clearOnrampError]);
  const state = personalWalletState(reown);
  const verified = state === "verified";
  const walletCheckRequired = walletRecovery.phase === "check";
  const activationRequired = walletRecovery.phase === "activate";
  const awaitingBinding = walletRecovery.phase === "ready" && (!verified || walletRecovery.address.toLowerCase() !== reown.linkedAddress.toLowerCase());
  const setupRequired = !verified || walletCheckRequired || activationRequired || awaitingBinding;
  const displayState = verified && setupRequired ? (walletCheckRequired || awaitingBinding ? "checking" : "connected") : state;
  const address = !setupRequired ? reown.linkedAddress : "";
  const busy = actionBusy || checkoutBusy || ["connecting", "linking", "opening"].includes(reown.onrampStatus);
  const live = () => mounted.current && Boolean(owner) && epoch.current.generation === generation;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; action.current = null; };
  }, []);
  useEffect(() => {
    action.current = null; setActionBusy(false); setCheckoutBusy(false); setWalletRecovery({ phase: "", address: "" });
    setActionError(""); setActionDiagnostic(""); setCopyError(""); setSelectedReference(""); setSelectedGeneration(-1); setStatusFocusKey(0);
  }, [owner, generation]);

  async function walletAction(change = false) {
    if (action.current || !live()) return;
    const request = { owner, kind: "wallet" }; action.current = request;
    const current = () => live() && action.current === request;
    setActionBusy(true); setActionError(""); setActionDiagnostic("");
    try {
      if (change) await reown.chooseWallet();
      else if (walletCheckRequired || (state === "error" && !activationRequired)) {
        const checked = await reown.refreshLink();
        if (!current()) return;
        if (!checked || typeof checked !== "object" || !("status" in checked)
          || (checked.status !== "linked" && checked.status !== "unlinked")) throw new Error("wallet_link_unavailable");
        // A backend verification hint only triggers this explicit status read.
        // A canonical linked wallet needs neither a new proof nor SDK login.
        if (checked.status === "linked") {
          if (!("address" in checked) || typeof checked.address !== "string" || !/^0x[0-9a-f]{40}$/i.test(checked.address)) throw new Error("wallet_link_unavailable");
          setWalletRecovery({ phase: "ready", address: checked.address });
        } else setWalletRecovery({ phase: "activate", address: "" });
        reown.clearOnrampError?.();
      }
      else if (!verified || activationRequired) {
        const result = await reown.prepareWallet();
        if (!current()) return;
        if (result?.linked !== true || !/^0x[0-9a-f]{40}$/i.test(result.address || "")) throw new Error("wallet_link_unavailable");
        setWalletRecovery({ phase: "ready", address: result.address });
        reown.clearOnrampError?.();
      }
      else await reown.connectWallet();
    } catch (error) {
      if (current()) {
        setActionError(personalOnrampError(personalFundingFailure(error, "link"), t));
        setActionDiagnostic(walletFailureDiagnostic(error?.reason) || "");
      }
    }
    finally { if (action.current === request) { action.current = null; if (live()) setActionBusy(false); } }
  }

  async function openProvider(input) {
    if (!live() || setupRequired) return { requiresWalletVerification: true };
    if (action.current) return { pending: true };
    const request = { owner, kind: "checkout" }; action.current = request;
    const current = () => live() && action.current === request;
    setCheckoutBusy(true);
    setActionError(""); setActionDiagnostic("");
    try {
      const result = await reown.startOnramp({ ...input, walletAddress: reown.linkedAddress });
      if (!current()) return result;
      if (result && typeof result === "object" && "requiresWalletVerification" in result && result.requiresWalletVerification === true) { setWalletRecovery({ phase: "check", address: "" }); return result; }
      if (result && typeof result === "object" && "opened" in result && result.opened === true && "checkoutReference" in result
        && typeof result.checkoutReference === "string" && FUNDING_UUID.test(result.checkoutReference)) { setSelectedReference(result.checkoutReference); setSelectedGeneration(generation); setStatusFocusKey(0); }
      return result;
    }
    catch (error) {
      if (current() && ["wallet_not_linked", "wallet_funding_wallet_not_linked"].includes(error?.message)) setWalletRecovery({ phase: "check", address: "" });
      throw error;
    }
    finally { if (action.current === request) { action.current = null; if (live()) setCheckoutBusy(false); } }
  }

  function cancelConnection() {
    if (!live() || action.current?.kind === "wallet") return;
    action.current = null;
    reown.cancelOnramp();
    setCheckoutBusy(false);
    setActionBusy(false);
    setActionDiagnostic("");
    setActionError(t("funding.requestCancelled"));
  }

  const statusLabel = { unavailable: "recharge.providerConfiguration", checking: "walletPage.checking", error: "walletPage.checkFailed",
    connected: "funding.activateWallet", verifying: "funding.activatingWallet", verified: "funding.walletVerified", disconnected: "funding.activateWallet" }[displayState];
  const checkingWallet = walletCheckRequired || awaitingBinding || state === "checking" || (state === "error" && !activationRequired);
  const walletActionLabel = actionBusy ? (checkingWallet ? "walletPage.checking" : "funding.activatingWallet")
    : checkingWallet ? "walletPage.retryCheck" : "funding.activateWallet";
  const inlineWalletAction = setupRequired ? <div className={styles.connectionPending} aria-label={t("funding.activateWallet")} aria-busy={busy || state === "checking" || awaitingBinding}>
    <p>{t(checkingWallet ? "walletPage.checkingCopy" : reown.walletIdentityMismatch ? "funding.walletAccountChange" : "funding.activateWalletCopy")}</p>
    <button className="executive-button primary" type="button" disabled={busy || !owner || !reown.configured || awaitingBinding || ["checking", "verifying"].includes(state)} onClick={() => void walletAction()}>
      {actionBusy || state === "checking" ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(walletActionLabel)}
    </button>
  </div> : null;

  return <WalletFundingScreen title={t("walletPage.personalTitle")} subtitle={t("walletPage.personalCopy")}>
    <div className="flex flex-wrap gap-3">
      <Link href="/dashboard/wallet-personal/pay" className="executive-button">{t("companyPayment.title")}</Link>
      <Link href="/dashboard/wallet-personal/requests" className="executive-button">{t("funding.history")}</Link>
    </div>
    <div className={`${styles.flowLayout}${setupRequired ? ` ${styles.setupRequired}` : ""}`} id="personal-wallet">
      <section className={`executive-panel ${styles.formPanel}`} aria-label={t("walletPage.addFundsAction")}>
        <PersonalFundingForm disabled={setupRequired} busy={busy} onContinue={openProvider} onSelectionChange={clearSelectedStatus} destinationAddress={address} walletAction={inlineWalletAction} />
        {busy ? <div className={styles.connectionPending} role="status"><p>{t(setupRequired && actionBusy ? "funding.activatingWallet" : "funding.connectionPending")}</p>{!actionBusy ? <button className="executive-button" type="button" onClick={cancelConnection}>{t("funding.cancelConnection")}</button> : null}</div> : null}
        <WalletActionError diagnostic={actionDiagnostic} message={actionError || (reown.onrampStatus === "error" ? personalOnrampError(reown.onrampError, t) : reown.linkError ? personalOnrampError(reown.linkError, t) : "")} />
      </section>
      <aside className={styles.details} aria-label={t("funding.destinationDetails")}>
        <ResidenceImportantCard />
        {!setupRequired ? <PersonalWalletBalances expectedAddress={address} /> : null}
        <section className={styles.detailCard}>
          <div className={styles.stateHeading}>{!setupRequired ? <CheckCircle2 size={19} aria-hidden="true" /> : <ShieldCheck size={19} aria-hidden="true" />}
            <h2>{t(setupRequired && actionBusy ? "funding.activatingWallet" : statusLabel)}</h2></div>
          <p className={styles.hint}>{t(!setupRequired ? "walletPage.simpleLinkedCopy" : reown.walletIdentityMismatch ? "funding.walletAccountChange"
            : displayState === "error" ? (reown.linkError === "session" ? "walletPage.checkSession" : "walletPage.checkUnavailable") : displayState === "checking" ? "walletPage.checkingCopy" : "funding.activateWalletCopy")}</p>
          <WalletAddress address={address} label={t("walletPage.personalWalletLabel")} loading={displayState === "checking"}
            emptyLabel={t(displayState === "checking" ? "walletPage.destinationLoading" : "funding.noPersonalAddress")} onCopyError={() => setCopyError(t("walletPage.administrativeCopyFailed"))} />
          {!["verified", "checking", "verifying"].includes(displayState) ? <button className="executive-button primary" type="button" disabled={busy || !owner || !reown.configured} onClick={() => void walletAction()}>
            {actionBusy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : state === "error" ? <RefreshCw size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
            {t(actionBusy ? "funding.activatingWallet" : state === "error" ? "walletPage.retryCheck" : "funding.activateWallet")}
          </button> : null}
          {!verified && state === "connected" ? <button className="executive-button" type="button" disabled={busy} onClick={() => void walletAction(true)}>{t("funding.chooseWallet")}</button> : null}
          <WalletActionError message={copyError} />
        </section>
      </aside>
    </div>
    {owner && selectedGeneration === generation && selectedReference ? <WalletFundingStatus walletKind="personal" checkoutReference={selectedReference} focusKey={statusFocusKey} /> : null}
  </WalletFundingScreen>;
}

export function personalOnrampError(code, t) {
  const keys = { session: "recharge.providerSession", configuration: "recharge.providerConfiguration", mismatch: "recharge.providerMismatch",
    rejected: "recharge.providerRejected", connection: "recharge.providerConnection", link_unavailable: "funding.personalLinkFailed",
    unavailable: "funding.personalLinkFailed", identity: "funding.identityUnavailable", rate_limited: "funding.rateLimited",
    method: "funding.methodUnavailable", intent: "funding.requestRegistrationFailed", cancelled: "funding.requestCancelled", origin: "funding.sessionOriginFailed",
    provider: "funding.checkoutUnavailable", valuation: "funding.speiTemporarilyUnavailable", connection_timeout: "funding.connectionTimeout", network_changed: "funding.networkChanged" };
  return t(keys[code] || "funding.checkoutUnavailable");
}
