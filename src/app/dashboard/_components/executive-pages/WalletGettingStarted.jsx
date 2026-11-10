"use client";

import { ArrowRight, CreditCard, KeyRound, MapPin, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { useReownWallet } from "@/components/reown/ReownProvider";

const steps = [
  { number: "01", title: "walletIntro.stepCreate", copy: "walletIntro.stepCreateCopy", icon: KeyRound },
  { number: "02", title: "walletIntro.stepDestination", copy: "walletIntro.stepDestinationCopy", icon: MapPin },
  { number: "03", title: "walletIntro.stepBuy", copy: "walletIntro.stepBuyCopy", icon: CreditCard },
];

export default function WalletGettingStarted() {
  const { t } = useI18n();
  const reown = useReownWallet();
  const [providerError, setProviderError] = useState("");
  const activeStep = reown.isLinked ? 2 : reown.isConnected ? 1 : 0;
  const address = compactAddress(reown.address);

  async function openWallet() {
    setProviderError("");
    try {
      await (reown.isConnected ? reown.openAccount() : reown.openConnect());
    } catch {
      setProviderError(t("recharge.providerUnavailable"));
    }
  }

  async function openOnramp() {
    setProviderError("");
    try {
      await reown.openOnramp();
    } catch {
      setProviderError(t("recharge.providerUnavailable"));
    }
  }

  async function linkWallet() {
    setProviderError("");
    try {
      await reown.linkWallet();
    } catch {
      setProviderError(t("walletPage.linkError"));
    }
  }

  return (
    <div className="mb-wallet-intro">
      <nav className="mb-wallet-progress" aria-label={t("walletIntro.progressLabel")}>
        {[
          ["1", t("walletIntro.start")], ["2", t("walletIntro.create")], ["3", t("walletIntro.ready")],
        ].map(([number, label], index) => (
          <span key={number} data-active={index === activeStep ? "true" : undefined}>
            <b>{number}</b>{label}
          </span>
        ))}
      </nav>

      <section className="mb-wallet-hero">
        <div className="mb-wallet-hero-copy">
          <h2>{t("walletIntro.title")}</h2>
          <p>{t("walletIntro.copy")}</p>
          <div className="mb-wallet-hero-actions">
            <button className="executive-button primary" type="button" onClick={openWallet}>
              {reown.isConnected ? t("walletPage.manageWallet") : t("overview.createWallet")} <ArrowRight size={14} />
            </button>
            {reown.isConnected && !reown.isLinked ? (
              <button className="executive-button" type="button" onClick={linkWallet} disabled={reown.isLinking}>
                {reown.isLinking ? t("walletPage.linking") : t("walletPage.linkAction")} <ShieldCheck size={14} />
              </button>
            ) : null}
            {reown.isLinked ? (
              <button className="executive-button" type="button" onClick={openOnramp}>
                {t("walletPage.onrampAction")} <CreditCard size={14} />
              </button>
            ) : null}
            <a className="executive-button" href="#wallet-steps">{t("overview.howItWorks")}</a>
          </div>
          {providerError ? <p className="mb-reown-wallet-error" role="alert">{providerError}</p> : null}
        </div>
        <div className="mb-wallet-visual">
          <span><WalletCards size={34} /></span>
          <strong>{reown.isLinked ? t("walletPage.verified") : reown.isConnected ? t("walletPage.connected") : t("walletPage.notConnected")}</strong>
          <div className="mb-reown-wallet-status" data-connected={reown.isConnected ? "true" : "false"}>
            <ShieldCheck size={17} aria-hidden="true" />
            <div>
              <small>{reown.isConnected ? t("walletPage.walletAddress") : t("walletPage.walletCreationCopy")}</small>
              {address ? <code title={reown.address}>{address}</code> : null}
            </div>
          </div>
          {reown.isConnected && !reown.isLinked ? <small className="mb-reown-link-hint">{t("walletPage.linkHint")}</small> : null}
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

function compactAddress(address) {
  if (typeof address !== "string" || !/^0x[a-f0-9]{40}$/i.test(address)) return "";
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
