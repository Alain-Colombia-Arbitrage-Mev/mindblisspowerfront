"use client";

import { useI18n } from "@/i18n/LanguageProvider";
import PersonalWalletBalance from "./PersonalWalletBalance";
import styles from "./personal-wallet-balance.module.css";

/** Polygon is the active personal wallet. Other networks retain their own history. */
export default function PersonalWalletBalances({ expectedAddress = "", compact = false, showGasNotice = true }) {
  const { t } = useI18n();
  return <div className={`${styles.balances}${compact ? ` ${styles.compactBalances}` : ""}`} role="group" aria-label={t("funding.personalBalanceTitle")}>
    <PersonalWalletBalance expectedAddress={expectedAddress} network="polygon" compact={compact} showGasNotice={showGasNotice} />
    <p className={styles.transferNote}>{t("funding.personalBalanceTransferNetwork")}</p>
  </div>;
}
