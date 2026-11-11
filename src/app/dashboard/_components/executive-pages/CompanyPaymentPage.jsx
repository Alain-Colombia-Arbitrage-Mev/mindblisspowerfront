"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { CheckCircle2, Clock3, Loader2, RefreshCw } from "lucide-react";
import { useReownWallet } from "@/components/reown/ReownContext";
import { useI18n } from "@/i18n/LanguageProvider";
import { useCompanyPayment } from "@/hooks/useCompanyPayment";
import { personalCompanyPaymentPolicy, formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import { companyPaymentView } from "@/lib/company-payment-contract.mjs";
import { CompanyPaymentForm, CompanyPaymentReview } from "./CompanyPaymentForm";
import CompanyPaymentActivity from "./CompanyPaymentActivity";
import styles from "./company-payment.module.css";

const ReownProvider = dynamic(() => import("@/components/reown/ReownProvider"), { ssr: false,
  loading: WalletLoading });
const PersonalTransferRouter = dynamic(() => import("./PersonalTransferRouter"), { ssr: false, loading: WalletLoading });

function WalletLoading() {
  const { t } = useI18n();
  return <p className="executive-panel" role="status"><Loader2 className="animate-spin" size={20} aria-hidden="true" /><span className="sr-only">{t("walletPage.checking")}</span></p>;
}

export default function CompanyPaymentPage() {
  return <ReownProvider><PersonalTransferRouter DirectPayment={PersonalCompanyPayment} /></ReownProvider>;
}

export function PersonalCompanyPayment({ onSponsoredPolygon = undefined } = {}) {
  const { t, locale } = useI18n();
  const reown = useReownWallet();
  const flow = useCompanyPayment(reown);
  const payment = flow.payment;
  const guarded = Boolean(payment && (flow.recovery?.paymentId === payment.paymentId || (flow.transfer?.paymentId === payment.paymentId && flow.transfer.transactionMayExist)));
  const reviewing = payment?.status === "prepared" && Boolean(personalCompanyPaymentPolicy(payment.chainId)) && !payment.abandonedAt && flow.stage === "review" && !guarded && flow.connected;
  const status = payment && !reviewing && flow.stage !== "form";
  const failureKey = flow.chainId === 137 && flow.errorKey === "companyPayment.networkUnavailable" ? "companyPayment.legacyNetworkUnavailable" : flow.errorKey;
  const failure = failureKey ? t(failureKey) : "";
  return <section className="executive-page"><div className="executive-container" style={{ maxWidth: 840 }}>
    <div className="executive-page-header"><div><h1 className="executive-title">{t("companyPayment.title")}</h1><p className="executive-subtitle">{t("companyPayment.subtitle")}</p></div></div>
    <div className={styles.actions} style={{ marginBottom: 20 }}>
      <Link className="executive-button" href="/dashboard/wallet-personal">{t("walletPage.addFundsAction")}</Link>
      {flow.errorKey === "companyPayment.switchNetwork" ? <button type="button" className="executive-button" disabled={flow.busy} onClick={() => void flow.switchNetwork()}>{t(flow.chainId === 137 ? "companyPayment.polygonSwitchNetwork" : "companyPayment.switchNetwork")}</button> : null}
    </div>
    {reviewing ? <CompanyPaymentReview payment={payment} onConfirm={() => void flow.confirm()} onBack={() => void flow.abandon()} busy={flow.busy} error={failure} />
      : status ? <CompanyPaymentStatus flow={flow} />
        : <CompanyPaymentForm showHeading={false} chainId={flow.chainId} chainBalances={flow.chainBalances} onNetworkChange={id => id === 137 && onSponsoredPolygon ? onSponsoredPolygon() : flow.changeNetwork(id)} balanceAtomic={flow.balanceAtomic} nativeBalanceAtomic={flow.nativeBalanceAtomic} restoring={flow.restoring} needsVerification={flow.needsVerification} amount={flow.amount} onAmountChange={flow.setAmount}
          onMax={() => { if (flow.balanceAtomic !== null) flow.setAmount(formatPersonalCompanyPaymentAmount(flow.balanceAtomic)); }}
          onReview={flow.review} onRefresh={flow.refresh} busy={flow.busy} loading={flow.loadingBalance || (flow.verified && flow.historyLoading) || reown.linkStatus === "loading"}
          connected={flow.connected} canRefresh={flow.verified} onConnect={() => void flow.connect()} error={failure} />}
    <details className="executive-panel" style={{ marginTop: 20 }}><summary style={{ cursor: "pointer", minHeight: 44, alignContent: "center" }}>{t("companyPayment.historyTitle")}</summary>
      {flow.historyLoading ? <p role="status">{t("common.loading")}</p> : !flow.history.length ? <p className={styles.pending}>{t("companyPayment.emptyHistory")}</p>
        : <div className="executive-table-wrap"><table className="executive-table"><thead><tr><th>{t("financePage.date")}</th><th>{t("companyPayment.networkLabel")}</th><th>USDT</th><th>{t("financePage.status")}</th></tr></thead><tbody>
          {flow.history.map(record => <tr key={record.paymentId}><td>{new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(record.createdAt))}</td>
            <td>{record.chainId === 137 ? "Polygon" : "Ethereum"}</td><td><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(record.amountAtomic)}</bdi></td><td><button className="executive-button" type="button" onClick={() => flow.selectHistory(record)} disabled={flow.busy}>
              {t(record.status === "confirmed" ? "companyPayment.confirmedTitle" : record.status === "submitted" ? "companyPayment.submittedTitle" : record.status === "failed" ? "companyPayment.paymentFailed" : record.abandonedAt ? "companyPayment.abandonedTitle" : "companyPayment.preparedTitle")}
            </button></td></tr>)}
        </tbody></table></div>}
      <button className="executive-button" style={{ marginTop: 12 }} type="button" onClick={flow.refresh} disabled={flow.busy || flow.historyLoading}><RefreshCw size={16} aria-hidden="true" />{t("common.update")}</button>
    </details>
    <CompanyPaymentActivity walletAddress={flow.wallet} />
  </div></section>;
}

export function CompanyPaymentStatus({ flow }) {
  const { t } = useI18n();
  const value = companyPaymentView(flow.payment);
  if (!value) return null;
  const confirmed = value.status === "confirmed", failed = value.status === "failed", draft = value.status === "prepared";
  const legacy = value.chainId === 137;
  const ambiguous = draft && Boolean(flow.recovery?.paymentId === value.paymentId || (flow.transfer?.paymentId === value.paymentId && flow.transfer.transactionMayExist));
  const expired = draft && Date.parse(value.expiresAt) <= Date.now();
  const title = confirmed ? "confirmedTitle" : failed ? "paymentFailed" : !draft ? "submittedTitle" : ambiguous ? "ambiguousTitle" : value.abandonedAt ? "abandonedTitle" : "preparedTitle";
  const copy = confirmed ? legacy ? "legacyConfirmedCopy" : "confirmedCopy" : failed ? "paymentFailed" : !draft ? "pendingCopy" : ambiguous ? "ambiguousCopy" : value.abandonedAt ? "abandonedCopy" : expired ? "preparedExpired" : "preparedCopy";
  return <section className={`executive-panel ${styles.panel}`} aria-label={t(`companyPayment.${title}`)} aria-busy={flow.busy}>
    <header className={styles.heading}>{confirmed ? <CheckCircle2 size={22} aria-hidden="true" /> : <Clock3 size={22} aria-hidden="true" />}<div><h2>{t(`companyPayment.${title}`)}</h2><p>{t(`companyPayment.${copy}`)}</p></div></header>
    <div className={styles.reviewAmount}><span>{t("companyPayment.amountLabel")}</span><strong><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(value.amountAtomic)} USDT</bdi></strong></div>
    <dl className={styles.reviewDetails}><div><dt>{t("companyPayment.recipientLabel")}</dt><dd><code dir="ltr">{value.recipientAddress}</code></dd></div>
      <div><dt>{t("companyPayment.networkLabel")}</dt><dd>{t(legacy ? "companyPayment.legacyNetwork" : "companyPayment.network")}</dd></div>
      {value.transactionHash ? <div><dt>{t("companyPayment.hashLabel")}</dt><dd><a href={`https://${legacy ? "polygonscan.com" : "etherscan.io"}/tx/${value.transactionHash}`} target="_blank" rel="noreferrer noopener"><code dir="ltr">{value.transactionHash}</code></a></dd></div> : null}
    </dl>
    <p className={styles.pending}>{t("companyPayment.allocationPending")}</p>
    {flow.errorKey ? <p className={styles.error} role="alert">{t(legacy && flow.errorKey === "companyPayment.networkUnavailable" ? "companyPayment.legacyNetworkUnavailable" : flow.errorKey)}</p> : null}
    {draft && !value.transactionHash && (ambiguous || value.abandonedAt) ? <label className={styles.field}>{t("companyPayment.hashLabel")}<input className={styles.readonlyAddress} type="text" value={flow.recovery?.transactionHash || flow.manualHash}
      onChange={event => flow.setManualHash(event.target.value)} maxLength={66} dir="ltr" autoComplete="off" disabled={flow.busy || Boolean(flow.recovery?.transactionHash)} /></label> : null}
    <div className={styles.actions}>
      {draft && !ambiguous && !value.abandonedAt ? <>
        {!expired ? <button className="executive-button primary" type="button" onClick={() => flow.connected ? flow.resume() : void flow.connect()} disabled={flow.busy || flow.restoring}>{t(flow.restoring ? "companyPayment.restoring" : flow.connected ? "companyPayment.resume" : "companyPayment.reconnect")}</button> : null}
        <button className="executive-button" type="button" onClick={() => void flow.abandon()} disabled={flow.busy}>{t("companyPayment.abandon")}</button>
      </> : null}
      {!draft || ambiguous || value.abandonedAt ? <button className="executive-button primary" type="button" onClick={() => void flow.verifyPayment()} disabled={flow.busy || (draft && !/^0x[0-9a-f]{64}$/i.test(flow.recovery?.transactionHash || flow.manualHash))}>
        {flow.busy ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}{t(draft ? "companyPayment.registerHash" : legacy ? "companyPayment.legacyVerify" : "companyPayment.verify")}
      </button> : null}
      {confirmed || failed || (draft && value.abandonedAt) ? <button className="executive-button" type="button" onClick={flow.newPayment} disabled={flow.busy || Boolean(flow.manualHash.trim() || flow.recovery)}>{t("companyPayment.newPayment")}</button> : null}
    </div>
  </section>;
}
