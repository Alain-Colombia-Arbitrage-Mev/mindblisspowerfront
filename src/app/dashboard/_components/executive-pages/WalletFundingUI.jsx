"use client";

import { ArrowLeft, Copy, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/LanguageProvider";
import { WALLET_GATEWAY_FAILURE_REASONS } from "@/lib/wallet-funding-contract.mjs";
import styles from "./wallet-funding.module.css";

export function WalletFundingScreen({ title, subtitle, provider, children }) {
  const { t } = useI18n();
  return <section className="executive-page"><div className={`executive-container ${styles.screen}`}>
    <Link href="/dashboard/payments" prefetch={false} className={styles.back}><ArrowLeft size={16} aria-hidden="true" />{t("funding.backToSummary")}</Link>
    <header className={styles.pageHeading}><div><h1>{title}</h1><span>{subtitle}</span></div><p className={styles.providerBadge}>{provider}</p></header>
    {children}
  </div></section>;
}

export function WalletAddress({ address, label, loading = false, emptyLabel, onCopyError }) {
  const { t } = useI18n();
  async function copyAddress() {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); }
    catch { onCopyError(); }
  }
  return <div className="mb-wallet-funding-address" aria-live="polite"><span>{label}</span>
    {address ? <code title={address}>{address}</code> : <p>{loading ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : null}{emptyLabel}</p>}
    {address ? <button type="button" onClick={copyAddress} aria-label={t("walletPage.copyAddress")}><Copy size={15} aria-hidden="true" /></button> : null}
  </div>;
}

export function ProviderNote({ children }) {
  return <div className="mb-wallet-provider-note"><ShieldCheck size={16} aria-hidden="true" /><p>{children}</p></div>;
}

export function walletFailureDiagnostic(value) {
  return typeof value === "string" && WALLET_GATEWAY_FAILURE_REASONS.includes(value) ? value : undefined;
}

export function WalletActionError({ message, diagnostic = "" }) {
  return message ? <p className="mb-reown-wallet-error" role="alert" data-wallet-failure={walletFailureDiagnostic(diagnostic)}>{message}</p> : null;
}

export function administrativeFundingError(error, t) {
  const code = error?.message;
  if (code === "unauthenticated") return t("recharge.providerSession");
  if (code === "wallet_funding_rate_limited") return t("funding.rateLimited");
  if (code === "wallet_funding_request_already_used") return t("funding.requestUsed");
  if (code === "wallet_funding_method_unavailable") return t("funding.methodReloadRequired");
  if (code === "wallet_funding_amount_unavailable") return t("funding.amountUnavailable");
  if (code === "wallet_funding_unconfigured") return t("funding.sandboxConfiguration");
  return t("funding.sandboxUnavailable");
}
