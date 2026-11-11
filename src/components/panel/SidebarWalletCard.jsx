"use client";

import { ArrowUpRight, Copy, CreditCard, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import Link from "./IntentLink";
import { useI18n } from "@/i18n/LanguageProvider";
import PersonalWalletBalances from "@/components/wallet/PersonalWalletBalances";
import { readWalletBinding } from "@/lib/wallet-binding.mjs";

export default function SidebarWalletCard({ onNavigate }) {
  const { t } = useI18n();
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let controller;
    const read = () => {
      controller?.abort(); controller = new AbortController();
      const request = controller;
      readWalletBinding({ signal: request.signal }).then(result => {
        if (request.signal.aborted) return;
        setAddress(result.linked ? result.address : ""); setStatus(result.linked ? "linked" : "unlinked");
      }).catch(() => { if (!request.signal.aborted) setStatus("error"); });
    };
    read();
    window.addEventListener("vp:personal-wallet-linked", read);
    return () => { controller?.abort(); window.removeEventListener("vp:personal-wallet-linked", read); };
  }, []);
  const copy = async () => { if (address) await navigator.clipboard.writeText(address).catch(() => {}); };
  return (
    <section className="vp-sidebar-wallet" aria-label={t("nav.personalWallet")}>
      <div className="vp-sidebar-wallet-heading">
        <span>
          <span className="vp-sidebar-wallet-label">{t("nav.personalWallet")}</span>
        </span>
        <Wallet size={18} aria-hidden="true" />
      </div>
      <PersonalWalletBalances expectedAddress={status === "linked" ? address : ""} compact showGasNotice={false} />
      <div className="vp-sidebar-wallet-address">
        <code title={address || undefined}>{address ? compactAddress(address) : t(status === "loading" ? "walletPage.checking" : status === "error" ? "walletPage.checkFailed" : "funding.noPersonalAddress")}</code>
        {address ? <button type="button" onClick={copy} aria-label={t("walletPage.copyAddress")}><Copy size={12} aria-hidden="true" /></button> : null}
      </div>
      {status === "unlinked" ? <div className="grid gap-2">
        <p className="text-xs leading-relaxed text-[var(--vp-muted)]">{t("funding.prepareWalletCopy")}</p>
        <Link href="/dashboard/wallet-personal#personal-wallet" onClick={onNavigate} className="vp-sidebar-wallet-action primary">
          <Wallet size={14} aria-hidden="true" /><span>{t("funding.prepareWallet")}</span>
        </Link>
      </div> : null}
      <div className="vp-sidebar-wallet-actions">
        <Link href="/dashboard/wallet-personal" onClick={onNavigate} className="vp-sidebar-wallet-action primary">
          <CreditCard size={14} aria-hidden="true" />
          <span>{t("nav.addFunds")}</span>
        </Link>
        <Link href="/dashboard/wallet-personal/pay" onClick={onNavigate} className="vp-sidebar-wallet-action">
          <ArrowUpRight size={14} aria-hidden="true" />
          <span>{t("companyPayment.transferAction")}</span>
        </Link>
      </div>
    </section>
  );
}

function compactAddress(value) { return `${value.slice(0, 7)}…${value.slice(-5)}`; }
