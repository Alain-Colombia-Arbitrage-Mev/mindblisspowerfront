"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck, WalletCards, X } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import styles from "./payment-wallet-activation.module.css";

const pendingPhases = new Set(["sending", "connecting", "verifying"]);
const errorKeys = {
  email_invalid: "emailInvalid", invalid_otp: "codeInvalid", otp_expired: "codeExpired", rate_limited: "rateLimited",
  rejected: "rejected", cancelled: "rejected", popup_blocked: "popupBlocked", timeout: "timeout",
  mismatch: "mismatch", verification_failed: "verificationFailed",
};
const emailValid = value => typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const otpValue = value => String(value).replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit <= "٩" ? 1632 : 1776))).replace(/[^0-9]/g, "").slice(0, 6);

/** Connection only: this component never prepares, signs or submits a payment. */
export default function PaymentWalletActivation({ connection, disabled = false, onStart = undefined }) {
  const { t } = useI18n();
  const id = useId(), request = useRef(null), mounted = useRef(true);
  /** @type {import("react").MutableRefObject<HTMLHeadingElement | null>} */
  const titleRef = useRef(null);
  const sourceEmail = typeof connection?.email === "string" ? connection.email : "";
  const [emailDraft, setEmailDraft] = useState({ source: sourceEmail, value: sourceEmail });
  const [codeDraft, setCodeDraft] = useState({ source: sourceEmail, value: "" });
  const [working, setWorking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const resendAt = Number.isFinite(connection?.resendAt) ? connection.resendAt : 0;
  const email = emailDraft.source === sourceEmail ? emailDraft.value : sourceEmail;
  const code = codeDraft.source === sourceEmail ? codeDraft.value : "";
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current = null; }; }, []);
  useEffect(() => {
    setNow(Date.now());
    if (connection?.phase !== "code" || resendAt <= Date.now()) return undefined;
    const timer = setInterval(() => { const time = Date.now(); setNow(time); if (time >= resendAt) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [connection?.phase, resendAt]);
  useEffect(() => {
    if (!["choosing", "code", "device", "error"].includes(connection?.phase)) return;
    titleRef.current?.focus?.({ preventScroll: true });
    titleRef.current?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "auto" });
  }, [connection?.phase]);
  if (!connection || connection.phase === "idle") return null;
  const phase = connection.phase;
  const pending = working || pendingPhases.has(phase);
  const blocked = disabled || pending;
  const codeStep = phase === "code", deviceStep = phase === "device";
  const choosing = phase === "choosing";
  const errorKey = connection.error ? errorKeys[connection.error] || "unavailable" : "";
  const resendSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const canResend = Boolean(connection.canResend) && resendSeconds === 0;
  const socials = Array.isArray(connection.socials) ? [...new Set(connection.socials)].filter(value => ["google", "apple"].includes(value)) : [];
  const wallets = Array.isArray(connection.wallets) ? connection.wallets.filter(wallet => typeof wallet?.id === "string" && typeof wallet.name === "string").slice(0, 8) : [];

  async function run(action) {
    if (disabled || request.current || pendingPhases.has(phase) || typeof action !== "function") return;
    const token = {}; request.current = token; setWorking(true);
    try { await action(); } catch { /* The scoped connection controller exposes only safe errors. */ }
    finally { if (mounted.current && request.current === token) { request.current = null; setWorking(false); } }
  }
  function cancel() {
    if (disabled) return;
    request.current = null; setWorking(false); setCodeDraft({ source: sourceEmail, value: "" });
    try { Promise.resolve(connection.cancel?.()).catch(() => {}); } catch { /* Cancellation must not submit the parent form. */ }
  }
  function enter(event, action) {
    if (event.key !== "Enter") return;
    event.preventDefault(); event.stopPropagation(); action();
  }

  return <section className={styles.activation} aria-labelledby={`${id}-title`} aria-busy={pending}>
    <header className={styles.heading}><span className={styles.icon}><WalletCards size={20} aria-hidden="true" /></span>
      <div><h2 ref={titleRef} tabIndex={-1} id={`${id}-title`}>{t("paymentWallet.title")}</h2><p>{t("paymentWallet.copy")}</p></div>
      <button className={styles.close} type="button" disabled={disabled} onClick={cancel} aria-label={t("paymentWallet.cancel")}><X size={18} aria-hidden="true" /></button>
    </header>
    {choosing && connection.available ? <>
      {socials.length ? <div className={styles.socials}>{socials.map(provider => <button className={`executive-button ${styles.option}`} type="button" key={provider} disabled={blocked}
        onClick={() => void run(() => connection.connectSocial(provider))}><ShieldCheck size={17} aria-hidden="true" />{t(provider === "google" ? "paymentWallet.google" : "paymentWallet.apple")}</button>)}</div> : null}
      {connection.canEmail ? <div className={styles.email}>
        {socials.length ? <p className={styles.separator}>{t("paymentWallet.orEmail")}</p> : null}
        <label htmlFor={`${id}-email`}>{t("paymentWallet.email")}</label>
        <div className={styles.inputAction}><Mail size={17} aria-hidden="true" /><input id={`${id}-email`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} dir="ltr" maxLength={254}
          value={email} disabled={blocked} aria-describedby={`${id}-email-help`} onChange={event => setEmailDraft({ source: sourceEmail, value: event.target.value })}
          onKeyDown={event => enter(event, () => { if (emailValid(email)) void run(() => connection.requestEmail(email.trim())); })} />
          <button className="executive-button primary" type="button" disabled={blocked || !emailValid(email)} onClick={() => { if (emailValid(email)) void run(() => connection.requestEmail(email.trim())); }}>
            <ArrowRight size={17} aria-hidden="true" />{t("paymentWallet.sendCode")}</button>
        </div><small id={`${id}-email-help`}>{t("paymentWallet.sameAccount")}</small>
      </div> : null}
      {wallets.length ? <details className={styles.wallets}><summary>{t("paymentWallet.otherWallet")}</summary><div className={styles.walletGrid}>{wallets.map(wallet => <button className={`executive-button ${styles.option}`} type="button" key={wallet.id} disabled={blocked}
        onClick={() => void run(() => connection.connectExternal(wallet.id))}><WalletCards size={17} aria-hidden="true" /><span>{wallet.name.slice(0, 80)}</span></button>)}</div></details> : null}
    </> : null}
    {codeStep ? <div className={styles.email}>
      <p className={styles.message} role="status">{t("paymentWallet.codeSent")} <bdi dir="ltr">{sourceEmail}</bdi></p>
      <label htmlFor={`${id}-code`}>{t("paymentWallet.code")}</label>
      <div className={`${styles.inputAction} ${styles.codeInput}`}><KeyRound size={17} aria-hidden="true" /><input id={`${id}-code`} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={32} dir="ltr"
        value={code} disabled={blocked} aria-describedby={`${id}-code-help`} aria-invalid={errorKey === "codeInvalid" || undefined}
        onChange={event => setCodeDraft({ source: sourceEmail, value: otpValue(event.target.value) })}
        onKeyDown={event => enter(event, () => { if (/^[0-9]{6}$/.test(code)) void run(() => connection.verifyEmail(code)); })} />
        <button className="executive-button primary" type="button" disabled={blocked || !/^[0-9]{6}$/.test(code)} onClick={() => { if (/^[0-9]{6}$/.test(code)) void run(() => connection.verifyEmail(code)); }}>{t("paymentWallet.verifyCode")}</button>
      </div><small id={`${id}-code-help`}>{t("paymentWallet.codeHelp")}</small>
      <button className={styles.link} type="button" disabled={blocked || !canResend} onClick={() => { if (canResend) void run(() => connection.requestEmail(sourceEmail)); }}>{t(resendSeconds ? "paymentWallet.resendCountdown" : canResend ? "paymentWallet.resend" : "paymentWallet.resendWait", { seconds: resendSeconds })}</button>
    </div> : null}
    {deviceStep ? <div className={styles.device}><p className={styles.message}>{t("paymentWallet.deviceCopy")}</p>
      <button className="executive-button primary" type="button" disabled={blocked} onClick={() => void run(() => connection.confirmDevice?.())}>{t("paymentWallet.deviceContinue")}</button></div> : null}
    {pendingPhases.has(phase) ? <p className={styles.progress} role="status"><Loader2 className="animate-spin" size={18} aria-hidden="true" />{t(phase === "sending" ? "paymentWallet.sending" : phase === "verifying" ? "paymentWallet.verifying" : "paymentWallet.connecting")}</p> : null}
    {errorKey ? <p className={styles.error} role="alert">{t(`paymentWallet.${errorKey}`)}</p> : null}
    {phase === "error" ? <button className="executive-button primary" type="button" disabled={blocked || typeof onStart !== "function"} onClick={() => void run(() => { if (typeof onStart === "function") Promise.resolve(onStart()).catch(() => {}); })}>{t("paymentWallet.retry")}</button> : null}
    {phase !== "error" && (choosing || !connection.available) && typeof connection.openNative === "function" ? <button className={styles.link} type="button" disabled={blocked} onClick={() => void run(() => connection.openNative())}>{t(connection.available ? "paymentWallet.moreOptions" : "paymentWallet.secureConnection")}</button> : null}
    <p className={styles.safety}><ShieldCheck size={15} aria-hidden="true" />{t("paymentWallet.noPayment")}</p>
  </section>;
}
