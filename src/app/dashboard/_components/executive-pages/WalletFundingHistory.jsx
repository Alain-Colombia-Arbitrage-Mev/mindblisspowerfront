"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import { readWalletFundingHistory } from "@/lib/wallet-funding-client.mjs";
import styles from "./wallet-funding.module.css";

export default function WalletFundingHistory({ walletKind, refreshKey }) {
  const { t, locale } = useI18n();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true, error: false, records: [] });
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: false, records: [] });
    readWalletFundingHistory(walletKind, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ loading: false, error: false, records: data.records });
    }).catch(() => { if (!controller.signal.aborted) setState({ loading: false, error: true, records: [] }); });
    return () => controller.abort();
  }, [walletKind, refreshKey, revision]);

  const labels = { initiated: "funding.initiated", session_created: "funding.sessionCreated", unavailable: "funding.unavailable", failed: "funding.failed" };
  return <section className={`mb-wallet-funding-history ${styles.history}`} aria-label={t("funding.history")}>
    <h3 className="executive-section-title">{t("funding.history")}</h3>
    <p className="mb-onramp-disclosure">{walletKind === "personal" ? t("funding.personalHistoryCopy") : t("funding.sandboxHistoryCopy")}</p>
    {state.loading ? <p role="status" className="mb-onramp-disclosure">{t("common.loading")}</p>
      : state.error ? <div role="status"><p className="mb-onramp-disclosure">{t("funding.historyError")}</p><button type="button"
        className="executive-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button></div>
        : !state.records.length ? <p className="mb-onramp-disclosure">{t("funding.historyEmpty")}</p>
          : <div className="executive-table-wrap"><table className="executive-table"><thead><tr><th>{t("financePage.date")}</th>
            <th>{t("onramp.amountLabel")}</th><th>{t("financePage.status")}</th></tr></thead><tbody>{state.records.map(record => <tr key={record.checkoutReference}>
              <td>{new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(record.createdAt))}</td>
              <td>{new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(record.requestedAmount)}</td>
              <td>{t(labels[record.status])}</td></tr>)}</tbody></table></div>}
  </section>;
}
