"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDownLeft, ArrowRight, CreditCard, Plus, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/LanguageProvider";
import { useReownWallet } from "@/components/reown/ReownContext";

const VALID_STEPS = new Set(["welcome", "methods", "reminder"]);

function safeStep(value) {
  return VALID_STEPS.has(value) ? value : "welcome";
}

export default function FirstRechargeDialog({ open, initialStep = "welcome", onOpenChange }) {
  const { t } = useI18n();
  const reown = useReownWallet();
  const [step, setStep] = useState(() => safeStep(initialStep));
  const [providerError, setProviderError] = useState("");

  useEffect(() => {
    if (open) {
      setStep(safeStep(initialStep));
      setProviderError("");
    }
  }, [initialStep, open]);

  useEffect(() => {
    if (open && reown.onrampStatus === "open") onOpenChange?.(false);
  }, [onOpenChange, open, reown.onrampStatus]);

  const close = () => onOpenChange?.(false);
  const openCryptoProvider = async () => {
    setProviderError("");
    try {
      const result = await reown.startOnramp();
      if (result && typeof result === "object" && "opened" in result && result.opened === true) close();
    } catch {
      setProviderError(t("recharge.providerUnavailable"));
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="mb-recharge-overlay" />
        <Dialog.Content className={`mb-recharge-dialog mb-recharge-dialog--${step}`} aria-describedby={`recharge-${step}-description`}>
          {step === "welcome" ? (
            <>
              <DialogHeader icon={Wallet} closeLabel={t("common.close")} onClose={close} />
              <div className="mb-recharge-copy">
                <span className="mb-recharge-eyebrow">{t("recharge.welcomeEyebrow")}</span>
                <Dialog.Title>{t("recharge.welcomeTitle")}</Dialog.Title>
                <Dialog.Description id="recharge-welcome-description">{t("recharge.welcomeCopy")}</Dialog.Description>
              </div>
              <ol className="mb-recharge-steps">
                {[t("recharge.stepMethod"), t("recharge.stepReview"), t("recharge.stepConfirm")].map((label, index) => (
                  <li key={label}><span>{String(index + 1).padStart(2, "0")}</span>{label}</li>
                ))}
              </ol>
              <div className="mb-recharge-actions">
                <button type="button" className="executive-button primary" onClick={() => setStep("methods")}>
                  {t("recharge.start")} <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button type="button" className="mb-recharge-secondary" onClick={close}>{t("recharge.notNow")}</button>
              </div>
            </>
          ) : step === "methods" ? (
            <>
              <div className="mb-recharge-topline">
                <span className="mb-recharge-eyebrow">{t("recharge.methodsEyebrow")}</span>
                <CloseButton label={t("common.close")} onClick={close} />
              </div>
              <div className="mb-recharge-copy">
                <Dialog.Title>{t("recharge.methodsTitle")}</Dialog.Title>
                <Dialog.Description id="recharge-methods-description">{t("recharge.methodsCopy")}</Dialog.Description>
              </div>
              <div className="mb-recharge-methods">
                <RechargeMethod icon={CreditCard} title={t("recharge.buyTitle")} copy={t("recharge.buyCopy")} action={t("recharge.buyAction")} onClick={openCryptoProvider} />
                <RechargeMethod icon={ArrowDownLeft} title={t("recharge.receiveTitle")} copy={t("recharge.receiveCopy")} action={t("recharge.receiveAction")} href="/dashboard/payments#wallet-steps" onNavigate={close} />
              </div>
              {providerError || reown.onrampError ? <p className="mb-recharge-error" role="alert">{providerError || t("recharge.providerUnavailable")}</p> : null}
              <button type="button" className="mb-recharge-secondary" onClick={close}>{t("recharge.later")}</button>
            </>
          ) : (
            <>
              <div className="mb-recharge-topline">
                <span className="mb-recharge-eyebrow">{t("recharge.reminderEyebrow")}</span>
                <CloseButton label={t("common.close")} onClick={close} />
              </div>
              <div className="mb-recharge-balance" aria-label={t("recharge.balanceAvailable")}>
                <span className="mb-recharge-balance-icon"><Plus size={24} aria-hidden="true" /></span>
                <small>{t("recharge.balanceAvailable")}</small>
                <div><strong>0.00</strong><span>USDC</span></div>
              </div>
              <div className="mb-recharge-copy mb-recharge-copy--centered">
                <Dialog.Title>{t("recharge.reminderTitle")}</Dialog.Title>
                <Dialog.Description id="recharge-reminder-description">{t("recharge.reminderCopy")}</Dialog.Description>
              </div>
              <div className="mb-recharge-actions">
                <button type="button" className="executive-button primary" onClick={() => setStep("methods")}>
                  {t("recharge.recharge")} <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button type="button" className="mb-recharge-secondary" onClick={close}>{t("recharge.continue")}</button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogHeader({ icon: Icon, closeLabel, onClose }) {
  return <div className="mb-recharge-topline"><span className="mb-recharge-symbol"><Icon size={27} aria-hidden="true" /></span><CloseButton label={closeLabel} onClick={onClose} /></div>;
}

function CloseButton({ label, onClick }) {
  return <Dialog.Close asChild><button type="button" className="mb-recharge-close" aria-label={label} onClick={onClick}><X size={18} aria-hidden="true" /></button></Dialog.Close>;
}

function RechargeMethod({ icon: Icon, title, copy, action, href = "", onNavigate = undefined, onClick = undefined }) {
  const content = (
    <>
      <span className="mb-recharge-method-icon"><Icon size={22} aria-hidden="true" /></span>
      <span className="mb-recharge-method-copy"><strong>{title}</strong><span>{copy}</span><b>{action} <ArrowRight size={14} aria-hidden="true" /></b></span>
    </>
  );

  if (href) return <Link className="mb-recharge-method" href={href} onClick={onNavigate}>{content}</Link>;
  return <button className="mb-recharge-method" type="button" onClick={onClick}>{content}</button>;
}
