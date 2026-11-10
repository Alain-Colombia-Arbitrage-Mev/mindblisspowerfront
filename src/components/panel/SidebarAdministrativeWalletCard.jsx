"use client";

import { Building2, Copy, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";

import Link from "./IntentLink";
import { useI18n } from "@/i18n/LanguageProvider";
import { readAdministrativeWallet } from "@/lib/administrative-wallet.mjs";

export default function SidebarAdministrativeWalletCard({ onNavigate }) {
  const { t } = useI18n();
  const [address, setAddress] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    readAdministrativeWallet({ signal: controller.signal }).then(result => setAddress(result.status === "assigned" ? result.address : "")).catch(() => {});
    return () => controller.abort();
  }, []);
  const copy = async () => { if (address) await navigator.clipboard.writeText(address).catch(() => {}); };
  return (
    <section className="vp-sidebar-wallet administrative-card" aria-label={t("nav.administrativeWallet")}>
      <div className="vp-sidebar-wallet-heading">
        <span><span className="vp-sidebar-wallet-label">{t("nav.administrativeWallet")}</span><strong>— USDT</strong></span>
        <Building2 size={18} aria-hidden="true" />
      </div>
      <div className="vp-sidebar-wallet-address">
        <code title={address || undefined}>{address ? compactAddress(address) : t("walletPage.administrativeAssigning")}</code>
        {address ? <button type="button" onClick={copy} aria-label={t("walletPage.copyAddress")}><Copy size={12} aria-hidden="true" /></button> : null}
      </div>
      <Link href="/dashboard/payments#administrative-wallet" onClick={onNavigate} className="vp-sidebar-wallet-action administrative">
        <CreditCard size={14} aria-hidden="true" />{t("nav.topUpAdministrative")}
      </Link>
    </section>
  );
}

function compactAddress(value) { return `${value.slice(0, 7)}…${value.slice(-5)}`; }
