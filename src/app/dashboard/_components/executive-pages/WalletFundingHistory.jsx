"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import { readWalletFundingHistory } from "@/lib/wallet-funding-client.mjs";
import { fundingConfirmation } from "@/lib/wallet-funding-contract.mjs";
import { useMemberSession } from "@/lib/member-session-context";
import { walletFundingOwnerKey } from "@/lib/wallet-funding-owner.mjs";
import styles from "./wallet-funding.module.css";

export default function WalletFundingHistory({ walletKind, refreshKey, onSelectRequest = undefined, showHeading = true }) {
  const { t, locale } = useI18n();
  const owner = walletFundingOwnerKey(useMemberSession());
  const epoch = useRef({ owner, generation: 0 }), mounted = useRef(false);
  if (epoch.current.owner !== owner) epoch.current = { owner, generation: epoch.current.generation + 1 };
  const generation = epoch.current.generation;
  const [revision, setRevision] = useState(0);
  const [snapshot, setState] = useState({ generation: -1, loading: true, error: false, records: [] });
  const state = snapshot.generation === generation ? snapshot : { loading: true, error: false, records: [] };
  const active = () => mounted.current && Boolean(owner) && epoch.current.generation === generation;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!owner || walletKind !== "administrative" || epoch.current.generation !== generation) return undefined;
    const controller = new AbortController();
    setState({ generation, loading: true, error: false, records: [] });
    readWalletFundingHistory(walletKind, { signal: controller.signal }).then(data => {
      if (active() && !controller.signal.aborted) setState({ generation, loading: false, error: false, records: data.records });
    }).catch(() => { if (active() && !controller.signal.aborted) setState({ generation, loading: false, error: true, records: [] }); });
    return () => controller.abort();
  }, [owner, generation, walletKind, refreshKey, revision]);

  if (!owner || walletKind !== "administrative") return null;
  const labels = { initiated: "funding.initiated", session_created: "funding.sessionCreated", unavailable: "funding.unavailable", failed: "funding.failed" };
  const testLabels = { pending: "funding.statusSandboxPending", confirmed: "funding.statusSandboxConfirmed", failed: "funding.statusSandboxFailed" };
  const recordLabel = record => {
    const confirmation = fundingConfirmation(record.confirmation, "administrative");
    return confirmation?.source === "meld_sandbox_api" ? testLabels[confirmation.state] || labels[record.status] : labels[record.status];
  };
  return <section className={`mb-wallet-funding-history ${styles.history}`} aria-label={t("funding.history")}>
    {showHeading ? <h3 className="executive-section-title">{t("funding.history")}</h3> : null}
    <p className="mb-onramp-disclosure">{t("funding.sandboxHistoryCopy")}</p>
    {!state.loading && !state.error ? <button type="button" className="executive-button" onClick={() => { if (active()) setRevision(value => value + 1); }}><RefreshCw size={14} aria-hidden="true" />{t("funding.historyRefresh")}</button> : null}
    {state.loading ? <p role="status" className="mb-onramp-disclosure">{t("common.loading")}</p>
      : state.error ? <div role="status"><p className="mb-onramp-disclosure">{t("funding.historyError")}</p><button type="button"
        className="executive-button" onClick={() => { if (active()) setRevision(value => value + 1); }}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button></div>
        : !state.records.length ? <p className="mb-onramp-disclosure">{t("funding.historyEmpty")}</p>
          : <div className="executive-table-wrap"><table className="executive-table"><thead><tr><th>{t("financePage.date")}</th>
            <th>{t("onramp.amountLabel")}</th><th>{t("financePage.status")}</th></tr></thead><tbody>{state.records.map(record => <tr key={record.checkoutReference}>
              <td>{new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(record.createdAt))}</td>
              <td>{new Intl.NumberFormat(locale, { style: "currency", currency: record.sourceCurrencyCode || "USD" }).format(record.requestedAmount)}</td>
              <td><div className={styles.historyStatus}><span>{t(recordLabel(record))}</span>{onSelectRequest ? <button className={styles.historyAction} type="button"
                onClick={() => { if (active()) onSelectRequest(record.checkoutReference); }} aria-label={t("funding.viewStatusFor", { reference: record.checkoutReference.slice(-8) })}>{t("funding.viewStatus")}</button> : null}</div></td></tr>)}</tbody></table></div>}
  </section>;
}
