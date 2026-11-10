"use client";

import { Building2, Copy, Loader2, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useReownWallet } from "@/components/reown/ReownContext";
import { useI18n } from "@/i18n/LanguageProvider";
import { ensureAdministrativeWallet, readAdministrativeWallet } from "@/lib/administrative-wallet.mjs";
import { startAdministrativeMeldOnramp } from "@/lib/administrative-onramp-client.mjs";
import StablecoinOnrampForm from "./StablecoinOnrampForm";

const ReownProvider = dynamic(() => import("@/components/reown/ReownProvider"), {
  ssr: false,
  loading: () => <div className="executive-panel" role="status"><Loader2 className="animate-spin" aria-label="Reown" /></div>,
});

/** @typedef {{status: "loading" | "assigned" | "pending" | "exhausted" | "error", address: string,
 * checkoutReference: string, assignedAt: string, errorCode: string}} AdministrativeWalletView */
/** @type {AdministrativeWalletView} */
const EMPTY_ADMINISTRATIVE_WALLET = {
  status: "loading", address: "", checkoutReference: "", assignedAt: "", errorCode: "",
};

export default function WalletFundingPanels() {
  return (
    <div className="mb-wallet-funding-grid" aria-label="Wallet funding">
      <ReownProvider><PersonalWalletFunding /></ReownProvider>
      <AdministrativeWalletFunding />
    </div>
  );
}

function PersonalWalletFunding() {
  const { t } = useI18n();
  const reown = useReownWallet();
  const [providerError, setProviderError] = useState("");
  const [copyError, setCopyError] = useState("");
  const address = reown.linkedAddress || reown.address || "";
  const loading = reown.linkStatus === "loading";
  const busy = ["connecting", "linking", "opening"].includes(reown.onrampStatus);

  async function openProvider(input) {
    setProviderError("");
    try { await reown.startOnramp({ walletAddress: address, ...input }); }
    catch { setProviderError(t("walletPage.quoteUnavailable")); }
  }

  return (
    <section id="personal-wallet" className="executive-panel mb-wallet-funding-card personal" aria-labelledby="personal-wallet-title">
      <WalletFundingHeader icon={Wallet} eyebrow={t("walletPage.personalEyebrow")} title={t("walletPage.personalTitle")}
        description={t("walletPage.personalCopy")} titleId="personal-wallet-title" status={address ? t("walletPage.simpleReadyTitle") : t("walletPage.personalAddressPending")}
        ready={Boolean(address)} />
      <WalletAddress address={address} label={t("walletPage.personalWalletLabel")} loading={loading}
        emptyLabel={t("walletPage.personalAddressPending")} onCopyError={() => setCopyError(t("walletPage.administrativeCopyFailed"))} />
      {!address && !loading ? <button type="button" className="executive-button primary" disabled={!reown.configured}
        onClick={() => void reown.openConnect().catch(() => setProviderError(t("recharge.providerConfiguration")))}>
        <Wallet size={17} aria-hidden="true" /> {t("overview.createWallet")}
      </button> : null}
      <StablecoinOnrampForm walletAddress={address} disabled={!address} busy={busy} onContinue={openProvider} />
      <ProviderNote text={t("onramp.simpleProviderNote")} />
      <WalletActionError message={copyError || providerError} />
    </section>
  );
}

function AdministrativeWalletFunding() {
  const { t } = useI18n();
  const { wallet, load } = useAdministrativeWallet();
  const [providerError, setProviderError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [busy, setBusy] = useState(false);
  const checkoutRequest = useRef(null);
  const assigned = wallet.status === "assigned";

  useEffect(() => () => checkoutRequest.current?.abort(), []);

  async function openProvider(input) {
    if (checkoutRequest.current || !assigned) return;
    const controller = new AbortController();
    checkoutRequest.current = controller;
    setBusy(true);
    setProviderError("");
    try { await startAdministrativeMeldOnramp({ address: wallet.address, ...input }, { signal: controller.signal }); }
    catch { if (!controller.signal.aborted) setProviderError(t("walletPage.quoteUnavailable")); }
    finally {
      if (checkoutRequest.current === controller) checkoutRequest.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <section id="administrative-wallet" className="executive-panel mb-wallet-funding-card administrative" aria-labelledby="administrative-wallet-title">
      <WalletFundingHeader icon={Building2} eyebrow={t("walletPage.administrativeEyebrow")} title={t("walletPage.administrativeTitle")}
        description={t("walletPage.administrativeCopy")} titleId="administrative-wallet-title" status={administrativeStatus(wallet.status, t)} ready={assigned} />
      {wallet.status === "error" ? (
        <div className="mb-administrative-wallet-state error" role="alert">
          <span>{t("walletPage.administrativeLoadError")}</span>
          <button className="executive-button" type="button" onClick={() => void load()}>
            <RefreshCw size={14} aria-hidden="true" /> {t("walletPage.retry")}
          </button>
        </div>
      ) : wallet.status === "exhausted" ? (
        <div className="mb-administrative-wallet-state" role="status">{t("walletPage.administrativeExhaustedCopy")}</div>
      ) : (
        <>
          <WalletAddress address={assigned ? wallet.address : ""} label={t("walletPage.administrativeAddress")}
            loading={!assigned} emptyLabel={t("walletPage.administrativeAssigning")}
            onCopyError={() => setCopyError(t("walletPage.administrativeCopyFailed"))} />
          <StablecoinOnrampForm walletAddress={assigned ? wallet.address : ""} disabled={!assigned} busy={busy} onContinue={openProvider} />
          <ProviderNote text={t("walletPage.administrativeSeparation")} />
        </>
      )}
      <WalletActionError message={copyError || providerError} />
    </section>
  );
}

function WalletFundingHeader({ icon: Icon, eyebrow, title, description, titleId, status, ready }) {
  return (
    <div className="mb-wallet-funding-heading">
      <span className="mb-wallet-funding-icon"><Icon size={20} aria-hidden="true" /></span>
      <div>
        <p>{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        <small>{description}</small>
      </div>
      <span className={`mb-wallet-funding-status ${ready ? "ready" : ""}`}>{status}</span>
    </div>
  );
}

function WalletAddress({ address, label, loading, emptyLabel, onCopyError }) {
  const { t } = useI18n();
  async function copyAddress() {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); }
    catch { onCopyError(); }
  }
  return (
    <div className="mb-wallet-funding-address" aria-live="polite">
      <span>{label}</span>
      {address ? <code title={address}>{address}</code> : <p>{loading ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : null}{emptyLabel}</p>}
      {address ? <button type="button" onClick={copyAddress} aria-label={t("walletPage.copyAddress")}><Copy size={15} aria-hidden="true" /></button> : null}
    </div>
  );
}

function ProviderNote({ text }) {
  return <div className="mb-wallet-provider-note"><ShieldCheck size={16} aria-hidden="true" /><p>{text}</p></div>;
}

function WalletActionError({ message }) {
  return message ? <p className="mb-reown-wallet-error" role="alert">{message}</p> : null;
}

function administrativeStatus(status, t) {
  if (status === "assigned") return t("walletPage.administrativeReady");
  if (status === "exhausted") return t("walletPage.administrativeUnavailable");
  if (status === "error") return t("walletPage.administrativeSyncing");
  return t("walletPage.administrativeAssigning");
}

function useAdministrativeWallet() {
  /** @type {[AdministrativeWalletView, import("react").Dispatch<import("react").SetStateAction<AdministrativeWalletView>>]} */
  const [wallet, setWallet] = useState(EMPTY_ADMINISTRATIVE_WALLET);

  const load = useCallback(async (signal) => {
    setWallet(current => ({ ...current, status: "loading", errorCode: "" }));
    try {
      let next = await readAdministrativeWallet({ signal });
      if (next.status === "pending") next = await ensureAdministrativeWallet({ signal });
      setWallet({ ...EMPTY_ADMINISTRATIVE_WALLET, ...next, errorCode: "" });
      return next;
    } catch (error) {
      if (error?.name !== "AbortError") {
        setWallet({ ...EMPTY_ADMINISTRATIVE_WALLET, status: "error", errorCode: error?.code || "administrative_wallet_unavailable" });
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { wallet, load };
}
