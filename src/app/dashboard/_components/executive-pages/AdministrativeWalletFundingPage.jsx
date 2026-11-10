"use client";

import { Building2, CheckCircle2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { ensureAdministrativeWallet, readAdministrativeWallet } from "@/lib/administrative-wallet.mjs";
import { startAdministrativeMeldOnramp } from "@/lib/administrative-onramp-client.mjs";
import { AdministrativeSandboxFundingForm } from "./WalletFundingForm";
import WalletFundingHistory from "./WalletFundingHistory";
import WalletFundingStatus from "./WalletFundingStatus";
import { administrativeFundingError, ProviderNote, WalletActionError, WalletAddress, WalletFundingScreen } from "./WalletFundingUI";
import styles from "./wallet-funding.module.css";

const EMPTY_WALLET = { status: "loading", address: "", checkoutReference: "", assignedAt: "", errorCode: "" };

export default function AdministrativeWalletFundingPage({ environment = "production" }) {
  const { t } = useI18n();
  const { wallet, load } = useAdministrativeWallet();
  const [providerError, setProviderError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [selectedReference, setSelectedReference] = useState("");
  const [statusFocusKey, setStatusFocusKey] = useState(0);
  const clearSelectionError = useCallback(() => { setProviderError(""); setSelectedReference(""); setStatusFocusKey(0); }, []);
  const checkoutRequest = useRef(null);
  const assigned = wallet.status === "assigned";
  const sandbox = environment === "sandbox";
  useEffect(() => () => checkoutRequest.current?.abort(), []);

  async function openProvider(input) {
    if (!sandbox || checkoutRequest.current || !assigned) return;
    const controller = new AbortController(); checkoutRequest.current = controller;
    setBusy(true); setProviderError("");
    try {
      const session = await startAdministrativeMeldOnramp({ address: wallet.address, ...input }, { signal: controller.signal });
      if (!controller.signal.aborted) { setSelectedReference(session.checkoutReference); setStatusFocusKey(0); }
    }
    catch (error) { if (!controller.signal.aborted) setProviderError(administrativeFundingError(error, t)); throw error; }
    finally {
      if (checkoutRequest.current === controller) checkoutRequest.current = null;
      if (!controller.signal.aborted) { setBusy(false); setHistoryRevision(value => value + 1); }
    }
  }

  function selectStatus(reference) { setSelectedReference(reference); setStatusFocusKey(value => value + 1); }

  return <WalletFundingScreen title={t("walletPage.administrativeTitle")} subtitle={t("walletPage.administrativeCopy")}
    provider="MELD">
    <div className={styles.sandboxNotice} role="status"><Building2 size={20} aria-hidden="true" /><div>
      <strong>{t(sandbox ? "funding.sandbox" : "funding.sandboxConfiguration")}</strong>
      {sandbox ? <p>{t("funding.sandboxNoticeShort")}</p> : null}</div></div>
    <div className={styles.flowLayout} id="administrative-wallet">
      <section className={`executive-panel ${styles.formPanel}`} aria-label={t("walletPage.addFundsAction")}>
        {sandbox ? <AdministrativeSandboxFundingForm disabled={!assigned} busy={busy} onContinue={openProvider} onSelectionChange={clearSelectionError} destinationAddress={assigned ? wallet.address : ""} /> : null}
        <WalletActionError message={providerError} />
      </section>
      <aside className={styles.details} aria-label={t("funding.destinationDetails")}>
        <section className={styles.detailCard}><div className={styles.stateHeading}><CheckCircle2 size={19} aria-hidden="true" /><h2>{t(assigned ? "walletPage.administrativeReady" : wallet.status === "error" ? "walletPage.administrativeLoadError" : wallet.status === "exhausted" ? "walletPage.administrativeUnavailable" : "walletPage.administrativeAssigning")}</h2></div>
          <WalletAddress address={assigned ? wallet.address : ""} label={t("walletPage.administrativeAddress")} loading={wallet.status === "loading"}
            emptyLabel={t(wallet.status === "exhausted" ? "walletPage.administrativeExhaustedCopy" : wallet.status === "error" ? "walletPage.destinationUnavailable" : "walletPage.administrativeAssigning")}
            onCopyError={() => setCopyError(t("walletPage.administrativeCopyFailed"))} />
          {wallet.status === "error" ? <button className="executive-button" type="button" onClick={() => void load()}><RefreshCw size={16} aria-hidden="true" />{t("walletPage.retry")}</button> : null}
          <WalletActionError message={copyError} />
          <ProviderNote>{t("walletPage.administrativeSeparation")}</ProviderNote>
        </section>
      </aside>
    </div>
    {sandbox && selectedReference ? <WalletFundingStatus walletKind="administrative" checkoutReference={selectedReference} focusKey={statusFocusKey} /> : null}
    {sandbox ? <section className="executive-panel"><WalletFundingHistory walletKind="administrative" refreshKey={historyRevision} onSelectRequest={selectStatus} /></section> : null}
  </WalletFundingScreen>;
}

function useAdministrativeWallet() {
  const [wallet, setWallet] = useState(EMPTY_WALLET);
  const load = useCallback(async signal => {
    setWallet(current => ({ ...current, status: "loading", errorCode: "" }));
    try {
      let next = await readAdministrativeWallet({ signal });
      if (next.status === "pending") next = await ensureAdministrativeWallet({ signal });
      if (!signal?.aborted) {
        setWallet({ ...EMPTY_WALLET, ...next, errorCode: "" });
        if (next.status === "assigned") window.dispatchEvent(new CustomEvent("vp:administrative-wallet-assigned"));
      }
    } catch (error) { if (error?.name !== "AbortError") setWallet({ ...EMPTY_WALLET, status: "error", errorCode: error?.code || "administrative_wallet_unavailable" }); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  return { wallet, load };
}
