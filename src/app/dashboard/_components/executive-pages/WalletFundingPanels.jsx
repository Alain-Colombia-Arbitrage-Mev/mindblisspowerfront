"use client";

import { ArrowUpRight, Wallet } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/LanguageProvider";
import PersonalWalletBalances from "@/components/wallet/PersonalWalletBalances";
import styles from "./wallet-funding.module.css";

/** Personal wallet navigation only; checkout state mounts on its own screen. */
export default function WalletFundingPanels() {
  const { t } = useI18n();
  return <div className={styles.destinations} aria-label={t("walletPage.fundsTitle")}>
    <WalletDestination icon={Wallet} title={t("walletPage.personalWalletLabel")} copy={t("funding.personalDestination")}
      network="Ethereum" href="/dashboard/wallet-personal" />
  </div>;
}

function WalletDestination({ icon: Icon, title, copy, network, href }) {
  const { t } = useI18n();
  return <section className={`executive-panel ${styles.destination}`}>
    <div className={styles.destinationHeading}><span className="mb-wallet-funding-icon"><Icon size={20} aria-hidden="true" /></span>
      <div><h2>{title}</h2><span className={styles.provider}>{network} · USDT</span></div></div>
    <PersonalWalletBalances />
    <p>{copy}</p>
    <Link className="executive-button primary" href={href} prefetch={false}>{t("walletPage.addFundsAction")}<ArrowUpRight size={17} aria-hidden="true" /></Link>
  </section>;
}
