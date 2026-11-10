"use client";

import { Loader2, RotateCw, Settings2, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";

import { useReownWallet } from "@/components/reown/ReownContext";
import { useI18n } from "@/i18n/LanguageProvider";

export default function WalletGettingStarted() {
  const { t } = useI18n();
  const reown = useReownWallet();
  const [providerError, setProviderError] = useState("");
  const address = compactAddress(reown.address);
  const checking = reown.linkStatus === "loading";
  const statusCopy = walletStatusCopy(reown, t);

  async function manageWallet() {
    setProviderError("");
    try {
      await reown.openAccount();
    } catch {
      setProviderError(t("recharge.providerUnavailable"));
    }
  }

  async function retryWalletCheck() {
    setProviderError("");
    try {
      await reown.refreshLink();
    } catch {
      setProviderError(reown.linkError === "session"
        ? t("walletPage.checkSession")
        : t("walletPage.checkUnavailable"));
    }
  }

  return (
    <section className="mb-wallet-inline-status" aria-label={t("walletPage.personalTitle")}>
      <div className="mb-wallet-quick-status">
        <span className="mb-wallet-quick-icon"><WalletCards size={26} aria-hidden="true" /></span>
        <div>
          <p>{statusCopy.title}</p>
          <small>{statusCopy.copy}</small>
          {address ? (
            <code title={reown.address}>
              <ShieldCheck size={14} aria-hidden="true" />
              {address}
            </code>
          ) : null}
        </div>
      </div>
      {reown.linkStatus === "error" ? (
        <button className="executive-button mb-wallet-manage-button" type="button" onClick={retryWalletCheck}>
          <RotateCw size={14} aria-hidden="true" /> {t("walletPage.retryCheck")}
        </button>
      ) : reown.isConnected ? (
        <button className="executive-button mb-wallet-manage-button" type="button" onClick={manageWallet}>
          <Settings2 size={14} aria-hidden="true" /> {t("walletPage.manageWallet")}
        </button>
      ) : checking ? <Loader2 className="animate-spin" size={18} aria-label={t("walletPage.checking")} /> : null}
      {providerError ? <p className="mb-reown-wallet-error" role="alert">{providerError}</p> : null}
    </section>
  );
}

function walletStatusCopy(reown, t) {
  if (reown.isLinked) return { title: t("walletPage.simpleReadyTitle"), copy: t("walletPage.simpleLinkedCopy") };
  if (reown.linkStatus === "loading") return { title: t("walletPage.checking"), copy: t("walletPage.checkingCopy") };
  if (reown.linkStatus === "error") return {
    title: t("walletPage.checkFailed"),
    copy: t(reown.linkError === "session" ? "walletPage.checkSession" : "walletPage.checkUnavailable"),
  };
  if (reown.isConnected) return { title: t("walletPage.connectedPending"), copy: t("walletPage.connectedPendingCopy") };
  return { title: t("walletPage.simpleNewTitle"), copy: t("walletPage.simpleFlowCopy") };
}

function compactAddress(address) {
  if (typeof address !== "string" || !/^0x[a-f0-9]{40}$/i.test(address)) return "";
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
