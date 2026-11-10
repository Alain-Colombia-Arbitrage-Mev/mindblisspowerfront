"use client";

import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useReownWallet } from "@/components/reown/ReownContext";
import { useI18n } from "@/i18n/LanguageProvider";
import { personalFundingFailure } from "@/lib/personal-funding-errors.mjs";
import { FUNDING_UUID } from "@/lib/wallet-funding-contract.mjs";
import { PersonalFundingForm } from "./WalletFundingForm";
import WalletFundingHistory from "./WalletFundingHistory";
import WalletFundingStatus from "./WalletFundingStatus";
import { WalletActionError, WalletAddress, WalletFundingScreen, walletFailureDiagnostic } from "./WalletFundingUI";
import styles from "./wallet-funding.module.css";

const ReownProvider = dynamic(() => import("@/components/reown/ReownProvider"), {
  ssr: false,
  loading: () => <div className="executive-panel" role="status"><Loader2 className="animate-spin" aria-label="Reown" /></div>,
});

export default function PersonalWalletFundingPage() {
  return <ReownProvider><PersonalWalletFunding /></ReownProvider>;
}

export function personalWalletState(reown) {
  if (!reown.configured) return "unavailable";
  if (reown.linkStatus === "loading") return "checking";
  if (reown.linkStatus === "error") return "error";
  if (reown.linkStatus === "linked" && /^0x[0-9a-f]{40}$/i.test(reown.linkedAddress || "")) return "verified";
  if (reown.isLinking) return "verifying";
  return reown.isConnected && reown.address ? "connected" : "disconnected";
}

export function PersonalWalletFunding() {
  const { t } = useI18n();
  const reown = useReownWallet();
  const [actionError, setActionError] = useState("");
  const [actionDiagnostic, setActionDiagnostic] = useState("");
  const [copyError, setCopyError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedReference, setSelectedReference] = useState("");
  const [statusFocusKey, setStatusFocusKey] = useState(0);
  const clearSelectedStatus = useCallback(() => { setSelectedReference(""); setStatusFocusKey(0); }, []);
  const state = personalWalletState(reown);
  const verified = state === "verified";
  const address = reown.linkedAddress || reown.address || "";
  const busy = actionBusy || ["connecting", "linking", "opening"].includes(reown.onrampStatus);

  async function walletAction() {
    if (actionBusy) return;
    setActionBusy(true); setActionError(""); setActionDiagnostic("");
    try {
      if (state === "error") await reown.refreshLink();
      else if (state === "connected") await reown.linkWallet();
      else await reown.openConnect();
    } catch (error) {
      setActionError(personalOnrampError(personalFundingFailure(error, "link"), t));
      setActionDiagnostic(walletFailureDiagnostic(error?.reason) || "");
    }
    finally { setActionBusy(false); }
  }

  async function openProvider(input) {
    setActionError(""); setActionDiagnostic("");
    const result = await reown.startOnramp({ walletAddress: reown.linkedAddress, ...input });
    if (result && typeof result === "object" && "opened" in result && result.opened === true && "checkoutReference" in result
      && typeof result.checkoutReference === "string" && FUNDING_UUID.test(result.checkoutReference)) { setSelectedReference(result.checkoutReference); setStatusFocusKey(0); }
    return result;
  }

  function selectStatus(reference) { setSelectedReference(reference); setStatusFocusKey(value => value + 1); }

  const statusLabel = { unavailable: "recharge.providerConfiguration", checking: "walletPage.checking", error: "walletPage.checkFailed",
    connected: "walletPage.connectedPending", verifying: "funding.verifyingWallet", verified: "funding.walletVerified", disconnected: "funding.connectWallet" }[state];

  return <WalletFundingScreen title={t("walletPage.personalTitle")} subtitle={t("walletPage.personalCopy")} provider={t("funding.personalEnvironment")}>
    <div className={`${styles.flowLayout}${!verified ? ` ${styles.setupRequired}` : ""}`} id="personal-wallet">
      <section className={`executive-panel ${styles.formPanel}`} aria-label={t("walletPage.addFundsAction")}>
        <PersonalFundingForm disabled={!verified} busy={busy} onContinue={openProvider} onSelectionChange={clearSelectedStatus} destinationAddress={verified ? reown.linkedAddress : ""} />
        {!verified ? <p className={styles.hint}>{t("funding.verifyBeforeFunding")}</p> : null}
        <WalletActionError diagnostic={actionDiagnostic} message={actionError || (reown.onrampStatus === "error" ? personalOnrampError(reown.onrampError, t) : reown.linkError ? personalOnrampError(reown.linkError, t) : "")} />
      </section>
      <aside className={styles.details} aria-label={t("funding.destinationDetails")}>
        <section className={styles.detailCard}>
          <div className={styles.stateHeading}>{verified ? <CheckCircle2 size={19} aria-hidden="true" /> : <ShieldCheck size={19} aria-hidden="true" />}
            <h2>{t(statusLabel)}</h2></div>
          <p className={styles.hint}>{t(verified ? "walletPage.simpleLinkedCopy" : state === "connected" || state === "verifying" ? "walletPage.connectedPendingCopy"
            : state === "error" ? (reown.linkError === "session" ? "walletPage.checkSession" : "walletPage.checkUnavailable") : state === "checking" ? "walletPage.checkingCopy" : "funding.connectWalletCopy")}</p>
          <WalletAddress address={address} label={t("walletPage.personalWalletLabel")} loading={state === "checking"}
            emptyLabel={t(state === "checking" ? "walletPage.destinationLoading" : "funding.noPersonalAddress")} onCopyError={() => setCopyError(t("walletPage.administrativeCopyFailed"))} />
          {!["verified", "checking", "verifying"].includes(state) ? <button className="executive-button primary" type="button" disabled={busy || !reown.configured} onClick={() => void walletAction()}>
            {actionBusy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : state === "error" ? <RefreshCw size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
            {t(state === "error" ? "walletPage.retryCheck" : state === "connected" ? "funding.verifyWallet" : "funding.connectWallet")}
          </button> : null}
          <WalletActionError message={copyError} />
        </section>
      </aside>
    </div>
    {selectedReference ? <WalletFundingStatus walletKind="personal" checkoutReference={selectedReference} focusKey={statusFocusKey} /> : null}
    <section className="executive-panel"><WalletFundingHistory walletKind="personal" refreshKey={reown.fundingRevision} onSelectRequest={selectStatus} /></section>
  </WalletFundingScreen>;
}

export function personalOnrampError(code, t) {
  const keys = { session: "recharge.providerSession", configuration: "recharge.providerConfiguration", mismatch: "recharge.providerMismatch",
    rejected: "recharge.providerRejected", connection: "recharge.providerConnection", link_unavailable: "funding.personalLinkFailed",
    unavailable: "funding.personalLinkFailed", identity: "funding.identityUnavailable", rate_limited: "funding.rateLimited",
    method: "funding.methodUnavailable", intent: "funding.requestRegistrationFailed", cancelled: "funding.requestCancelled", origin: "funding.sessionOriginFailed",
    provider: "funding.checkoutUnavailable" };
  return t(keys[code] || "funding.checkoutUnavailable");
}
