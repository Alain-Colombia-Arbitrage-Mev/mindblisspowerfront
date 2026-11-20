"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useReownWallet } from "@/components/reown/ReownContext";
import { usePolygonRelay } from "@/hooks/usePolygonRelay";
import { usePersonalWalletBalance } from "@/hooks/usePersonalWalletBalance";
import { useI18n } from "@/i18n/LanguageProvider";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";
import { formatPersonalCompanyPaymentAmount, personalCompanyPaymentAtomic } from "@/lib/personal-company-payment-values.mjs";
import { polygonRelayView } from "@/lib/polygon-relay-contract.mjs";
import { polygonPaymentAssetName, SponsoredTransferForm, SponsoredTransferReview, SponsoredTransferStatus } from "./SponsoredTransferPanel";
import PaymentWalletActivation from "./PaymentWalletActivation";
import styles from "./company-payment.module.css";

/** Direct EVM receipts and relayed executions retain their own state and proofs. */
export default function PersonalTransferRouter({ DirectPayment }) {
  const { t, locale } = useI18n(), reown = useReownWallet();
  const activationOwner = personalWalletBalanceSessionKey(useMemberSession());
  // Only this page uses the integrated connector. Funding, account management
  // and previous direct payments retain their existing SDK entry points.
  const integratedConnection = reown.paymentConnection?.available === true;
  const relay = usePolygonRelay({ ...reown,
    connectWallet: integratedConnection && reown.connectPaymentWallet || reown.connectWallet,
    prepareWallet: integratedConnection && reown.preparePaymentWallet || reown.prepareWallet,
  }, { fullBalance: true });
  const usdt = usePersonalWalletBalance(relay.wallet, "polygon", relay.verified === true, "USDT");
  const usdc = usePersonalWalletBalance(relay.wallet, "polygon", relay.verified === true, "USDC");
  const selectionOwner = `${activationOwner}:${relay.wallet}`, chosenFor = useRef("");
  const rememberChoice = () => { chosenFor.current = selectionOwner; };
  useEffect(() => {
    if (chosenFor.current === selectionOwner || !relay.verified || relay.busy || relay.historyLoading
      || relay.stage !== "form" || relay.payment || relay.preview || relay.recovery
      || relay.capabilities?.loading || !relay.capabilities?.transferEnabled || !relay.assets?.includes("USDC")) return;
    const available = [usdt, usdc].map(balance => !balance.loading && !balance.error && balance.walletAddress === relay.wallet
      ? personalCompanyPaymentAtomic(balance.balanceAtomic, true) : null);
    if (available.includes(null)) return;
    chosenFor.current = selectionOwner;
    if (relay.asset === "USDT" && available[0] === 0n && available[1] > 0n) relay.changeAsset("USDC");
  }, [selectionOwner, relay, usdt, usdc]);
  const connection = reown.paymentConnection;
  const walletActivation = connection && connection.phase !== "idle" && !relay.connected
    ? <PaymentWalletActivation key={activationOwner} connection={connection} onStart={() => relay.connect()} /> : null;
  const statusLabel = value => value.status === "confirmed" ? "walletTransfer.confirmedTitle" : value.status === "authorized" ? "walletTransfer.authorizedTitle"
    : value.status === "reconciliation_required" ? "walletTransfer.reconciliationTitle" : value.status === "failed" ? "walletTransfer.failedTitle"
      : value.failureReason === "preparation_abandoned" ? "companyPayment.abandonedTitle" : value.status === "expired" ? "walletTransfer.expiredTitle" : value.status === "prepared" ? "companyPayment.preparedTitle" : "walletTransfer.pendingTitle";
  return <section className="executive-page"><div className="executive-container" style={{ maxWidth: 840 }}>
    <div className="executive-page-header"><div><h1 className="executive-title">{t("companyPayment.title")}</h1><p className="executive-subtitle">{t("companyPayment.sponsoredSubtitle")}</p></div></div>
    <div className={styles.actions} style={{ marginBottom: 20 }}><Link className="executive-button" href="/dashboard/wallet-personal">{t("walletPage.addFundsAction")}</Link></div>
    {relay.stage === "review" && relay.preview ? <SponsoredTransferReview flow={relay} network="polygon" walletActivation={walletActivation} />
      : relay.payment && relay.stage !== "form" ? <SponsoredTransferStatus flow={relay} network="polygon" walletActivation={walletActivation} />
        : <SponsoredTransferForm flow={relay} network="polygon" walletActivation={walletActivation} assetBalances={{ USDT: usdt, USDC: usdc }} onPaymentInput={rememberChoice} />}
    <details className="executive-panel" style={{ marginTop: 20 }}><summary className={styles.activitySummary}>{t("companyPayment.historyTitle")} · Polygon</summary>
      {relay.historyLoading ? <p role="status">{t("common.loading")}</p> : !relay.history.length ? <p className={styles.note}>{t("companyPayment.emptyHistory")}</p>
        : <div className="executive-table-wrap"><table className="executive-table"><thead><tr><th>{t("financePage.date")}</th><th>{t("companyPayment.amountLabel")}</th><th>{t("financePage.status")}</th></tr></thead><tbody>
          {relay.history.map(raw => { const value = polygonRelayView(raw); return value ? <tr key={value.paymentId}><td>{new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(value.createdAt))}</td>
            <td><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(value.amountAtomic)} {polygonPaymentAssetName(value.asset)}</bdi></td><td><button className="executive-button" type="button" disabled={relay.busy} onClick={() => { rememberChoice(); relay.selectHistory(value); }}>{t(statusLabel(value))}</button></td></tr> : null; })}
        </tbody></table></div>}
      <button className="executive-button" type="button" style={{ marginTop: 12 }} disabled={relay.busy || relay.historyLoading} onClick={() => relay.refresh()}><RefreshCw size={16} aria-hidden="true" />{t("common.update")}</button>
    </details>
    <DirectPayment historyOnly />
  </div></section>;
}
