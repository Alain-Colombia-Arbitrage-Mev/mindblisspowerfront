"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useReownWallet } from "@/components/reown/ReownContext";
import { usePolygonRelay } from "@/hooks/usePolygonRelay";
import { useI18n } from "@/i18n/LanguageProvider";
import { formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import { polygonRelayView } from "@/lib/polygon-relay-contract.mjs";
import { SponsoredTransferForm, SponsoredTransferReview, SponsoredTransferStatus } from "./SponsoredTransferPanel";
import styles from "./company-payment.module.css";

/** Direct EVM receipts and relayed executions retain their own state and proofs. */
export default function PersonalTransferRouter({ DirectPayment }) {
  const { t, locale } = useI18n(), reown = useReownWallet(), relay = usePolygonRelay(reown);
  const statusLabel = value => value.status === "confirmed" ? "walletTransfer.confirmedTitle" : value.status === "authorized" ? "walletTransfer.authorizedTitle"
    : value.status === "reconciliation_required" ? "walletTransfer.reconciliationTitle" : value.status === "failed" ? "walletTransfer.failedTitle"
      : value.failureReason === "preparation_abandoned" ? "companyPayment.abandonedTitle" : value.status === "expired" ? "walletTransfer.expiredTitle" : value.status === "prepared" ? "companyPayment.preparedTitle" : "walletTransfer.pendingTitle";
  return <section className="executive-page"><div className="executive-container" style={{ maxWidth: 840 }}>
    <div className="executive-page-header"><div><h1 className="executive-title">{t("companyPayment.title")}</h1><p className="executive-subtitle">{t("companyPayment.subtitle")}</p></div></div>
    <div className={styles.actions} style={{ marginBottom: 20 }}><Link className="executive-button" href="/dashboard/wallet-personal">{t("walletPage.addFundsAction")}</Link></div>
    {relay.stage === "review" && relay.preview ? <SponsoredTransferReview flow={relay} network="polygon" />
      : relay.payment && relay.stage !== "form" ? <SponsoredTransferStatus flow={relay} network="polygon" /> : <SponsoredTransferForm flow={relay} network="polygon" />}
    <details className="executive-panel" style={{ marginTop: 20 }}><summary className={styles.activitySummary}>{t("companyPayment.historyTitle")} · Polygon</summary>
      {relay.historyLoading ? <p role="status">{t("common.loading")}</p> : !relay.history.length ? <p className={styles.note}>{t("companyPayment.emptyHistory")}</p>
        : <div className="executive-table-wrap"><table className="executive-table"><thead><tr><th>{t("financePage.date")}</th><th>USDT</th><th>{t("financePage.status")}</th></tr></thead><tbody>
          {relay.history.map(raw => { const value = polygonRelayView(raw); return value ? <tr key={value.paymentId}><td>{new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(value.createdAt))}</td>
            <td><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(value.amountAtomic)}</bdi></td><td><button className="executive-button" type="button" disabled={relay.busy} onClick={() => relay.selectHistory(value)}>{t(statusLabel(value))}</button></td></tr> : null; })}
        </tbody></table></div>}
      <button className="executive-button" type="button" style={{ marginTop: 12 }} disabled={relay.busy || relay.historyLoading} onClick={() => relay.refresh()}><RefreshCw size={16} aria-hidden="true" />{t("common.update")}</button>
    </details>
    <DirectPayment historyOnly />
  </div></section>;
}
