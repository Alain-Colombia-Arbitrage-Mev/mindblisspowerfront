"use client";

import { useI18n } from "@/i18n/LanguageProvider";
import PersonalWalletBalance from "./PersonalWalletBalance";
import styles from "./personal-wallet-balance.module.css";

/** Each network displays its own balance. */
export default function PersonalWalletBalances({ expectedAddress = "", compact = false, showGasNotice = true, showFundingNetworks = false, showPolygonUsdc = false }) {
  const { t } = useI18n();
  return <div className={`${styles.balances}${compact ? ` ${styles.compactBalances}` : ""}`} role="group" aria-label={t("funding.personalBalanceTitle")}>
    <PersonalWalletBalance expectedAddress={expectedAddress} network="polygon" compact={compact} showGasNotice={showGasNotice} />
    {showFundingNetworks || showPolygonUsdc ? <PersonalWalletBalance expectedAddress={expectedAddress} network="polygon" asset="USDC" compact={compact} showGasNotice={false} /> : null}
    {showFundingNetworks ? <PersonalWalletBalance expectedAddress={expectedAddress} network="arbitrum" asset="USDC" compact={compact} showGasNotice={false} /> : null}
    {showFundingNetworks ? <PersonalWalletBalance expectedAddress={expectedAddress} network="ethereum" asset="USDC" compact={compact} showGasNotice={false} /> : null}
    <p className={styles.transferNote}>{t(showFundingNetworks ? "funding.personalFundingNetworks" : "funding.personalBalanceTransferNetwork")}</p>
  </div>;
}
