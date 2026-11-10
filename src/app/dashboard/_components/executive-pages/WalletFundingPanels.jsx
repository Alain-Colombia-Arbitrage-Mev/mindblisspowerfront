"use client";

import { ArrowUpRight, Building2, Wallet } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/LanguageProvider";
import styles from "./wallet-funding.module.css";

/** Navigation only: neither wallet's SDK, requests nor state mount on the summary. */
export default function WalletFundingPanels() {
  const { t } = useI18n();
  return <div className={styles.destinations} aria-label={t("walletPage.fundsTitle")}>
    <WalletDestination icon={Wallet} title={t("walletPage.personalWalletLabel")} copy={t("funding.personalDestination")}
      provider="Reown" href="/dashboard/wallet-personal" />
    <WalletDestination icon={Building2} title={t("walletPage.administrativeWalletLabel")} copy={t("funding.administrativeDestination")}
      provider="MELD" href="/dashboard/wallet-administrative" />
  </div>;
}

function WalletDestination({ icon: Icon, title, copy, provider, href }) {
  const { t } = useI18n();
  return <section className={`executive-panel ${styles.destination}`}>
    <div className={styles.destinationHeading}><span className="mb-wallet-funding-icon"><Icon size={20} aria-hidden="true" /></span>
      <div><h2>{title}</h2><span className={styles.provider}>{provider} · USDT</span></div></div>
    <p>{copy}</p>
    <Link className="executive-button primary" href={href} prefetch={false}>{t("walletPage.addFundsAction")}<ArrowUpRight size={17} aria-hidden="true" /></Link>
  </section>;
}
