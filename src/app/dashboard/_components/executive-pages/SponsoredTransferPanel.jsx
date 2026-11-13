"use client";

import { useId } from "react";
import { ArrowRight, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import { LEGACY_POLYGON_COMPANY_PAYMENT, personalCompanyPaymentAtomic, personalCompanyPaymentAmountAtomic, formatPersonalCompanyPaymentAmount } from "@/lib/personal-company-payment-values.mjs";
import { polygonRelayView } from "@/lib/polygon-relay-contract.mjs";
import { SOLANA_PERSONAL_WALLET, solanaAddress, solanaAtomic, solanaPaymentView } from "@/lib/solana-wallet-contract.mjs";
import styles from "./company-payment.module.css";

const networkPolicy = network => network === "polygon" ? LEGACY_POLYGON_COMPANY_PAYMENT : network === "solana" ? SOLANA_PERSONAL_WALLET : null;
const networkName = network => network === "polygon" ? "Polygon" : "Solana";
export function TransferNetworkPicker({ selected, onChange, disabled = false, solanaEnabled = false }) {
  const { t } = useI18n();
  const options = solanaEnabled ? ["ethereum", "polygon", "solana"] : ["ethereum", "polygon"];
  return <fieldset className={styles.networks} disabled={disabled}><legend>{t("companyPayment.chooseNetwork")}</legend>
    <div className={`${styles.networkChoices}${solanaEnabled ? ` ${styles.threeNetworks}` : ""}`} role="radiogroup" aria-label={t("companyPayment.chooseNetwork")}>
      {options.map((network, index) => <button type="button" role="radio" aria-checked={selected === network} key={network}
        tabIndex={selected === network ? 0 : -1} data-transfer-network={network} disabled={disabled}
        className={`${styles.networkOption}${selected === network ? ` ${styles.networkSelected}` : ""}`} onClick={() => onChange(network)}
        onKeyDown={event => {
          const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
            : ["ArrowRight", "ArrowDown"].includes(event.key) ? (index + 1) % options.length
              : ["ArrowLeft", "ArrowUp"].includes(event.key) ? (index + options.length - 1) % options.length : null;
          if (disabled || next === null) return;
          event.preventDefault(); onChange(options[next]);
          const target = event.currentTarget.parentElement?.querySelector(`[data-transfer-network="${options[next]}"]`);
          if (target && "focus" in target && typeof target.focus === "function") target.focus();
        }}><span>{network === "ethereum" ? "Ethereum" : networkName(network)}</span><bdi dir="ltr">USDT</bdi></button>)}
    </div><small>{t("companyPayment.networkSelectionCopy")}</small>
  </fieldset>;
}

export function SponsoredTransferForm({ flow, network = "polygon", walletActivation = null }) {
  const { t } = useI18n(); const id = useId();
  const walletState = network === "polygon" ? flow.walletState : undefined;
  const walletActionCopy = { activate: "funding.activateWalletCopy", activating: "funding.activateWalletCopy", checking: "walletPage.checkingCopy",
    error: "walletPage.checkUnavailable", unavailable: "recharge.providerConfiguration", reconnect: "companyPayment.reconnectCopy" }[walletState];
  const walletActionLabel = { activate: "funding.activateWallet", activating: "funding.activatingWallet", checking: "walletPage.checking",
    error: "walletPage.retryCheck", unavailable: "funding.activateWallet", reconnect: "companyPayment.reconnect" }[walletState];
  const walletActionDisabled = flow.busy || flow.restoring || (walletState && !["activate", "error", "reconnect"].includes(walletState));
  const available = network === "solana" ? solanaAtomic(flow.balanceAtomic) : personalCompanyPaymentAtomic(flow.balanceAtomic, true)?.toString() ?? null;
  const entered = personalCompanyPaymentAmountAtomic(flow.amount);
  const validAmount = entered !== null && (network !== "solana" || solanaAtomic(entered, false) !== null);
  const insufficient = available !== null && validAmount && BigInt(entered) > BigInt(available);
  const invalid = flow.amount !== "" && (!validAmount || insufficient);
  const ready = (!walletState || walletState === "ready") && flow.connected && !flow.busy && !flow.loadingBalance && !flow.capabilities?.loading && !flow.capabilities?.error && flow.capabilities?.transferEnabled === true;
  const canReview = ready && !walletActivation && available !== null && validAmount && !insufficient;
  const error = flow.errorKey ? t(flow.errorKey) : "";
  return <form className={`executive-panel ${styles.panel}`} aria-label={t("companyPayment.title")} onSubmit={event => { event.preventDefault(); if (canReview) void flow.review(); }}>
    <div className={styles.balance} aria-live="polite"><span>{t(network === "solana" ? "walletTransfer.solanaBalance" : "companyPayment.availableBalance")}{network === "polygon" ? " · Polygon" : ""}</span>
      <strong><bdi dir="ltr">{available !== null ? `${formatPersonalCompanyPaymentAmount(available)} USDT` : flow.loadingBalance ? t("companyPayment.loadingBalance") : "—"}</bdi></strong>
      {flow.loadingBalance && available !== null ? <small role="status">{t("walletTransfer.updatingBalance")}</small> : null}
      <button type="button" className={styles.refresh} disabled={flow.busy || flow.loadingBalance} onClick={() => void flow.refresh()} aria-label={t("companyPayment.refreshBalance")}><RefreshCw size={17} aria-hidden="true" /></button>
    </div>
    {network === "solana" ? <p className={styles.note}>{t("walletTransfer.solanaScope")}</p> : null}
    <div className={styles.field}><label htmlFor={`${id}-amount`}>{t("companyPayment.amountLabel")}</label><div className={styles.amountInput}><span>USDT</span>
      <input id={`${id}-amount`} type="text" inputMode="decimal" autoComplete="off" dir="ltr" placeholder="0.00" maxLength={86} value={flow.amount}
        disabled={flow.busy || !flow.verified} onChange={event => flow.setAmount(event.target.value.replace(/[,٫]/g, "."))}
        aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined} required />
      <button type="button" className={styles.max} disabled={flow.busy || !flow.verified || available === null || available === "0"} onClick={() => flow.setAmount(formatPersonalCompanyPaymentAmount(available))}>{t("companyPayment.max")}</button>
    </div>{invalid ? <p className={styles.fieldError} id={`${id}-error`} role="alert">{t(insufficient ? "companyPayment.insufficientBalance" : "companyPayment.amountInvalid")}</p> : null}</div>
    <div className={styles.destination}><div className={styles.destinationHeading}><label htmlFor={`${id}-recipient`}>{t("companyPayment.recipientLabel")}</label><span>{networkName(network)} · USDT</span></div>
      <output id={`${id}-recipient`} className={`${styles.readonlyAddress} ${styles.recipientName}`}>Mindbliss</output></div>
    {flow.verified ? flow.capabilities?.loading ? <p className={styles.note} role="status"><Loader2 className="animate-spin" size={16} aria-hidden="true" />{t("walletTransfer.checkingSponsorship")}</p>
      : flow.capabilities?.error ? <p className={styles.note} role="status">{t("walletTransfer.sponsorCheckFailed")}</p>
        : flow.capabilities?.transferEnabled ? <p className={styles.note}><ShieldCheck size={16} aria-hidden="true" /><span>{t("walletTransfer.sponsored")}. {t(network === "solana" ? "walletTransfer.solanaSponsoredCopy" : "walletTransfer.sponsoredCopy")}</span></p>
          : <p className={styles.note} role="status">{t("walletTransfer.sponsorUnavailable")}</p> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {flow.errorKey === "walletTransfer.networkMismatch" ? <button type="button" className="executive-button" disabled={flow.busy} onClick={() => void flow.switchNetwork()}>{t("companyPayment.polygonSwitchNetwork")}</button> : null}
    {walletActivation || (flow.connected && (!walletState || walletState === "ready") ? <button className={`executive-button primary ${styles.primary}`} type="submit" disabled={!canReview}><ArrowRight size={17} aria-hidden="true" />{t("companyPayment.review")}</button>
      : walletState ? <><p className={styles.note} role={["checking", "activating"].includes(walletState) ? "status" : undefined}>{t(walletActionCopy || "walletPage.checkingCopy")}</p>
        <button className={`executive-button primary ${styles.primary}`} type="button" disabled={walletActionDisabled} onClick={() => {
          if (!walletActionDisabled) { if (walletState === "error") void flow.refresh(); else void flow.connect(); }
        }}>
          {flow.busy || ["checking", "activating"].includes(walletState) ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <WalletCards size={17} aria-hidden="true" />}
          {t(flow.busy && walletState === "activate" ? "funding.activatingWallet" : walletActionLabel || "walletPage.checking")}</button></>
      : <><p className={styles.note}>{t(flow.restoring ? "companyPayment.restoringCopy" : flow.needsVerification ? "companyPayment.verifyWalletCopy" : "companyPayment.reconnectCopy")}</p>
        <button className={`executive-button primary ${styles.primary}`} type="button" disabled={flow.busy || flow.restoring} onClick={() => void flow.connect()}>
          {flow.busy || flow.restoring ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <WalletCards size={17} aria-hidden="true" />}
          {t(flow.restoring ? "companyPayment.restoring" : flow.needsVerification ? "companyPayment.verifyWallet" : "companyPayment.reconnect")}</button></>)}
    <p className={styles.pending}>{t("companyPayment.allocationPending")}</p>
  </form>;
}

export function SponsoredTransferReview({ flow, network = "polygon", walletActivation = null }) {
  const { t } = useI18n(); const value = flow.preview, policy = networkPolicy(network);
  const valid = policy && value?.walletAddress === flow.wallet && (network === "solana" ? solanaAddress(value.walletAddress) && solanaAtomic(value.amountAtomic, false) : /^0x[0-9a-f]{40}$/.test(value.walletAddress) && personalCompanyPaymentAtomic(value.amountAtomic))
    && value.recipientAddress === policy.recipientAddress
    && (network !== "polygon" || (value.chainId === LEGACY_POLYGON_COMPANY_PAYMENT.chainId
      && value.tokenAddress === LEGACY_POLYGON_COMPANY_PAYMENT.tokenAddress && value.tokenDecimals === LEGACY_POLYGON_COMPANY_PAYMENT.tokenDecimals));
  return <section className={`executive-panel ${styles.panel}`} aria-label={t("companyPayment.reviewTitle")} aria-busy={flow.busy}>
    <header className={styles.heading}><ShieldCheck size={22} aria-hidden="true" /><div><h2>{t("companyPayment.reviewTitle")}</h2><p>{t("walletTransfer.confirmCopy")}</p></div></header>
    {valid ? <><div className={styles.reviewAmount}><span>{t("companyPayment.amountLabel")}</span><strong><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(value.amountAtomic)} USDT</bdi></strong></div>
      <dl className={styles.reviewDetails}><div><dt>{t("companyPayment.senderLabel")}</dt><dd><code dir="ltr">{value.walletAddress}</code></dd></div><div><dt>{t("companyPayment.recipientLabel")}</dt><dd>Mindbliss</dd></div>
        <div><dt>{t("companyPayment.networkLabel")}</dt><dd>{networkName(network)} · USDT</dd></div><div><dt>{t("walletTransfer.sponsored")}</dt><dd><bdi dir="ltr">0 {network === "polygon" ? "POL" : "SOL"}</bdi></dd></div></dl>
    </> : <p className={styles.error} role="alert">{t("companyPayment.invalidReview")}</p>}
    {network === "polygon" ? <p className={styles.note}>{t("walletTransfer.authorizationCopy")}</p> : null}
    {flow.errorKey ? <p className={styles.error} role="alert">{t(flow.errorKey)}</p> : null}
    {flow.errorKey === "walletTransfer.networkMismatch" ? <button type="button" className="executive-button" disabled={flow.busy} onClick={() => void flow.switchNetwork()}>{t("companyPayment.polygonSwitchNetwork")}</button> : null}
    {walletActivation || (!flow.connected ? <button type="button" className="executive-button" disabled={flow.busy || flow.restoring}
      onClick={() => { if (!flow.busy && !flow.restoring) void flow.connect(); }}>{t(flow.restoring ? "companyPayment.restoring" : flow.needsVerification ? "companyPayment.verifyWallet" : "companyPayment.reconnect")}</button> : null)}
    <div className={styles.actions}><button className="executive-button" type="button" disabled={flow.busy} onClick={flow.cancelReview}>{t("walletTransfer.closeReview")}</button>
      <button className={`executive-button primary ${styles.primary}`} type="button" disabled={!valid || !flow.connected || Boolean(walletActivation) || flow.busy || flow.capabilities?.loading || Boolean(flow.capabilities?.error) || !flow.capabilities?.transferEnabled}
        onClick={() => { if (valid && flow.connected && !walletActivation && !flow.busy && !flow.capabilities?.loading && !flow.capabilities?.error && flow.capabilities?.transferEnabled) void flow.confirm(); }}>
        {flow.busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(flow.busy ? "companyPayment.busyLabel" : "walletTransfer.confirm")}</button></div>
  </section>;
}

export function SponsoredTransferStatus({ flow, network = "polygon", walletActivation = null }) {
  const { t } = useI18n(), value = network === "polygon" ? polygonRelayView(flow.payment) : solanaPaymentView(flow.payment);
  if (!value || value.walletAddress !== flow.wallet) return null;
  const confirmed = value.status === "confirmed", prepared = value.status === "prepared", authorized = value.status === "authorized", terminal = ["confirmed", "failed", "expired"].includes(value.status);
  const title = confirmed ? "confirmedTitle" : authorized ? "authorizedTitle" : value.status === "reconciliation_required" ? "reconciliationTitle" : value.status === "failed" ? "failedTitle" : value.status === "expired" ? "expiredTitle" : value.status === "ambiguous" ? "ambiguousTitle" : "pendingTitle";
  const copy = confirmed ? network === "polygon" ? "confirmedPolygon" : "confirmedSolana" : authorized ? "authorizedCopy" : value.status === "reconciliation_required" ? "reconciliationCopy" : value.status === "failed" ? "failedCopy" : value.status === "expired" ? "expiredCopy" : "pendingCopy";
  const abandoned = "failureReason" in value && value.failureReason === "preparation_abandoned";
  const hash = "transactionHash" in value ? value.transactionHash : value.transactionSignature;
  return <section className={`executive-panel ${styles.panel}`} aria-label={t(`walletTransfer.${title}`)} aria-busy={flow.busy}>
    <header className={styles.heading}>{confirmed ? <CheckCircle2 size={22} aria-hidden="true" /> : <Clock3 size={22} aria-hidden="true" />}<div><h2>{t(abandoned ? "companyPayment.abandonedTitle" : prepared ? "companyPayment.preparedTitle" : `walletTransfer.${title}`)}</h2><p role="status">{t(abandoned ? "companyPayment.abandonedCopy" : prepared ? flow.recovery ? "walletTransfer.ambiguous" : "companyPayment.preparedCopy" : `walletTransfer.${copy}`)}</p></div></header>
    <div className={styles.reviewAmount}><span>{t("companyPayment.amountLabel")}</span><strong><bdi dir="ltr">{formatPersonalCompanyPaymentAmount(value.amountAtomic)} USDT</bdi></strong></div>
    <dl className={styles.reviewDetails}><div><dt>{t("companyPayment.networkLabel")}</dt><dd>{networkName(network)} · USDT</dd></div><div><dt>{t("companyPayment.recipientLabel")}</dt><dd>Mindbliss</dd></div>
      {hash ? <div><dt>{t("walletTransfer.receipt")}</dt><dd><a href={network === "polygon" ? `https://polygonscan.com/tx/${hash}` : `https://solscan.io/tx/${hash}`} target="_blank" rel="noreferrer noopener"><code dir="ltr">{hash}</code></a></dd></div> : null}</dl>
    {flow.errorKey ? <p className={styles.error} role="alert">{t(flow.errorKey)}</p> : null}
    {walletActivation}
    <div className={styles.actions}>
      {!terminal ? <button className="executive-button" type="button" disabled={flow.busy} onClick={() => void flow.verifyPayment()}><RefreshCw size={16} aria-hidden="true" />{t("walletTransfer.verify")}</button> : null}
      {prepared && !flow.recovery && flow.resume && !walletActivation ? <button className="executive-button primary" type="button" disabled={flow.busy || flow.restoring}
        onClick={() => { if (!flow.busy && !flow.restoring) { if (flow.connected) void flow.resume(); else void flow.connect(); } }}>
        {t(flow.restoring ? "companyPayment.restoring" : flow.connected ? "companyPayment.resume" : flow.needsVerification ? "companyPayment.verifyWallet" : "companyPayment.reconnect")}</button> : null}
      {prepared && !flow.recovery && flow.abandon ? <button className="executive-button" type="button" disabled={flow.busy} onClick={() => void flow.abandon()}>{t("companyPayment.abandon")}</button> : null}
      {authorized && flow.submitAuthorized ? <button className="executive-button primary" type="button" disabled={flow.busy || !flow.capabilities?.transferEnabled} onClick={() => void flow.submitAuthorized()}>{t("walletTransfer.continueAuthorized")}</button> : null}
      {terminal ? <button className="executive-button primary" type="button" disabled={flow.busy} onClick={flow.newPayment}>{t("walletTransfer.another")}</button> : null}
    </div><p className={styles.pending}>{t("companyPayment.allocationPending")}</p>
  </section>;
}
