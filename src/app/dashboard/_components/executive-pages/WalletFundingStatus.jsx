"use client";

import { CheckCircle2, Clock3, Info, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { readWalletFundingStatus } from "@/lib/wallet-funding-client.mjs";
import { fundingStatus, FUNDING_UUID } from "@/lib/wallet-funding-contract.mjs";
import styles from "./wallet-funding.module.css";

/** Current native API deliberately accepts no paid/confirmed response. */
export function currentFundingView(value, walletKind, checkoutReference) {
  if (walletKind !== "personal") return null;
  const safe = fundingStatus(value, walletKind);
  if (!safe || typeof checkoutReference !== "string" || !FUNDING_UUID.test(checkoutReference)
    || safe.checkoutReference.toLowerCase() !== checkoutReference.toLowerCase()) return null;
  return { walletKind, checkoutReference: safe.checkoutReference, requestedAmount: safe.requestedAmount, sourceCurrencyCode: safe.sourceCurrencyCode || "USD",
    destination: safe.destination, testMode: safe.confirmation.testMode, requestStatus: safe.requestStatus,
    state: { session_created: "checkout_ready", unavailable: "request_unavailable", failed: "checkout_failed" }[safe.requestStatus] || "unconfirmed" };
}

export default function WalletFundingStatus({ walletKind, checkoutReference, focusKey = 0 }) {
  const { t } = useI18n();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: "", loading: true, view: null, error: "" });
  const card = useRef(null);
  const key = `${walletKind}:${checkoutReference}`;
  const current = state.key === key;
  const loading = !current || state.loading;
  useEffect(() => {
    if (!FUNDING_UUID.test(checkoutReference || "") || walletKind !== "personal") return undefined;
    const controller = new AbortController();
    setState({ key, loading: true, view: null, error: "" });
    readWalletFundingStatus(walletKind, checkoutReference, { signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return;
      const view = currentFundingView(data, walletKind, checkoutReference);
      if (!view) throw Error("funding_unavailable");
      setState({ key, loading: false, view, error: "" });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, loading: false, view: null,
        error: error?.message === "wallet_funding_not_found" ? "funding.statusNotFound" : error?.message === "unauthenticated" ? "recharge.providerSession" : "funding.statusUnavailable" });
    });
    return () => controller.abort();
  }, [walletKind, checkoutReference, key, revision, focusKey]);

  useEffect(() => {
    if (!focusKey || !card.current) return;
    card.current.focus({ preventScroll: true });
    const reduced = typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.current.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }, [checkoutReference, focusKey]);

  if (!FUNDING_UUID.test(checkoutReference || "") || walletKind !== "personal") return null;
  return <section ref={card} tabIndex={-1} id={`${walletKind}-funding-status`} className={`executive-panel ${styles.statusPanel}`} aria-label={t("funding.statusTitle")} aria-busy={loading}>
    <div aria-live="polite">
      {loading ? <><h2 className={styles.statusHeading}><Loader2 size={20} className="animate-spin" aria-hidden="true" />{t("funding.statusTitle")}</h2><p className={styles.hint}>{t("funding.statusLoading")}</p></>
        : state.error ? <><h2 className={styles.statusHeading}><Info size={20} aria-hidden="true" />{t("funding.statusTitle")}</h2><p className={styles.hint} role="alert">{t(state.error)}</p></>
          : <WalletFundingStatusView view={state.view} />}
    </div>
    <button className="executive-button" type="button" disabled={loading} onClick={() => setRevision(value => value + 1)}>
      <RefreshCw size={16} aria-hidden="true" />{t("funding.statusRefresh")}
    </button>
  </section>;
}

/** Presentation for future trusted settlement states. Native reads cannot reach confirmed today. */
export function WalletFundingStatusView({ view }) {
  const { t, locale } = useI18n();
  if (!view || view.walletKind !== "personal" || view.testMode === true) return null;
  const received = typeof view.receivedAmount === "string" && /^(?:0|[1-9]\d{0,17})(?:\.\d{1,18})?$/.test(view.receivedAmount)
    && !/^0(?:\.0+)?$/.test(view.receivedAmount);
  const confirmedAt = typeof view.confirmedAt === "string" && Number.isFinite(Date.parse(view.confirmedAt));
  const state = view.state === "confirmed" && (!received || !confirmedAt) ? "unconfirmed" : view.state;
  const confirmed = state === "confirmed";
  const labels = { checkout_ready: "funding.statusCheckoutReady", unconfirmed: "funding.statusUnconfirmed", pending: "funding.statusPending", confirmed: "funding.statusConfirmed", failed: "funding.statusFailed",
    request_unavailable: "funding.statusRequestUnavailable", checkout_failed: "funding.statusCheckoutFailed" };
  const copy = { checkout_ready: "funding.statusCheckoutReadyCopy", unconfirmed: "funding.statusUnconfirmedCopy", pending: "funding.statusPendingCopy", confirmed: "funding.statusConfirmedCopy", failed: "funding.statusFailedCopy",
    request_unavailable: "funding.statusRequestUnavailableCopy", checkout_failed: "funding.statusCheckoutFailedCopy" };
  const Icon = confirmed ? CheckCircle2 : state === "failed" ? XCircle : state === "pending" ? Clock3 : Info;
  return <div className={confirmed ? styles.confirmedStatus : state === "failed" ? styles.failedStatus : ""}>
    <h2 className={styles.statusHeading}><Icon size={21} aria-hidden="true" />{t(labels[state] || "funding.statusUnconfirmed")}</h2>
    <p className={styles.hint}>{t(copy[state] || "funding.statusUnconfirmedCopy")}</p>
    <dl className={styles.statusDetails}>
      <div><dt>{t("funding.statusRequestedAmount")}</dt><dd>{new Intl.NumberFormat(locale, { style: "currency", currency: view.sourceCurrencyCode || "USD" }).format(view.requestedAmount)}</dd></div>
      {confirmed ? <div><dt>{t("funding.statusReceived")}</dt><dd><bdi dir="ltr">{view.receivedAmount} USDT</bdi></dd></div> : null}
      <div><dt>{t("funding.reviewDestination")}</dt><dd><code dir="ltr">{view.destination.address}</code><small>USDT · {view.destination.network === "ethereum" ? "Ethereum" : "Polygon"}</small></dd></div>
      {confirmed ? <div><dt>{t("funding.statusConfirmedAt")}</dt><dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(view.confirmedAt))}</dd></div> : null}
      <div><dt>{t("funding.statusReference")}</dt><dd><code dir="ltr">{view.checkoutReference}</code></dd></div>
    </dl>
  </div>;
}
