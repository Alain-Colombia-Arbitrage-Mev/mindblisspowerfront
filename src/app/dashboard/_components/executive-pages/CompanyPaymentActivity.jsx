"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";
import { readCompanyPaymentActivity } from "@/lib/company-payment-client.mjs";
import { formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import styles from "./company-payment.module.css";

const canonicalLabels = { prepared: "preparedTitle", submitted: "submittedTitle", confirmed: "confirmedTitle", failed: "paymentFailed", abandoned: "abandonedTitle" };
const reportedLabels = { wallet_prompt_opened: "activityWalletPrompt", wallet_rejected: "activityWalletRejected", wallet_failed: "activityWalletFailed",
  broadcast_uncertain: "activityBroadcastUncertain", broadcast_observed: "activityBroadcastObserved", recovery_detected: "activityRecovery",
  registration_failed: "activityRegistrationFailed", verification_requested: "activityVerificationRequested", verification_failed: "activityVerificationFailed" };
const empty = scope => ({ scope, events: [], nextCursor: null, loaded: false, loading: false, error: false });

export default function CompanyPaymentActivity({ walletAddress = "" }) {
  const { t, locale } = useI18n();
  const sessionKey = personalWalletBalanceSessionKey(useMemberSession());
  const scope = sessionKey && /^0x[0-9a-f]{40}$/.test(walletAddress) ? `${sessionKey}:${walletAddress}` : "";
  const owner = useRef(scope), request = useRef(null);
  owner.current = scope;
  const [opened, setOpened] = useState(false), [state, setState] = useState(() => empty(scope));
  const current = state.scope === scope ? state : empty(scope);

  useEffect(() => {
    request.current?.abort(); request.current = null;
    setState(empty(scope)); setOpened(false);
    return () => { request.current?.abort(); request.current = null; };
  }, [scope]);

  const load = useCallback(async (append = false) => {
    if (!scope || request.current) return;
    const controller = new AbortController(); request.current = controller;
    const cursor = append ? current.nextCursor : undefined;
    setState(previous => ({ ...(append && previous.scope === scope ? previous : empty(scope)), loading: true, error: false }));
    try {
      const result = await readCompanyPaymentActivity({ limit: 20, ...(cursor ? { cursor } : {}), signal: controller.signal });
      if (controller.signal.aborted || request.current !== controller || owner.current !== scope) return;
      if (result.events.some(event => event.walletAddress !== walletAddress)) throw new Error("company_payment_wallet_changed");
      setState(previous => {
        const events = new Map((append && previous.scope === scope ? previous.events : []).map(event => [event.eventId, event]));
        for (const event of result.events) if (!events.has(event.eventId)) events.set(event.eventId, event);
        return { scope, events: [...events.values()], nextCursor: result.nextCursor, loaded: true, loading: false, error: false };
      });
    } catch {
      if (!controller.signal.aborted && request.current === controller && owner.current === scope) {
        setState(previous => ({ ...previous, scope, loaded: true, loading: false, error: true }));
      }
    } finally { if (request.current === controller) request.current = null; }
  }, [scope, walletAddress, current.nextCursor]);

  useEffect(() => { if (opened && scope && state.scope === scope && !current.loaded && !current.loading) void load(); }, [opened, scope, state.scope, current.loaded, current.loading, load]);

  return <details className={`executive-panel ${styles.activity}`} open={opened} onToggle={event => {
    const next = event.currentTarget.open; setOpened(next);
    if (!next) { request.current?.abort(); request.current = null; setState(previous => ({ ...previous, loading: false })); }
  }}>
    <summary className={styles.activitySummary}>{t("companyPayment.activityTitle")}</summary>
    {opened ? <div className={styles.panel} aria-busy={current.loading}>
      <p className={styles.note}>{t("companyPayment.activityCopy")}</p>
      {!scope ? <p className={styles.note}>{t("companyPayment.connectCopy")}</p> : <>
        {current.loading ? <p role="status" className={styles.note}>{t("common.loading")}</p> : null}
        {current.error ? <p role="alert" className={styles.error}>{t("companyPayment.activityUnavailable")}</p> : null}
        {current.loaded && !current.loading && !current.error && !current.events.length ? <p className={styles.note}>{t("companyPayment.activityEmpty")}</p> : null}
        {current.events.length ? <ol className={styles.activityList}>
          {current.events.map(event => {
            const canonical = event.source === "canonical";
            const snapshot = canonical && event.event === "snapshot";
            const label = canonical ? snapshot ? "activitySnapshot" : canonicalLabels[event.event]
              : reportedLabels[event.event];
            return <li key={event.eventId} className={styles.activityItem}>
              <div className={styles.activityMeta}><span>{t(canonical ? "companyPayment.activityCanonical" : "companyPayment.activityClient")}</span>
                <time dateTime={event.recordedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(event.recordedAt))}</time></div>
              <strong>{t(`companyPayment.${label}`)}</strong>
              {snapshot ? <p className={styles.note}>{t("companyPayment.activitySnapshotCopy")}</p> : null}
              <div className={styles.activityMeta}><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(event.amountAtomic)} USDT</bdi><span>{event.chainId === 137 ? "Polygon" : "Ethereum"}</span></div>
              {event.transactionHash ? <a className={styles.activityHash} href={`https://${event.chainId === 137 ? "polygonscan.com" : "etherscan.io"}/tx/${event.transactionHash}`} target="_blank" rel="noreferrer noopener">
                <span className="sr-only">{t("companyPayment.hashLabel")} </span><code dir="ltr">{event.transactionHash}</code></a> : null}
            </li>;
          })}
        </ol> : null}
        <div className={styles.actions}><button className="executive-button" type="button" disabled={current.loading} onClick={() => void load()}><RefreshCw size={16} aria-hidden="true" />{t("common.update")}</button>
          {current.nextCursor ? <button className="executive-button" type="button" disabled={current.loading} onClick={() => void load(true)}>{t("companyPayment.activityMore")}</button> : null}</div>
      </>}
    </div> : null}
  </details>;
}
