"use client";

import { Copy, CreditCard, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import Link from "./IntentLink";
import { useI18n } from "@/i18n/LanguageProvider";
import { PERSONAL_WALLET_ASSET } from "@/lib/personal-wallet.mjs";
import { readWalletBinding } from "@/lib/wallet-binding.mjs";

export default function SidebarWalletCard({ onNavigate }) {
  const { t } = useI18n();
  const [address, setAddress] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    readWalletBinding({ signal: controller.signal }).then(result => setAddress(result.linked ? result.address : "")).catch(() => {});
    return () => controller.abort();
  }, []);
  const copy = async () => { if (address) await navigator.clipboard.writeText(address).catch(() => {}); };
  return (
    <section className="vp-sidebar-wallet" aria-label={t("nav.personalWallet")}>
      <div className="vp-sidebar-wallet-heading">
        <span>
          <span className="vp-sidebar-wallet-label">{t("nav.personalWallet")}</span>
          <strong>— {PERSONAL_WALLET_ASSET}</strong>
        </span>
        <Wallet size={18} aria-hidden="true" />
      </div>
      <div className="vp-sidebar-wallet-address">
        <code title={address || undefined}>{address ? compactAddress(address) : t("walletPage.simpleNewTitle")}</code>
        {address ? <button type="button" onClick={copy} aria-label={t("walletPage.copyAddress")}><Copy size={12} aria-hidden="true" /></button> : null}
      </div>
      <div className="vp-sidebar-wallet-actions">
        <Link href="/dashboard/payments#personal-wallet" onClick={onNavigate} className="vp-sidebar-wallet-action primary">
          <CreditCard size={14} aria-hidden="true" />
          {t("nav.addFunds")}
        </Link>
      </div>
    </section>
  );
}

function compactAddress(value) { return `${value.slice(0, 7)}…${value.slice(-5)}`; }
