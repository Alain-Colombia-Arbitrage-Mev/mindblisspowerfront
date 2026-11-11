"use client";

import { useI18n } from "@/i18n/LanguageProvider";
import PersonalWalletBalance from "./PersonalWalletBalance";
import styles from "./personal-wallet-balance.module.css";

/** These are separate balances for one address. They are never added together. */
export default function PersonalWalletBalances({ expectedAddress = "", compact = false, showGasNotice = true }) {
  const { t } = useI18n();
  return <div className={`${styles.balances}${compact ? ` ${styles.compactBalances}` : ""}`} role="group" aria-label={t("funding.personalBalanceTitle")}>
    <PersonalWalletBalance expectedAddress={expectedAddress} network="ethereum" compact={compact} showGasNotice={showGasNotice} />
    <PersonalWalletBalance expectedAddress={expectedAddress} network="polygon" compact={compact} showGasNotice={false} />
    <p className={styles.transferNote}>{t("funding.personalBalanceTransferNetwork")}</p>
  </div>;
}
