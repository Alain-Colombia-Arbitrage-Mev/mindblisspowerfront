"use client";

import { ReceiptText, Wallet } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";

const benefits = [
  { icon: Wallet, key: "auth.benefitWallet" },
  { icon: ReceiptText, key: "auth.benefitHistory" },
];

const capabilities = [
  ["auth.capabilityAccount", "auth.capabilityAccountCopy"],
  ["auth.capabilityWallet", "auth.capabilityWalletCopy"],
];

export function AuthIdentityCopy({ title, description }) {
  const { t } = useI18n();
  return <>
    <div className="auth-identity-copy">
      <h1>{title || t("auth.hero")}</h1>
      <p>{description || t("auth.heroCopy")}</p>
    </div>
    <div className="auth-benefits" aria-label="Mindbliss">
      {benefits.map(({ icon: Icon, key }) => <div key={key}><span><Icon size={16} aria-hidden="true" /></span><p>{t(key)}</p></div>)}
    </div>
    <div className="auth-capabilities">
      {capabilities.map(([name, copy]) => <div key={name}><strong>{t(name)}</strong><span>{t(copy)}</span></div>)}
    </div>
  </>;
}

export function AuthLegal() {
  const { t } = useI18n();
  return <p className="auth-legal">{t("auth.legal")}</p>;
}

