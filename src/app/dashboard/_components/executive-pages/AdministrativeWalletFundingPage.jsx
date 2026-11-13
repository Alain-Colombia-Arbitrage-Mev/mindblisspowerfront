"use client";

import { ArrowDownToLine, ArrowUpRight, Building2, CheckCircle2, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { ensureAdministrativeWallet, readAdministrativeWallet } from "@/lib/administrative-wallet.mjs";
import { startAdministrativeMeldOnramp } from "@/lib/administrative-onramp-client.mjs";
import { administrativeCheckoutReturn } from "@/lib/administrative-checkout-return.mjs";
import { meldCheckoutReturn } from "@/lib/administrative-meld-checkout-contract.mjs";
import { readAdministrativeMeldCheckoutCapabilities, startAdministrativeMeldCheckout } from "@/lib/administrative-meld-checkout-client.mjs";
import { useMemberSession } from "@/lib/member-session-context";
import { walletFundingOwnerKey } from "@/lib/wallet-funding-owner.mjs";
import { AdministrativeSandboxFundingForm } from "./WalletFundingForm";
import WalletFundingHistory from "./WalletFundingHistory";
import WalletFundingStatus from "./WalletFundingStatus";
import AdministrativeMeldCheckoutActivity from "./AdministrativeMeldCheckoutActivity";
import AdministrativeWalletOperations from "./AdministrativeWalletOperations";
import { administrativeFundingError, ProviderNote, WalletActionError, WalletAddress, WalletFundingScreen } from "./WalletFundingUI";
import styles from "./wallet-funding.module.css";

const EMPTY_WALLET = { status: "loading", address: "", checkoutReference: "", assignedAt: "", errorCode: "" };

export default function AdministrativeWalletFundingPage({ environment = "production" }) {
  const owner = walletFundingOwnerKey(useMemberSession());
  return owner ? <AdministrativeWalletFundingView key={owner} environment={environment} /> : null;
}

/** A native session change remounts the complete form and cancels its old reads/writes. */
export function AdministrativeWalletFundingView({ environment }) {
  const { t } = useI18n();
  const { wallet, load } = useAdministrativeWallet();
  const [providerError, setProviderError] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [selectedReference, setSelectedReference] = useState("");
  const [statusFocusKey, setStatusFocusKey] = useState(0);
  const [checkoutCapability, setCheckoutCapability] = useState({ status: "loading", configured: false });
  const [capabilityRevision, setCapabilityRevision] = useState(0);
  const [preparedCheckout, setPreparedCheckout] = useState("");
  const [generalReference, setGeneralReference] = useState("");
  const [showGeneralActivity, setShowGeneralActivity] = useState(false);
  const [generalRevision, setGeneralRevision] = useState(0);
  const clearSelectionError = useCallback(() => { setProviderError(""); setSelectedReference(""); setStatusFocusKey(0); setPreparedCheckout(""); setGeneralReference(""); }, []);
  const checkoutRequest = useRef(null);
  const mounted = useRef(false);
  const liveCheckoutCapability = useRef(false);
  const handledAnchor = useRef("");
  liveCheckoutCapability.current = checkoutCapability.status === "ready" && checkoutCapability.configured === true;
  const assigned = wallet.status === "assigned";
  const sandbox = environment === "sandbox";
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; checkoutRequest.current?.abort(); }; }, []);
  useEffect(() => {
    if (new URLSearchParams(window.location?.search).has("meldCheckoutReference")) return;
    const reference = administrativeCheckoutReturn(window.location?.search);
    if (reference) { setSelectedReference(reference); setStatusFocusKey(1); }
  }, []);
  useEffect(() => {
    if (!sandbox) return undefined;
    const controller = new AbortController();
    setCheckoutCapability({ status: "loading", configured: false });
    readAdministrativeMeldCheckoutCapabilities({ signal: controller.signal }).then(value => {
      if (mounted.current && !controller.signal.aborted) setCheckoutCapability({ status: "ready", configured: value.configured });
    }).catch(() => { if (mounted.current && !controller.signal.aborted) setCheckoutCapability({ status: "error", configured: false }); });
    return () => controller.abort();
  }, [sandbox, capabilityRevision]);
  useEffect(() => {
    if (!sandbox || checkoutCapability.status !== "ready" || !checkoutCapability.configured || !assigned) return;
    const reference = meldCheckoutReturn(window.location?.search);
    if (reference) { setGeneralReference(reference); setShowGeneralActivity(true); }
  }, [sandbox, checkoutCapability.status, checkoutCapability.configured, assigned]);
  useEffect(() => {
    if (!sandbox || wallet.status === "loading" || !mounted.current || typeof document === "undefined") return;
    const hash = window.location?.hash;
    if (!["#administrative-wallet", "#administrative-send", "#administrative-offramp", "#administrative-signing"].includes(hash) || handledAnchor.current === hash) return;
    const target = document.getElementById(hash.slice(1));
    if (target) { handledAnchor.current = hash; target.scrollIntoView({ block: "start", behavior: "auto" }); target.focus({ preventScroll: true }); }
  }, [sandbox, wallet.status]);

  async function openProvider(input) {
    if (!mounted.current || !sandbox || checkoutRequest.current || !assigned) return;
    const controller = new AbortController(); checkoutRequest.current = controller;
    setBusy(true); setProviderError("");
    try {
      const session = await startAdministrativeMeldOnramp({ ...input, address: wallet.address }, { signal: controller.signal });
      if (mounted.current && !controller.signal.aborted) { setSelectedReference(session.checkoutReference); setStatusFocusKey(0); }
    }
    catch (error) { if (mounted.current && !controller.signal.aborted) setProviderError(administrativeFundingError(error, t)); throw error; }
    finally {
      if (checkoutRequest.current === controller) checkoutRequest.current = null;
      if (mounted.current && !controller.signal.aborted) { setBusy(false); setHistoryRevision(value => value + 1); }
    }
  }

  function selectStatus(reference) { setSelectedReference(reference); setStatusFocusKey(value => value + 1); }
  async function openGeneralCheckout(input) {
    if (!mounted.current || !sandbox || !assigned || checkoutRequest.current || !liveCheckoutCapability.current) return;
    const controller = new AbortController(); checkoutRequest.current = controller;
    setBusy(true); setProviderError(""); setPreparedCheckout(""); setGeneralReference("");
    try {
      const result = await startAdministrativeMeldCheckout({ requestId: input.requestId, country: input.country, sourceCurrencyCode: input.sourceCurrencyCode, amount: input.amount },
        { expectedAddress: wallet.address, signal: controller.signal });
      if (mounted.current && !controller.signal.aborted) setPreparedCheckout(result.checkoutReference);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        if (error?.message === "wallet_funding_unconfigured") { liveCheckoutCapability.current = false; setCheckoutCapability({ status: "ready", configured: false }); setShowGeneralActivity(false); }
        setProviderError(error?.message === "wallet_funding_unconfigured" ? t("funding.meldCheckoutConfiguration") : administrativeFundingError(error, t));
      }
      throw error;
    } finally {
      if (checkoutRequest.current === controller) checkoutRequest.current = null;
      if (mounted.current && !controller.signal.aborted) { setBusy(false); setGeneralRevision(value => value + 1); }
    }
  }

  return <WalletFundingScreen title={t("walletPage.administrativeTitle")} subtitle={t("walletPage.administrativeCopy")}
    provider="MELD">
    <div className={styles.sandboxNotice} role="status"><Building2 size={20} aria-hidden="true" /><div>
      <strong>{t(sandbox ? "funding.sandbox" : "funding.sandboxConfiguration")}</strong>
      {sandbox ? <p>{t("funding.sandboxNoticeShort")}</p> : null}</div></div>
    {sandbox ? <nav className={styles.actionNavigation} aria-label={t("administrativeSigning.actionsLabel")}>
      <a href="#administrative-wallet"><Plus size={20} aria-hidden="true" /><span>{t("administrativeSigning.fundingAction")}</span></a>
      <a href="#administrative-send"><ArrowUpRight size={20} aria-hidden="true" /><span>{t("administrativeSigning.sendAction")}</span></a>
      <a href="#administrative-offramp"><ArrowDownToLine size={20} aria-hidden="true" /><span>{t("administrativeSigning.withdrawAction")}</span></a>
    </nav> : null}
    <div className={styles.flowLayout} id="administrative-wallet" tabIndex={-1}>
      <section className={`executive-panel ${styles.formPanel}`} aria-label={t("walletPage.addFundsAction")}>
        {sandbox ? <AdministrativeSandboxFundingForm disabled={!assigned} busy={busy} onContinue={openProvider} onSelectionChange={clearSelectionError} destinationAddress={assigned ? wallet.address : ""}
          onOpenCheckout={openGeneralCheckout} checkoutCapability={checkoutCapability}
          onRetryCheckoutCapabilities={() => { if (mounted.current && !checkoutRequest.current) setCapabilityRevision(value => value + 1); }}
          onShowCheckoutHistory={() => { if (mounted.current && checkoutCapability.status === "ready" && checkoutCapability.configured) setShowGeneralActivity(true); }} /> : null}
        <WalletActionError message={providerError} />
      </section>
      <aside className={styles.details} aria-label={t("funding.destinationDetails")}>
        <section className={styles.detailCard}><div className={styles.stateHeading}><CheckCircle2 size={19} aria-hidden="true" /><h2>{t(assigned ? "walletPage.administrativeReady" : wallet.status === "error" ? "walletPage.administrativeLoadError" : wallet.status === "exhausted" ? "walletPage.administrativeUnavailable" : "walletPage.administrativeAssigning")}</h2></div>
          <WalletAddress address={assigned ? wallet.address : ""} label={t("walletPage.administrativeAddress")} loading={wallet.status === "loading"}
            emptyLabel={t(wallet.status === "exhausted" ? "walletPage.administrativeExhaustedCopy" : wallet.status === "error" ? "walletPage.destinationUnavailable" : "walletPage.administrativeAssigning")} />
          {wallet.status === "error" ? <button className="executive-button" type="button" onClick={() => void load()}><RefreshCw size={16} aria-hidden="true" />{t("walletPage.retry")}</button> : null}
          <ProviderNote>{t("walletPage.administrativeSeparation")}</ProviderNote>
        </section>
      </aside>
    </div>
    {sandbox ? <AdministrativeWalletOperations disabled={!assigned} assignedAddress={assigned ? wallet.address : ""} /> : null}
    {sandbox && selectedReference ? <WalletFundingStatus walletKind="administrative" checkoutReference={selectedReference} focusKey={statusFocusKey} /> : null}
    {sandbox ? <section className="executive-panel"><WalletFundingHistory walletKind="administrative" refreshKey={historyRevision} onSelectRequest={selectStatus} /></section> : null}
    {sandbox && checkoutCapability.status === "ready" && checkoutCapability.configured && preparedCheckout ? <section className="executive-panel" role="status">
      <h2 className={styles.statusHeading}>{t("funding.meldCheckoutPrepared")}</h2><p className={styles.hint}>{t("funding.meldCheckoutPreparedCopy")}</p>
      <button type="button" className="executive-button" disabled={busy} onClick={() => { if (mounted.current && !checkoutRequest.current) { setGeneralReference(preparedCheckout); setShowGeneralActivity(true); } }}>{t("funding.statusRefresh")}</button>
    </section> : null}
    {sandbox && assigned && checkoutCapability.status === "ready" && checkoutCapability.configured && showGeneralActivity ? <AdministrativeMeldCheckoutActivity
      enabled expectedAddress={wallet.address} checkoutReference={generalReference} refreshKey={generalRevision}
      onSelectRequest={reference => { if (mounted.current) setGeneralReference(reference); }} /> : null}
  </WalletFundingScreen>;
}

function useAdministrativeWallet() {
  const [wallet, setWallet] = useState(EMPTY_WALLET);
  const request = useRef(null), mounted = useRef(false);
  const load = useCallback(async () => {
    if (!mounted.current || request.current) return;
    const controller = new AbortController(); request.current = controller;
    const signal = controller.signal;
    setWallet(current => ({ ...current, status: "loading", errorCode: "" }));
    try {
      let next = await readAdministrativeWallet({ signal });
      if (next.status === "pending") next = await ensureAdministrativeWallet({ signal });
      if (!signal?.aborted) {
        setWallet({ ...EMPTY_WALLET, ...next, errorCode: "" });
        if (next.status === "assigned") window.dispatchEvent(new CustomEvent("vp:administrative-wallet-assigned"));
      }
    } catch (error) { if (mounted.current && !signal.aborted && error?.name !== "AbortError") setWallet({ ...EMPTY_WALLET, status: "error", errorCode: error?.code || "administrative_wallet_unavailable" }); }
    finally { if (request.current === controller) request.current = null; }
  }, []);
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; request.current?.abort(); request.current = null; }; }, [load]);
  return { wallet, load };
}
