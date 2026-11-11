"use client";

import { ArrowRight, Loader2, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { personalCompanyPaymentPolicy, personalCompanyPaymentAtomic, personalCompanyPaymentAmountAtomic,
  formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import styles from "./company-payment.module.css";

export function CompanyPaymentForm({ balanceAtomic = null, amount = "", onAmountChange, onMax, onReview, onRefresh,
  busy = false, loading = false, connected = false, canRefresh = connected, onConnect, error = "", showHeading = true,
  chainId = 1, chainBalances = [], onNetworkChange = () => {}, nativeBalanceAtomic = null, restoring = false, needsVerification = false }) {
  const { t } = useI18n();
  const id = useId();
  const available = personalCompanyPaymentAtomic(balanceAtomic, true);
  const entered = personalCompanyPaymentAmountAtomic(amount);
  const policy = personalCompanyPaymentPolicy(chainId);
  const polygon = chainId === 137;
  const insufficient = available !== null && entered !== null && BigInt(entered) > available;
  const invalid = amount !== "" && (entered === null || insufficient);
  const canReview = Boolean(policy) && connected && !busy && !loading && available !== null && entered !== null && !insufficient;
  const blocked = busy || loading || !canRefresh;
  function submit(event) { event.preventDefault(); if (canReview) onReview(); }

  return <form className={`executive-panel ${styles.panel}`} onSubmit={submit} aria-label={t("companyPayment.title")}>
    {showHeading ? <header className={styles.heading}><WalletCards size={22} aria-hidden="true" /><div><h2>{t("companyPayment.title")}</h2><p>{t("companyPayment.subtitle")}</p></div></header> : null}
    <CompanyPaymentNetworks chainId={chainId} balances={chainBalances} onChange={onNetworkChange} disabled={busy || !canRefresh} />
    <div className={styles.balance} aria-live="polite"><span>{t("companyPayment.availableBalance")} · {polygon ? "Polygon" : "Ethereum"}</span>
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
    <div className={styles.destination}><div className={styles.destinationHeading}><label htmlFor={`${id}-recipient`}>{t("companyPayment.recipientLabel")}</label><span>{t(polygon ? "companyPayment.legacyNetwork" : "companyPayment.network")}</span></div>
      <output id={`${id}-recipient`} className={`${styles.readonlyAddress} ${styles.recipientName}`}>Mindbliss</output>
    </div>
    <p className={styles.note}><ShieldCheck size={16} aria-hidden="true" /><span>{t(polygon ? "companyPayment.polygonGasCopy" : "companyPayment.gasCopy")}</span></p>
    {!loading && nativeBalanceAtomic === "0" ? <p className={styles.fieldError} role="status">{t(polygon ? "companyPayment.polygonZeroGas" : "companyPayment.zeroGas")}</p> : null}
    <p className={styles.pending}>{t("companyPayment.allocationPending")}</p>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {connected ? <button className={`executive-button primary ${styles.primary}`} type="submit" disabled={!canReview}>
      {busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}{t(busy ? "companyPayment.busyLabel" : "companyPayment.review")}
    </button> : <><p className={styles.note} role={restoring ? "status" : undefined}>{t(restoring ? "companyPayment.restoringCopy" : needsVerification ? "companyPayment.verifyWalletCopy" : canRefresh ? "companyPayment.reconnectCopy" : "companyPayment.connectCopy")}</p>
      <button className={`executive-button primary ${styles.primary}`} type="button" disabled={busy || loading || restoring} onClick={onConnect}>
        {restoring || busy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <WalletCards size={17} aria-hidden="true" />}{t(restoring ? "companyPayment.restoring" : busy ? needsVerification ? "funding.verifyingWallet" : "companyPayment.restoring" : needsVerification ? "companyPayment.verifyWallet" : canRefresh ? "companyPayment.reconnect" : "companyPayment.connect")}
      </button></>}
  </form>;
}

export function CompanyPaymentNetworks({ chainId = 1, balances = [], onChange, disabled = false }) {
  const { t } = useI18n();
  return <fieldset className={styles.networks} disabled={disabled}><legend>{t("companyPayment.chooseNetwork")}</legend>
    <div className={styles.networkChoices} role="radiogroup" aria-label={t("companyPayment.chooseNetwork")}>
      {[1, 137].map(id => {
        const balance = balances.find(item => item.chainId === id);
        const value = balance && !balance.error && !balance.loading && personalCompanyPaymentAtomic(balance.balanceAtomic, true) !== null
          ? formatPersonalCompanyPaymentAmount(balance.balanceAtomic) : "—";
        return <button type="button" role="radio" key={id} aria-checked={chainId === id} tabIndex={chainId === id ? 0 : -1} data-chain-id={id} className={`${styles.networkOption}${chainId === id ? ` ${styles.networkSelected}` : ""}`}
          onKeyDown={event => {
            const next = { ArrowLeft: id === 1 ? 137 : 1, ArrowRight: id === 1 ? 137 : 1, ArrowUp: id === 1 ? 137 : 1, ArrowDown: id === 1 ? 137 : 1, Home: 1, End: 137 }[event.key];
            if (disabled || next === undefined) return;
            event.preventDefault();
            if (next !== id) {
              onChange?.(next);
              const target = event.currentTarget.parentElement?.querySelector(`[data-chain-id="${next}"]`);
              if (target && 'focus' in target && typeof target.focus === 'function') target.focus();
            }
          }}
          onClick={() => { if (!disabled && chainId !== id) onChange?.(id); }} disabled={disabled}>
          <span>{id === 137 ? "Polygon" : "Ethereum"}</span><bdi dir="ltr">{value} USDT</bdi>
        </button>;
      })}
    </div><small>{t("companyPayment.networkSelectionCopy")}</small>
  </fieldset>;
}

export function CompanyPaymentReview({ payment, onConfirm, onBack, busy = false, error = "" }) {
  const { t } = useI18n();
  const policy = personalCompanyPaymentPolicy(payment?.chainId);
  const polygon = payment?.chainId === 137;
  const valid = Boolean(policy && payment && typeof payment.paymentId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payment.paymentId)
    && payment.status === "prepared" && (payment.abandonedAt === null || payment.abandonedAt === undefined)
    && typeof payment.walletAddress === "string" && /^0x[0-9a-f]{40}$/i.test(payment.walletAddress)
    && payment.walletAddress.toLowerCase() !== policy.recipientAddress
    && typeof payment.recipientAddress === "string" && payment.recipientAddress.toLowerCase() === policy.recipientAddress
    && typeof payment.tokenAddress === "string" && payment.tokenAddress.toLowerCase() === policy.tokenAddress
    && payment.chainId === policy.chainId && payment.tokenDecimals === policy.tokenDecimals && personalCompanyPaymentAtomic(payment.amountAtomic) !== null
    && typeof payment.expiresAt === "string" && Number.isFinite(Date.parse(payment.expiresAt)) && Date.parse(payment.expiresAt) > Date.now());
  return <section className={`executive-panel ${styles.panel}`} aria-label={t("companyPayment.reviewTitle")}>
    <header className={styles.heading}><ShieldCheck size={22} aria-hidden="true" /><div><h2>{t("companyPayment.reviewTitle")}</h2><p>{t("companyPayment.reviewCopy")}</p></div></header>
    {valid ? <><div className={styles.reviewAmount}><span>{t("companyPayment.amountLabel")}</span><strong><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(payment.amountAtomic)} USDT</bdi></strong></div>
      <dl className={styles.reviewDetails}><div><dt>{t("companyPayment.senderLabel")}</dt><dd><code dir="ltr">{payment.walletAddress}</code></dd></div>
        <div><dt>{t("companyPayment.recipientLabel")}</dt><dd>Mindbliss</dd></div>
        <div><dt>{t("companyPayment.networkLabel")}</dt><dd>{t(polygon ? "companyPayment.legacyNetwork" : "companyPayment.network")}</dd></div></dl></>
      : <p className={styles.error} role="alert">{t("companyPayment.invalidReview")}</p>}
    <p className={styles.note}><ShieldCheck size={16} aria-hidden="true" /><span>{t(polygon ? "companyPayment.polygonGasCopy" : "companyPayment.gasCopy")}</span></p>
    <p className={styles.pending}>{t("companyPayment.allocationPending")}</p>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.actions}><button className="executive-button" type="button" onClick={onBack} disabled={busy}>{t("companyPayment.back")}</button>
      <button className={`executive-button primary ${styles.primary}`} type="button" disabled={!valid || busy} onClick={() => { if (valid && !busy) onConfirm(); }}>
        {busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(busy ? "companyPayment.busyLabel" : "companyPayment.confirmInWallet")}
      </button></div>
  </section>;
}

export default CompanyPaymentForm;
