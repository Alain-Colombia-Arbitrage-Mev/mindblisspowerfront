"use client";

import { Settings2, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";

import { useReownWallet } from "@/components/reown/ReownContext";
import { useI18n } from "@/i18n/LanguageProvider";

export default function WalletGettingStarted() {
  const { t } = useI18n();
  const reown = useReownWallet();
  const [providerError, setProviderError] = useState("");
  const address = compactAddress(reown.address);

  async function manageWallet() {
    setProviderError("");
    try {
      await reown.openAccount();
    } catch {
      setProviderError(t("recharge.providerUnavailable"));
    }
  }

  return (
    <section className="mb-wallet-inline-status" aria-label={t("walletPage.personalTitle")}>
      <div className="mb-wallet-quick-status">
        <span className="mb-wallet-quick-icon"><WalletCards size={26} aria-hidden="true" /></span>
        <div>
          <p>{reown.isLinked ? t("walletPage.simpleReadyTitle") : t("walletPage.simpleNewTitle")}</p>
          <small>{reown.isLinked ? t("walletPage.simpleLinkedCopy") : t("walletPage.simpleFlowCopy")}</small>
          {address ? (
            <code title={reown.address}>
              <ShieldCheck size={14} aria-hidden="true" />
              {address}
            </code>
          ) : null}
        </div>
      </div>
      {reown.isConnected ? (
        <button className="executive-button mb-wallet-manage-button" type="button" onClick={manageWallet}>
          <Settings2 size={14} aria-hidden="true" /> {t("walletPage.manageWallet")}
        </button>
      ) : null}
      {providerError ? <p className="mb-reown-wallet-error" role="alert">{providerError}</p> : null}
    </section>
  );
}

function compactAddress(address) {
  if (typeof address !== "string" || !/^0x[a-f0-9]{40}$/i.test(address)) return "";
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
