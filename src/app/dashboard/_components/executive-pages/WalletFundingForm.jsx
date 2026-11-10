"use client";

import { CreditCard, Landmark, Loader2, RefreshCw, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { browserOnrampRegion } from "@/lib/browser-onramp-region.mjs";
import { fundingRequestId, readPersonalFundingOptions } from "@/lib/wallet-funding-client.mjs";
import { PERSONAL_FUNDING_COUNTRIES, PERSONAL_FUNDING_MINIMUM_USD, personalFundingMethod, validFundingAmount } from "@/lib/wallet-funding-contract.mjs";
import styles from "./wallet-funding.module.css";

const EMPTY_OPTIONS = { status: "idle", country: "", sourceCurrencyCode: "USD", paymentMethods: [], routes: [] };

export function eligiblePaymentMethods(routes, amount, sourceCurrencyCode = "USD") {
  if (!Array.isArray(routes) || (sourceCurrencyCode === "USD" && !validFundingAmount(amount))) return [];
  const entered = Number.isFinite(amount) && amount > 0;
  return [...new Set(routes.flatMap(route => (route.paymentMethods || [])
    .filter(item => { const limits = routeLimits(item, sourceCurrencyCode); return personalFundingMethod(item.method) && (sourceCurrencyCode === "USD" || (sourceCurrencyCode === "MXN" && item.method === "SPEI")) && limits && (!entered || (amount >= limits.minimumAmount && amount <= limits.maximumAmount)); })
    .map(item => item.method)))];
}

function routeLimits(item, sourceCurrencyCode) {
  if ((item.currencyCode || "USD") !== sourceCurrencyCode) return null;
  const minimumAmount = item.minimumAmount ?? item.minimumUsd, maximumAmount = item.maximumAmount ?? item.maximumUsd;
  return Number.isFinite(minimumAmount) && minimumAmount >= 0 && Number.isFinite(maximumAmount) && maximumAmount >= minimumAmount
    ? { minimumAmount, maximumAmount } : null;
}

function lowestRouteMinimum(routes, sourceCurrencyCode = "USD") {
  const limits = (routes || []).flatMap(route => route.paymentMethods || [])
    .filter(item => personalFundingMethod(item.method) && (sourceCurrencyCode === "USD" || (sourceCurrencyCode === "MXN" && item.method === "SPEI")))
    .map(item => routeLimits(item, sourceCurrencyCode)?.minimumAmount).filter(Number.isFinite);
  return limits.length ? Math.max(sourceCurrencyCode === "USD" ? PERSONAL_FUNDING_MINIMUM_USD : 0, Math.min(...limits)) : null;
}

export function selectedMethodLimits(routes, method, amount, sourceCurrencyCode = "USD") {
  const matches = (routes || []).flatMap(route => route.paymentMethods || [])
    .filter(item => item.method === method).map(item => routeLimits(item, sourceCurrencyCode))
    .filter(item => item && (!(amount > 0) || (amount >= item.minimumAmount && amount <= item.maximumAmount)));
  if (!matches.length) return null;
  const minimumAmount = Math.max(sourceCurrencyCode === "USD" ? PERSONAL_FUNDING_MINIMUM_USD : 0, Math.min(...matches.map(item => item.minimumAmount)));
  const maximumAmount = Math.min(sourceCurrencyCode === "USD" ? 25000 : 1_000_000_000, Math.max(...matches.map(item => item.maximumAmount)));
  return sourceCurrencyCode === "USD" ? { minimumUsd: minimumAmount, maximumUsd: maximumAmount } : { minimumAmount, maximumAmount };
}

// ISO currencies are choices to consult, not a claim that a provider supports a route.
const LOCAL_CURRENCIES = { MX: "MXN" };
const PERSONAL_COUNTRIES = PERSONAL_FUNDING_COUNTRIES.map(code => [code]);
export function fundingCurrencyChoices(country) { return [...new Set(["USD", LOCAL_CURRENCIES[country]].filter(Boolean))]; }

/** Personal state and availability never consume the administrative options endpoint. */
export function PersonalFundingForm({ disabled = false, busy = false, onContinue, onSelectionChange = undefined, destinationAddress = "" }) {
  const { t } = useI18n();
  const id = useId();
  const [amount, setAmount] = useState(String(PERSONAL_FUNDING_MINIMUM_USD));
  const [countryCode, setCountryCode] = useState("");
  const [method, setMethod] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [revision, setRevision] = useState(0);
  const [sourceCurrencyCode, setSourceCurrencyCode] = useState("USD");
  const submitting = useRef(false);
  const seededMinimum = useRef("");
  const current = options.country === countryCode && (options.sourceCurrencyCode || "USD") === sourceCurrencyCode;
  const methods = current && options.status === "ready" ? eligiblePaymentMethods(options.routes, Number(amount), sourceCurrencyCode) : [];
  const methodsKey = methods.join(",");
  const parsedAmount = Number(amount);
  const validAmount = sourceCurrencyCode === "USD" ? validFundingAmount(parsedAmount)
    : sourceCurrencyCode === "MXN" && countryCode === "MX" && method === "SPEI" && Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= 1_000_000_000
      && Math.abs(parsedAmount * 100 - Math.round(parsedAmount * 100)) < 0.000001;
  const valid = validAmount && PERSONAL_FUNDING_COUNTRIES.includes(countryCode) && methods.includes(method) && /^0x[0-9a-f]{40}$/i.test(destinationAddress);

  function changeSelection(update, value) {
    update(value);
    onSelectionChange?.();
  }

  useEffect(() => {
    const detected = browserOnrampRegion([...(navigator.languages || [navigator.language])], Intl.DateTimeFormat().resolvedOptions().timeZone);
    setCountryCode(PERSONAL_FUNDING_COUNTRIES.includes(detected) ? detected : "");
  }, []);

  useEffect(() => {
    setMethod("");
    if (!countryCode) { setOptions(EMPTY_OPTIONS); return undefined; }
    const controller = new AbortController();
    setOptions({ ...EMPTY_OPTIONS, status: "loading", country: countryCode, sourceCurrencyCode });
    readPersonalFundingOptions(countryCode, { signal: controller.signal, sourceCurrencyCode }).then(data => {
      if (!controller.signal.aborted) setOptions({ ...data, status: "ready" });
    }).catch(() => { if (!controller.signal.aborted) setOptions({ ...EMPTY_OPTIONS, status: "error", country: countryCode, sourceCurrencyCode }); });
    return () => controller.abort();
  }, [countryCode, sourceCurrencyCode, revision]);

  useEffect(() => { setMethod(methodsKey.split(",").includes("CREDIT_DEBIT_CARD") ? "CREDIT_DEBIT_CARD" : methodsKey.split(",")[0] || ""); }, [methodsKey, countryCode, amount]);

  useEffect(() => {
    if (sourceCurrencyCode !== "MXN" || !current || options.status !== "ready") return;
    const key = `${countryCode}:${sourceCurrencyCode}:${revision}`;
    if (seededMinimum.current === key) return;
    seededMinimum.current = key;
    if (amount !== "") return;
    const limits = selectedMethodLimits(options.routes, "SPEI", 0, "MXN");
    if (limits) setAmount((Math.ceil(limits.minimumAmount * 100) / 100).toFixed(2));
  }, [amount, countryCode, sourceCurrencyCode, revision, current, options]);

  async function submit(event) {
    event.preventDefault();
    if (disabled || busy || submitting.current || !valid) return;
    submitting.current = true;
    try { await onContinue({ requestId: fundingRequestId(), amount: Number(amount), countryCode, sourceCurrencyCode, paymentMethodType: method }); }
    finally { submitting.current = false; }
  }

  return <form className="mb-onramp-simple" onSubmit={event => void submit(event).catch(() => {})} aria-label={t("walletPage.personalWalletLabel")}>
    <div className="mb-onramp-simple-main">
      <div className={styles.formFields}>
        <FundingCountryField id={id} value={countryCode} countries={PERSONAL_COUNTRIES} onChange={value => { seededMinimum.current = ""; changeSelection(setCountryCode, value); if (sourceCurrencyCode !== "USD") setAmount(String(PERSONAL_FUNDING_MINIMUM_USD)); setSourceCurrencyCode("USD"); }} busy={busy} />
        <FundingCurrencyField id={id} country={countryCode} value={sourceCurrencyCode} onChange={value => { seededMinimum.current = ""; changeSelection(setSourceCurrencyCode, value); setAmount(value === "USD" ? String(PERSONAL_FUNDING_MINIMUM_USD) : ""); }} busy={busy} />
        <FundingAmountField id={id} amount={amount} sourceCurrencyCode={sourceCurrencyCode} onChange={value => changeSelection(setAmount, value)} busy={busy} />
        <FundingMethodField id={id} value={methods.includes(method) ? method : ""} methods={methods} status={current ? options.status : "loading"}
          countrySelected={Boolean(countryCode)} sourceCurrencyCode={sourceCurrencyCode} minimumUsd={current ? lowestRouteMinimum(options.routes, sourceCurrencyCode) : null}
          limits={current ? selectedMethodLimits(options.routes, method, Number(amount), sourceCurrencyCode) : null} onChange={value => changeSelection(setMethod, value)} onRetry={() => setRevision(value => value + 1)} busy={busy} />
      </div>
      <FundingDestination address={destinationAddress} />
      {sourceCurrencyCode === "MXN" ? <p className={styles.hint} role="status">{t("funding.personalSpeiMinimum")}</p> : null}
      <FundingSubmit disabled={disabled || !valid} busy={busy} />
    </div>
  </form>;
}

function FundingAmountField({ id, amount, sourceCurrencyCode = "USD", onChange, busy }) {
  const { t, locale } = useI18n();
  const usd = sourceCurrencyCode === "USD";
  const invalid = amount !== "" && (usd ? !validFundingAmount(Number(amount)) : !(Number(amount) > 0 && Number(amount) <= 1_000_000_000 && Math.abs(Number(amount) * 100 - Math.round(Number(amount) * 100)) < 0.000001));
  return <fieldset className={`mb-onramp-amount-fieldset ${styles.amountField}`} disabled={busy}>
    <legend>{t("onramp.amountLabel")}</legend>
    {usd ? <div className="mb-onramp-quick-amounts">{[PERSONAL_FUNDING_MINIMUM_USD, 50, 100, 250].map(value => <button type="button" key={value}
      className={Number(amount) === value ? "active" : ""} aria-pressed={Number(amount) === value} onClick={() => onChange(String(value))}>
      {new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)}</button>)}</div> : null}
    <label className="mb-onramp-amount-input" htmlFor={`${id}-amount`}><span>{sourceCurrencyCode}</span><input id={`${id}-amount`} type="number" min={usd ? String(PERSONAL_FUNDING_MINIMUM_USD) : "0.01"} max={usd ? "25000" : "1000000000"} step="0.01" inputMode="decimal"
      value={amount} onChange={event => onChange(event.target.value)} aria-label={t("onramp.amountLabel")} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-amount-hint` : undefined} required /></label>
    {invalid ? <small id={`${id}-amount-hint`} role="alert" className="mb-onramp-disclosure">{t(usd ? "funding.personalAmountRange" : "funding.localAmountRequired")}</small> : null}
  </fieldset>;
}

function FundingCurrencyField({ id, country, value, onChange, busy }) {
  const { t, locale } = useI18n();
  const names = new Intl.DisplayNames([locale], { type: "currency" });
  return <label className={`mb-onramp-country-picker ${styles.currencyField}`} htmlFor={`${id}-currency`}><span>{t("funding.currencyLabel")}</span>
    <select id={`${id}-currency`} value={value} onChange={event => onChange(event.target.value)} disabled={busy || !country} required>
      {fundingCurrencyChoices(country).map(code => <option key={code} value={code}>{code} · {names.of(code) || code}</option>)}
    </select></label>;
}

function FundingCountryField({ id, value, onChange, busy, label = "", countries = PERSONAL_COUNTRIES }) {
  const { t, locale } = useI18n();
  function countryName(code) { try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code; } catch { return code; } }
  return <label className={`mb-onramp-country-picker ${styles.countryField}`} htmlFor={`${id}-country`}><span>{label || t("onramp.countryLabel")}</span>
    <select id={`${id}-country`} value={value} onChange={event => onChange(event.target.value)} disabled={busy} required>
      <option value="">{t("funding.countryPrompt")}</option>{countries.map(([code]) => <option value={code} key={code}>{countryName(code)}</option>)}
    </select></label>;
}

function FundingMethodField({ id, value, methods, status, countrySelected, sourceCurrencyCode = "USD", minimumUsd, limits, onChange, onRetry, busy, partialAvailability = false }) {
  const { t, locale } = useI18n();
  const ready = countrySelected && status === "ready";
  const unavailable = countrySelected && (status === "error" || (ready && !methods.length));
  const currency = number => new Intl.NumberFormat(locale, { style: "currency", currency: sourceCurrencyCode, maximumFractionDigits: 2 }).format(number);
  return <fieldset className={styles.methodField} disabled={busy} aria-describedby={`${id}-methods-state`}>
    <legend>{t("onramp.paymentMethodLabel")}{ready && methods.length ? <span className={styles.methodCount}>{t("funding.methodCount", { count: new Intl.NumberFormat(locale).format(methods.length) })}</span> : null}</legend>
    {methods.length ? <div className={styles.methodChoices}>{methods.map(method => {
      const Icon = ["CREDIT_DEBIT_CARD", "CARD", "VISA", "MASTERCARD"].includes(method) ? CreditCard
        : ["BANK_TRANSFER", "SEPA", "ACH", "SPEI"].includes(method) ? Landmark : ["APPLE_PAY", "GOOGLE_PAY"].includes(method) ? Smartphone : WalletCards;
      return <label className={`${styles.methodOption}${value === method ? ` ${styles.methodSelected}` : ""}`} key={method}>
        <input type="radio" name={`${id}-method`} value={method} checked={value === method} onChange={() => onChange(method)} disabled={!ready} required />
        <Icon size={17} aria-hidden="true" /><span>{paymentMethodLabel(method, t)}</span>
      </label>;
    })}</div> : null}
    <div id={`${id}-methods-state`} role="status" className="mb-onramp-disclosure">
      {unavailable ? <><p>{t(status === "error" ? "funding.methodsLoadFailed" : "funding.methodsForAmountUnavailable")}</p><button className="executive-button" type="button" onClick={onRetry} disabled={busy}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button></>
        : !countrySelected ? t("funding.chooseCountryFirst") : status === "loading" ? t("walletPage.checkingAvailability") : null}
      {ready && partialAvailability && methods.length ? <><p>{t("funding.methodsPartiallyLoaded")}</p><button className="executive-button" type="button" onClick={onRetry} disabled={busy}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button></> : null}
      {ready && limits ? t("funding.methodRange", { minimum: currency(limits.minimumAmount ?? limits.minimumUsd), maximum: currency(limits.maximumAmount ?? limits.maximumUsd) })
        : ready && !methods.length && minimumUsd !== null ? <p>{t("funding.providerMinimum", { amount: currency(minimumUsd) })}</p> : null}
      {ready && methods.length ? <p>{t("funding.providerFinalReview")}</p> : null}
    </div>
  </fieldset>;
}

function FundingSubmit({ disabled, busy }) {
  const { t } = useI18n();
  return <button className="executive-button primary mb-onramp-primary" type="submit" disabled={disabled || busy}>
    {busy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(busy ? "recharge.connecting" : "walletPage.addFundsAction")}
  </button>;
}

export function FundingDestination({ address }) {
  const { t } = useI18n();
  const id = useId();
  return <div className={styles.destinationReview}><label htmlFor={`${id}-destination`}>{t("funding.reviewDestination")}<small>USDT · Polygon</small></label>
    <input id={`${id}-destination`} type="text" readOnly value={address} dir="ltr" title={address || undefined}
      aria-describedby={`${id}-destination-help`} placeholder={t("funding.destinationReviewEmpty")} />
    <small id={`${id}-destination-help`} className={address ? "sr-only" : undefined}>{address ? t("funding.destinationReviewCopy") : t("funding.destinationReviewEmpty")}</small>
  </div>;
}

export function paymentMethodLabel(code, t) {
  const brands = { ASTROPAY: "AstroPay", NETELLER: "Neteller", PAYSAFECARD: "PaysafeCard", SKRILL: "Skrill", PAYPAL: "PayPal", VENMO: "Venmo" };
  if (Object.hasOwn(brands, code)) return brands[code];
  if (["CREDIT_DEBIT_CARD", "CARD", "VISA", "MASTERCARD"].includes(code)) return t("onramp.cardPayment");
  if (code === "APPLE_PAY") return "Apple Pay";
  if (code === "GOOGLE_PAY") return "Google Pay";
  if (code === "SPEI") return t("funding.speiPayment");
  if (["BANK_TRANSFER", "SEPA", "ACH"].includes(code)) return t("onramp.bankTransfer");
  return code.replaceAll("_", " ");
}
