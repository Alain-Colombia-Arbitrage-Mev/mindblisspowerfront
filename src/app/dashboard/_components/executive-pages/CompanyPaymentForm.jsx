"use client";

import { ArrowRight, Loader2, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { PERSONAL_COMPANY_PAYMENT, personalCompanyPaymentAtomic, personalCompanyPaymentAmountAtomic,
  formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import styles from "./company-payment.module.css";

export function CompanyPaymentForm({ balanceAtomic = null, amount = "", onAmountChange, onMax, onReview, onRefresh,
  busy = false, loading = false, connected = false, canRefresh = connected, onConnect, error = "", showHeading = true }) {
  const { t } = useI18n();
  const id = useId();
  const available = personalCompanyPaymentAtomic(balanceAtomic, true);
  const entered = personalCompanyPaymentAmountAtomic(amount);
  const insufficient = available !== null && entered !== null && BigInt(entered) > available;
  const invalid = amount !== "" && (entered === null || insufficient);
  const canReview = connected && !busy && !loading && available !== null && entered !== null && !insufficient;
  const blocked = busy || loading || !connected;
  function submit(event) { event.preventDefault(); if (canReview) onReview(); }

  return <form className={`executive-panel ${styles.panel}`} onSubmit={submit} aria-label={t("companyPayment.title")}>
    {showHeading ? <header className={styles.heading}><WalletCards size={22} aria-hidden="true" /><div><h2>{t("companyPayment.title")}</h2><p>{t("companyPayment.subtitle")}</p></div></header> : null}
    <div className={styles.balance} aria-live="polite"><span>{t("companyPayment.availableBalance")}</span>
      <strong>{loading ? t("companyPayment.loadingBalance") : available === null ? "—" : <bdi dir="ltr">{formatPersonalCompanyPaymentAmount(balanceAtomic)} USDT</bdi>}</strong>
      <button className={styles.refresh} type="button" onClick={onRefresh} disabled={busy || loading || !canRefresh} aria-label={t("companyPayment.refreshBalance")}>
        <RefreshCw size={17} className={loading ? "animate-spin" : undefined} aria-hidden="true" /></button>
    </div>
    <div className={styles.field}><label htmlFor={`${id}-amount`}>{t("companyPayment.amountLabel")}</label>
      <div className={styles.amountInput}><span>USDT</span><input id={`${id}-amount`} value={amount} type="text" inputMode="decimal" dir="ltr" autoComplete="off"
        placeholder="0.00" maxLength={86} disabled={blocked} onChange={event => onAmountChange(event.target.value.replace(/[,٫]/g, "."))}
        aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-amount-error` : undefined} required />
        <button type="button" className={styles.max} onClick={onMax} disabled={blocked || available === null || available === 0n}>{t("companyPayment.max")}</button>
      </div>
      {invalid ? <p className={styles.fieldError} id={`${id}-amount-error`} role="alert">{t(insufficient ? "companyPayment.insufficientBalance" : "companyPayment.amountInvalid")}</p> : null}
    </div>
    <div className={styles.destination}><div className={styles.destinationHeading}><label htmlFor={`${id}-recipient`}>{t("companyPayment.recipientLabel")}</label><span>{t("companyPayment.network")}</span></div>
      <output id={`${id}-recipient`} className={styles.readonlyAddress} dir="ltr">{PERSONAL_COMPANY_PAYMENT.recipientAddress}</output>
    </div>
    <p className={styles.note}><ShieldCheck size={16} aria-hidden="true" /><span>{t("companyPayment.gasCopy")}</span></p>
    <p className={styles.pending}>{t("companyPayment.allocationPending")}</p>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {connected ? <button className={`executive-button primary ${styles.primary}`} type="submit" disabled={!canReview}>
      {busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}{t(busy ? "companyPayment.busyLabel" : "companyPayment.review")}
    </button> : <button className={`executive-button primary ${styles.primary}`} type="button" disabled={busy || loading} onClick={onConnect}><WalletCards size={17} aria-hidden="true" />{t("companyPayment.connect")}</button>}
  </form>;
}

export function CompanyPaymentReview({ payment, onConfirm, onBack, busy = false, error = "" }) {
  const { t } = useI18n();
  const valid = Boolean(payment && typeof payment.paymentId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payment.paymentId)
    && payment.status === "prepared" && (payment.abandonedAt === null || payment.abandonedAt === undefined)
    && typeof payment.walletAddress === "string" && /^0x[0-9a-f]{40}$/i.test(payment.walletAddress)
    && payment.walletAddress.toLowerCase() !== PERSONAL_COMPANY_PAYMENT.recipientAddress
    && typeof payment.recipientAddress === "string" && payment.recipientAddress.toLowerCase() === PERSONAL_COMPANY_PAYMENT.recipientAddress
    && typeof payment.tokenAddress === "string" && payment.tokenAddress.toLowerCase() === PERSONAL_COMPANY_PAYMENT.tokenAddress
    && payment.chainId === PERSONAL_COMPANY_PAYMENT.chainId && payment.tokenDecimals === PERSONAL_COMPANY_PAYMENT.tokenDecimals && personalCompanyPaymentAtomic(payment.amountAtomic) !== null
    && typeof payment.expiresAt === "string" && Number.isFinite(Date.parse(payment.expiresAt)) && Date.parse(payment.expiresAt) > Date.now());
  return <section className={`executive-panel ${styles.panel}`} aria-label={t("companyPayment.reviewTitle")}>
    <header className={styles.heading}><ShieldCheck size={22} aria-hidden="true" /><div><h2>{t("companyPayment.reviewTitle")}</h2><p>{t("companyPayment.reviewCopy")}</p></div></header>
    {valid ? <><div className={styles.reviewAmount}><span>{t("companyPayment.amountLabel")}</span><strong><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(payment.amountAtomic)} USDT</bdi></strong></div>
      <dl className={styles.reviewDetails}><div><dt>{t("companyPayment.senderLabel")}</dt><dd><code dir="ltr">{payment.walletAddress}</code></dd></div>
        <div><dt>{t("companyPayment.recipientLabel")}</dt><dd><code dir="ltr">{payment.recipientAddress}</code></dd></div>
        <div><dt>{t("companyPayment.networkLabel")}</dt><dd>{t("companyPayment.network")}</dd></div></dl></>
      : <p className={styles.error} role="alert">{t("companyPayment.invalidReview")}</p>}
    <p className={styles.note}><ShieldCheck size={16} aria-hidden="true" /><span>{t("companyPayment.gasCopy")}</span></p>
    <p className={styles.pending}>{t("companyPayment.allocationPending")}</p>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.actions}><button className="executive-button" type="button" onClick={onBack} disabled={busy}>{t("companyPayment.back")}</button>
      <button className={`executive-button primary ${styles.primary}`} type="button" disabled={!valid || busy} onClick={() => { if (valid && !busy) onConfirm(); }}>
        {busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(busy ? "companyPayment.busyLabel" : "companyPayment.confirmInWallet")}
      </button></div>
  </section>;
}

export default CompanyPaymentForm;
