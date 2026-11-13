"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import { useMemberSession } from "@/lib/member-session-context";
import { walletFundingOwnerKey } from "@/lib/wallet-funding-owner.mjs";
import { meldCheckoutDestination, meldCheckoutStatus, MELD_CHECKOUT_REFERENCE } from "@/lib/administrative-meld-checkout-contract.mjs";
import { readAdministrativeMeldCheckoutHistory, readAdministrativeMeldCheckoutStatus } from "@/lib/administrative-meld-checkout-client.mjs";
import { WalletFundingStatusView } from "./WalletFundingStatus";
import styles from "./wallet-funding.module.css";

/** This namespace never treats a minted link or browser return as a payment. */
export default function AdministrativeMeldCheckoutActivity({ enabled = false, expectedAddress, checkoutReference = "", refreshKey = 0, onSelectRequest }) {
  const { t, locale } = useI18n(), owner = walletFundingOwnerKey(useMemberSession());
  const context = `${owner}:${expectedAddress}:${enabled}`;
  const epoch = useRef({ context, generation: 0 }), mounted = useRef(false);
  if (epoch.current.context !== context) epoch.current = { context, generation: epoch.current.generation + 1 };
  const generation = epoch.current.generation;
  const [revision, setRevision] = useState(0), [statusRevision, setStatusRevision] = useState(0);
  const [history, setHistory] = useState({ generation: -1, loading: true, error: false, records: [] });
  const [status, setStatus] = useState({ key: "", loading: true, error: false, value: null });
  const eligible = Boolean(enabled && owner && meldCheckoutDestination({ address: expectedAddress, asset: "USDT", network: "polygon", chainId: 137 }));
  const active = () => mounted.current && eligible && epoch.current.generation === generation;
  const key = `${generation}:${checkoutReference}`, selection = MELD_CHECKOUT_REFERENCE.test(checkoutReference || "") && checkoutReference.length === 36;
  const currentHistory = history.generation === generation ? history : { loading: true, error: false, records: [] };
  const currentStatus = status.key === key ? status : { loading: true, error: false, value: null };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!eligible) return undefined;
    const controller = new AbortController();
    setHistory({ generation, loading: true, error: false, records: [] });
    readAdministrativeMeldCheckoutHistory({ signal: controller.signal, expectedAddress }).then(value => {
      if (active() && !controller.signal.aborted) setHistory({ generation, loading: false, error: false, records: value.records });
    }).catch(() => { if (active() && !controller.signal.aborted) setHistory({ generation, loading: false, error: true, records: [] }); });
    return () => controller.abort();
  }, [context, generation, eligible, expectedAddress, refreshKey, revision]);
  useEffect(() => {
    if (!eligible || !selection) return undefined;
    const controller = new AbortController();
    setStatus({ key, loading: true, error: false, value: null });
    readAdministrativeMeldCheckoutStatus(checkoutReference, { signal: controller.signal, expectedAddress }).then(value => {
      const safe = meldCheckoutStatus(value);
      if (!safe || safe.checkoutReference !== checkoutReference.toLowerCase() || safe.destination.address.toLowerCase() !== expectedAddress.toLowerCase()) throw Error("meld_checkout_unavailable");
      if (active() && !controller.signal.aborted) setStatus({ key, loading: false, error: false, value: safe });
    }).catch(() => { if (active() && !controller.signal.aborted) setStatus({ key, loading: false, error: true, value: null }); });
    return () => controller.abort();
  }, [context, generation, eligible, selection, checkoutReference, expectedAddress, key, statusRevision]);

  if (!eligible) return null;
  const fiat = record => new Intl.NumberFormat(locale, { style: "currency", currency: record.sourceCurrencyCode }).format(record.requestedAmount);
  const labels = { initiated: "funding.initiated", minted: "funding.meldCheckoutPrepared", unavailable: "funding.unavailable" };
  const results = { pending: "funding.statusSandboxPending", confirmed: "funding.statusSandboxConfirmed", failed: "funding.statusSandboxFailed" };
  const recordLabel = record => record.confirmation.source === "meld_sandbox_api" ? results[record.confirmation.state] : labels[record.requestStatus];
  const proof = currentStatus.value?.confirmation;
  const verifiedView = proof?.source === "meld_sandbox_api" ? { ...currentStatus.value, ...proof, walletKind: "administrative", testMode: true, confirmationSource: proof.source } : null;
  return <section className={`executive-panel ${styles.history}`} aria-label={t("funding.meldCheckoutHistory")}>
    <h2 className={styles.statusHeading}>{t("funding.meldCheckoutHistory")}</h2>
    <p className={styles.hint}>{t("funding.sandboxHistoryCopy")}</p>
    {selection ? <section className={styles.detailCard} aria-label={t("funding.statusTitle")} aria-busy={currentStatus.loading}>
      <div aria-live="polite">{currentStatus.loading ? <p role="status">{t("funding.statusLoading")}</p>
        : currentStatus.error ? <p role="alert">{t("funding.statusUnavailable")}</p>
          : verifiedView ? <><WalletFundingStatusView view={verifiedView} /><p>{t("funding.providerLabel")}: {proof.serviceProvider === "BANXA" ? "Banxa" : "Transak"}</p></>
            : currentStatus.value ? <><h3>{t(recordLabel(currentStatus.value))}</h3><p>{t("funding.meldCheckoutPreparedCopy")}</p>
              <p>{fiat(currentStatus.value)} · USDT · Polygon</p><code dir="ltr">{currentStatus.value.checkoutReference}</code></> : null}</div>
      <button type="button" className="executive-button" disabled={currentStatus.loading} onClick={() => { if (active()) setStatusRevision(value => value + 1); }}>
        <RefreshCw size={14} aria-hidden="true" />{t("funding.statusRefresh")}</button>
    </section> : null}
    <button type="button" className="executive-button" disabled={currentHistory.loading} onClick={() => { if (active()) setRevision(value => value + 1); }}>
      <RefreshCw size={14} aria-hidden="true" />{t("funding.historyRefresh")}</button>
    {currentHistory.loading ? <p role="status">{t("common.loading")}</p> : currentHistory.error ? <p role="alert">{t("funding.historyError")}</p>
      : !currentHistory.records.length ? <p className={styles.hint}>{t("funding.historyEmpty")}</p>
        : <div className="executive-table-wrap"><table className="executive-table"><thead><tr><th>{t("financePage.date")}</th><th>{t("onramp.amountLabel")}</th><th>{t("financePage.status")}</th></tr></thead>
          <tbody>{currentHistory.records.map(record => <tr key={record.checkoutReference}>
            <td>{new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(record.createdAt))}</td><td>{fiat(record)}</td>
            <td><div className={styles.historyStatus}><span>{t(recordLabel(record))}{record.confirmation.source === "meld_sandbox_api"
              ? <small> · {record.confirmation.serviceProvider === "BANXA" ? "Banxa" : "Transak"}</small> : null}</span><button type="button" className={styles.historyAction}
              onClick={() => { if (active()) onSelectRequest?.(record.checkoutReference); }} aria-label={t("funding.viewStatusFor", { reference: record.checkoutReference.slice(-8) })}>{t("funding.viewStatus")}</button></div></td>
          </tr>)}</tbody></table></div>}
  </section>;
}
