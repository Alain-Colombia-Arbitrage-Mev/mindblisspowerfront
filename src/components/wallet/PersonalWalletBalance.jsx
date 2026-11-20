"use client";

import { RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import { usePersonalWalletBalance } from "@/hooks/usePersonalWalletBalance";
import { personalCompanyPaymentAtomic, formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import styles from "./personal-wallet-balance.module.css";

/** Displays a verified server read; wallet connection and checkout history never imply a balance. */
export default function PersonalWalletBalance({ expectedAddress = "", compact = false, showGasNotice = true, network = "ethereum", asset = "USDT" }) {
  const { t } = useI18n();
  const balance = usePersonalWalletBalance(expectedAddress, network, true, asset);
  const networkLabel = t({ polygon: "funding.personalBalancePolygonNetwork", arbitrum: "funding.personalBalanceArbitrumNetwork" }[network] || "funding.personalBalanceNetwork");
  const assetLabel = `${networkLabel} · ${asset}`;
  const address = typeof balance.walletAddress === "string" && /^0x[0-9a-f]{40}$/i.test(balance.walletAddress) ? balance.walletAddress.toLowerCase() : "";
  const expected = typeof expectedAddress === "string" ? expectedAddress.toLowerCase() : "";
  const matches = !expected || expected === address;
  const available = personalCompanyPaymentAtomic(balance.balanceAtomic, true);
  const ready = ["ethereum", "polygon", "arbitrum"].includes(network) && !balance.loading && !balance.error && Boolean(address) && matches && available !== null;
  const unlinked = !balance.loading && ((!balance.error && !address)
    || ["unauthenticated", "company_payment_wallet_not_linked"].includes(balance.error));
  const state = balance.loading ? "loading" : ready ? "ready" : unlinked ? "unlinked" : "unavailable";
  return <section className={`${styles.balance}${compact ? ` ${styles.compact}` : ""}`} aria-label={`${t("funding.personalBalanceTitle")} · ${assetLabel}`}
    aria-busy={balance.loading} data-wallet-balance={state} data-wallet-network={network}>
    <div className={styles.heading}><span>{compact ? networkLabel : t("funding.personalBalanceLabel")}</span>
      <button className={styles.refresh} type="button" onClick={balance.refresh} disabled={balance.loading} aria-label={`${t("funding.personalBalanceRefresh")} · ${assetLabel}`}>
        <RefreshCw size={16} className={balance.loading ? "animate-spin" : undefined} aria-hidden="true" />
      </button>
    </div>
    <output className={styles.amount} aria-live="polite" aria-atomic="true"><bdi dir="ltr">{ready ? formatPersonalCompanyPaymentAmount(balance.balanceAtomic) : "—"} <span>{asset}</span></bdi></output>
    {!compact ? <small className={styles.network}>{networkLabel}</small> : null}
    {!ready ? <p className={styles.notice} role="status">{t(balance.loading ? "funding.personalBalanceLoading" : unlinked ? "funding.personalBalanceNoWallet" : "funding.personalBalanceUnavailable")}</p> : null}
    {ready && showGasNotice && balance.nativeBalanceAtomic === "0" ? <p className={styles.notice}>{t(network === "polygon" ? "funding.personalBalancePolygonGas" : "funding.personalBalanceGas")}</p> : null}
  </section>;
}
