"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { fundingRequestId } from "@/lib/wallet-funding-client.mjs";
import { administrativeAddress, administrativeUsdtAmount } from "@/lib/administrative-signing-contract.mjs";
import { prepareAdministrativeTransfer, readAdministrativeTransferHistory } from "@/lib/administrative-signing-client.mjs";
import styles from "./administrative-operations.module.css";

/** A review-only draft. No transaction or signature can be sent from this component. */
export default function AdministrativeTransferDraft({ assignedAddress, signerReady = false, disabled = false, ensureActive, onSignerInvalid = undefined }) {
  const { t, locale } = useI18n(), id = useId();
  const [recipient, setRecipient] = useState(""), [amount, setAmount] = useState(""), [draft, setDraft] = useState(null);
  const [records, setRecords] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const mounted = useRef(false), epoch = useRef(0), pending = useRef(null), live = useRef(false);
  live.current = !disabled && signerReady;
  const generation = epoch.current;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; epoch.current++; pending.current?.abort(); }; }, []);
  useEffect(() => { if (!signerReady || disabled) { epoch.current++; pending.current?.abort(); pending.current = null; setBusy(false); setDraft(null); setRecords(null); } }, [signerReady, disabled, assignedAddress]);
  function edit(update, value) {
    if (!mounted.current || pending.current) return;
    epoch.current++; setDraft(null); setError(""); update(value);
  }
  async function run(history = false) {
    if (!mounted.current || !live.current || pending.current || generation !== epoch.current
      || (!history && (!administrativeAddress(recipient) || !administrativeUsdtAmount(amount)))) return;
    const controller = new AbortController(), operation = epoch.current;
    pending.current = controller; setBusy(true); setError(""); if (!history) setDraft(null);
    const active = () => mounted.current && live.current && !controller.signal.aborted && epoch.current === operation;
    try {
      await ensureActive(); if (!active()) return;
      if (history) {
        const next = await readAdministrativeTransferHistory(assignedAddress, { signal: controller.signal }); if (active()) setRecords(next.records);
      } else {
        const next = await prepareAdministrativeTransfer({ requestId: fundingRequestId(), recipient, amount }, assignedAddress, { signal: controller.signal }); if (active()) setDraft(next);
      }
    } catch (failure) { if (active()) {
      const code = failure?.message;
      setError(code === "administrative_transfer_binding_required" ? "activateFirst" : code === "administrative_transfer_invalid_recipient" ? "invalidRecipient"
        : code === "administrative_transfer_invalid_amount" ? "invalidAmount" : code === "administrative_transfer_rate_limited" ? "rateLimited" : "unavailable");
      if (code === "administrative_transfer_binding_required") onSignerInvalid?.();
      if (history) setRecords(null);
    } }
    finally { if (pending.current === controller) pending.current = null; if (active()) setBusy(false); }
  }
  return <section id="administrative-send" tabIndex={-1} className={`executive-panel ${styles.panel}`} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>{t("administrativeSigning.transferTitle")}</h2><div className={styles.body}>
      <p>{t("administrativeSigning.simulation")}</p>
      {!signerReady ? <div className={styles.activationPrompt}><p>{t("administrativeSigning.activateFirst")}</p>
        <a className="executive-button" href="#administrative-signing">{t("administrativeSigning.activateConnection")}</a></div> : null}
      <form className={styles.form} onSubmit={event => { event.preventDefault(); void run(); }}>
        <label htmlFor={`${id}-recipient`}>{t("administrativeSigning.recipient")}<input id={`${id}-recipient`} value={recipient} autoComplete="off" spellCheck={false} dir="ltr"
          onChange={event => edit(setRecipient, event.target.value)} disabled={busy || disabled} placeholder="0x…" /></label>
        <label htmlFor={`${id}-amount`}>{t("administrativeSigning.amount")}<input id={`${id}-amount`} value={amount} inputMode="decimal" autoComplete="off" dir="ltr"
          onChange={event => edit(setAmount, event.target.value)} disabled={busy || disabled} placeholder="0.00" /></label>
        <button type="submit" className="executive-button" disabled={busy || disabled || !signerReady || !administrativeAddress(recipient) || !administrativeUsdtAmount(amount)}>{t("administrativeSigning.prepare")}</button>
      </form>
      {error ? <p role="alert">{t(`administrativeSigning.${error}`)}</p> : null}
      {draft ? <section aria-label={t("administrativeSigning.review")}><h3>{t("administrativeSigning.review")}</h3><p>{t("administrativeSigning.simulation")}</p>
        <dl><dt>{t("administrativeSigning.recipient")}</dt><dd><code dir="ltr">{draft.recipient}</code></dd><dt>{t("administrativeSigning.amount")}</dt><dd><bdi>{draft.amount} USDT · Polygon</bdi></dd>
          <dt>{t("administrativeSigning.reference")}</dt><dd><code dir="ltr">{draft.draftReference}</code></dd></dl></section> : null}
      <button type="button" className="executive-button" disabled={busy || disabled || !signerReady} onClick={() => void run(true)}>{t("administrativeSigning.history")}</button>
      {records ? records.length ? <ul className={styles.history}>{records.map(record => <li key={record.draftReference}><strong>{t("administrativeSigning.draft")}</strong>
        <bdi>{record.amount} USDT</bdi><code dir="ltr">{record.recipient}</code><small>{new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(record.createdAt))}</small></li>)}</ul>
        : <p>{t("funding.historyEmpty")}</p> : null}
    </div></section>;
}
