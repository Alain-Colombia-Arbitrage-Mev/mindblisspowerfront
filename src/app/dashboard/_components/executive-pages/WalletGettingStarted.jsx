"use client";

import { ArrowRight, CreditCard, KeyRound, MapPin, ShieldCheck, WalletCards } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";

const steps = [
  { number: "01", title: "walletIntro.stepCreate", copy: "walletIntro.stepCreateCopy", icon: KeyRound },
  { number: "02", title: "walletIntro.stepDestination", copy: "walletIntro.stepDestinationCopy", icon: MapPin },
  { number: "03", title: "walletIntro.stepBuy", copy: "walletIntro.stepBuyCopy", icon: CreditCard },
];

export default function WalletGettingStarted() {
  const { t } = useI18n();
  return (
    <div className="mb-wallet-intro">
      <nav className="mb-wallet-progress" aria-label={t("walletIntro.progressLabel")}>
        {[
          ["1", t("walletIntro.start")], ["2", t("walletIntro.create")], ["3", t("walletIntro.ready")],
        ].map(([number, label], index) => (
          <span key={number} data-active={index === 0 ? "true" : undefined}>
            <b>{number}</b>{label}
          </span>
        ))}
      </nav>

      <section className="mb-wallet-hero">
        <div className="mb-wallet-hero-copy">
          <h2>{t("walletIntro.title")}</h2>
          <p>{t("walletIntro.copy")}</p>
          <div className="mb-wallet-hero-actions">
            <a className="executive-button primary" href="#wallet-finance">{t("walletIntro.create")} <ArrowRight size={14} /></a>
            <a className="executive-button" href="#wallet-steps">{t("overview.howItWorks")}</a>
          </div>
        </div>
        <div className="mb-wallet-visual" aria-hidden="true">
          <span><WalletCards size={34} /></span>
          <strong>{t("walletIntro.beforeStart")}</strong>
          <ul>
            <li><KeyRound size={15} /><span><b>{t("walletIntro.access")}</b> {t("walletIntro.accessCopy")}</span></li>
            <li><MapPin size={15} /><span><b>{t("walletIntro.destination")}</b> {t("walletIntro.destinationCopy")}</span></li>
            <li><ShieldCheck size={15} /><span><b>{t("walletIntro.purchase")}</b> {t("walletIntro.purchaseCopy")}</span></li>
          </ul>
        </div>
      </section>

      <div id="wallet-steps" className="mb-wallet-steps">
        {steps.map(({ number, title, copy, icon: Icon }) => (
          <article key={number}>
            <span><Icon size={18} /></span>
            <h3>{number} · {t(title)}</h3>
            <p>{t(copy)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
