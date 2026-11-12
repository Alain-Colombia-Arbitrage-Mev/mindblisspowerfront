"use client";

import { CreditCard, Info, Landmark, Loader2, RefreshCw, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fundingRequestId, readPersonalFundingOptions } from "@/lib/wallet-funding-client.mjs";
import { PERSONAL_FUNDING_COUNTRIES, PERSONAL_FUNDING_MINIMUM_USD, PERSONAL_FUNDING_MAXIMUM_USD, PERSONAL_FUNDING_MINIMUM_MXN, personalFundingMethod, validFundingSourceAmount } from "@/lib/wallet-funding-contract.mjs";
import styles from "./wallet-funding.module.css";

const EMPTY_OPTIONS = { status: "idle", country: "", sourceCurrencyCode: "USD", paymentMethods: [], routes: [] };
// The small backend test amount is retained for existing records, not offered
// by the public form. Provider floors may raise this displayed starting amount.
const PERSONAL_FORM_MINIMUM_USD = Math.max(100, PERSONAL_FUNDING_MINIMUM_USD);
function validPersonalFormAmount(amount, currency) {
  return validFundingSourceAmount(amount, "personal", currency) && (currency !== "USD" || amount >= PERSONAL_FORM_MINIMUM_USD);
}

export function eligiblePaymentMethods(routes, amount, sourceCurrencyCode = "USD") {
  if (!Array.isArray(routes) || !validPersonalFormAmount(amount, sourceCurrencyCode)) return [];
  const entered = Number.isFinite(amount) && amount > 0;
  return [...new Set(routes.flatMap(route => (route.paymentMethods || [])
    .filter(item => { const limits = routeLimits(item, sourceCurrencyCode); return personalFundingMethod(item.method) && (sourceCurrencyCode === "USD" || (sourceCurrencyCode === "MXN" && item.method === "SPEI")) && limits && (!entered || (amount >= limits.minimumAmount && amount <= limits.maximumAmount)); })
    .map(item => item.method)))];
}

function routeLimits(item, sourceCurrencyCode) {
  if ((item.currencyCode || "USD") !== sourceCurrencyCode) return null;
  const providerMinimum = item.minimumAmount ?? item.minimumUsd;
  const providerMaximum = item.maximumAmount ?? item.maximumUsd;
  const maximumAmount = Math.min(sourceCurrencyCode === "USD" ? PERSONAL_FUNDING_MAXIMUM_USD : 1_000_000_000, providerMaximum);
  const floor = sourceCurrencyCode === "MXN" ? PERSONAL_FUNDING_MINIMUM_MXN : PERSONAL_FORM_MINIMUM_USD;
  const minimumAmount = Math.max(floor, providerMinimum);
  return Number.isFinite(providerMinimum) && providerMinimum >= 0 && Number.isFinite(providerMaximum) && Number.isFinite(maximumAmount) && maximumAmount >= minimumAmount
    ? { minimumAmount, maximumAmount } : null;
}

function lowestRouteMinimum(routes, sourceCurrencyCode = "USD") {
  const limits = (routes || []).flatMap(route => route.paymentMethods || [])
    .filter(item => personalFundingMethod(item.method) && (sourceCurrencyCode === "USD" || (sourceCurrencyCode === "MXN" && item.method === "SPEI")))
    .map(item => routeLimits(item, sourceCurrencyCode)?.minimumAmount).filter(Number.isFinite);
  return limits.length ? Math.min(...limits) : null;
}

export function selectedMethodLimits(routes, method, amount, sourceCurrencyCode = "USD") {
  const matches = (routes || []).flatMap(route => route.paymentMethods || [])
    .filter(item => item.method === method).map(item => routeLimits(item, sourceCurrencyCode))
    .filter(item => item && (!(amount > 0) || (amount >= item.minimumAmount && amount <= item.maximumAmount)));
  if (!matches.length) return null;
  const minimumAmount = Math.max(sourceCurrencyCode === "USD" ? PERSONAL_FORM_MINIMUM_USD : 0, Math.min(...matches.map(item => item.minimumAmount)));
  const maximumAmount = Math.min(sourceCurrencyCode === "USD" ? PERSONAL_FUNDING_MAXIMUM_USD : 1_000_000_000, Math.max(...matches.map(item => item.maximumAmount)));
  return sourceCurrencyCode === "USD" ? { minimumUsd: minimumAmount, maximumUsd: maximumAmount } : { minimumAmount, maximumAmount };
}

// ISO currencies are choices to consult, not a claim that a provider supports a route.
const LOCAL_CURRENCIES = { MX: "MXN" };
const PERSONAL_COUNTRIES = PERSONAL_FUNDING_COUNTRIES.map(code => [code]);
export function fundingCurrencyChoices(country) { return [...new Set(["USD", LOCAL_CURRENCIES[country]].filter(Boolean))]; }

/** Personal state and availability never consume the administrative options endpoint. */
export function PersonalFundingForm({ disabled = false, busy = false, onContinue, onSelectionChange = undefined, destinationAddress = "", walletAction = null }) {
  const { t } = useI18n();
  const id = useId();
  const [amount, setAmount] = useState(String(PERSONAL_FORM_MINIMUM_USD));
  const [countryCode, setCountryCode] = useState("");
  const [method, setMethod] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [revision, setRevision] = useState(0);
  const [sourceCurrencyCode, setSourceCurrencyCode] = useState("USD");
  const submitting = useRef(false);
  const mexicoCurrency = useRef("USD");
  const current = options.country === countryCode && (options.sourceCurrencyCode || "USD") === sourceCurrencyCode;
  const methods = current && options.status === "ready" ? eligiblePaymentMethods(options.routes, Number(amount), sourceCurrencyCode) : [];
  const methodsKey = methods.join(",");
  const routeMinimum = current ? lowestRouteMinimum(options.routes, sourceCurrencyCode) : null;
  const parsedAmount = Number(amount);
  const validAmount = validPersonalFormAmount(parsedAmount, sourceCurrencyCode)
    && (sourceCurrencyCode === "USD" || (countryCode === "MX" && method === "SPEI"));
  const valid = validAmount && PERSONAL_FUNDING_COUNTRIES.includes(countryCode) && methods.includes(method) && /^0x[0-9a-f]{40}$/i.test(destinationAddress);

  function changeSelection(update, value) {
    update(value);
    onSelectionChange?.();
  }

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

  useEffect(() => { setMethod(selected => methodsKey.split(",").includes(selected) ? selected
    : methodsKey.split(",").includes("CREDIT_DEBIT_CARD") ? "CREDIT_DEBIT_CARD" : methodsKey.split(",")[0] || ""); }, [methodsKey, countryCode, amount]);

  async function submit(event) {
    event.preventDefault();
    if (disabled || busy || submitting.current || !valid) return;
    submitting.current = true;
    try { await onContinue({ requestId: fundingRequestId(), amount: Number(amount), countryCode, sourceCurrencyCode, paymentMethodType: method }); }
    finally { submitting.current = false; }
  }

  return <form className="mb-onramp-simple" onSubmit={event => void submit(event).catch(() => {})} aria-label={t("walletPage.personalWalletLabel")}>
    <div className="mb-onramp-simple-main">
      <div className={`${styles.formFields}${countryCode !== "MX" ? ` ${styles.implicitCurrency}` : ""}`}>
        <FundingCountryField id={id} value={countryCode} countries={PERSONAL_COUNTRIES} label={t("funding.residenceCountryLabel")} onChange={value => {
          const currency = value === "MX" ? mexicoCurrency.current : "USD";
          changeSelection(setCountryCode, value);
          if (currency !== sourceCurrencyCode) setAmount(String(currency === "MXN" ? PERSONAL_FUNDING_MINIMUM_MXN : PERSONAL_FORM_MINIMUM_USD));
          setSourceCurrencyCode(currency);
        }} busy={busy} />
        {countryCode === "MX" ? <FundingCurrencyField id={id} country={countryCode} value={sourceCurrencyCode} onChange={value => {
          mexicoCurrency.current = value;
          changeSelection(setSourceCurrencyCode, value);
          setAmount(String(value === "USD" ? PERSONAL_FORM_MINIMUM_USD : PERSONAL_FUNDING_MINIMUM_MXN));
        }} busy={busy} /> : null}
        <FundingAmountField id={id} amount={amount} sourceCurrencyCode={sourceCurrencyCode} onChange={value => changeSelection(setAmount, value)} busy={busy} />
        <FundingMethodField id={id} value={methods.includes(method) ? method : ""} methods={methods} status={current ? options.status : "loading"}
          countrySelected={Boolean(countryCode)} sourceCurrencyCode={sourceCurrencyCode} minimumUsd={routeMinimum}
          onUseMinimum={routeMinimum !== null && Number(amount) < routeMinimum ? () => changeSelection(setAmount, (Math.ceil(routeMinimum * 100) / 100).toFixed(2)) : undefined}
          limits={current ? selectedMethodLimits(options.routes, method, Number(amount), sourceCurrencyCode) : null} onChange={value => changeSelection(setMethod, value)} onRetry={() => setRevision(value => value + 1)} busy={busy} />
      </div>
      <FundingDestination address={destinationAddress} />
      {sourceCurrencyCode === "MXN" ? <p className={styles.hint} role="status">{t("funding.personalSpeiMinimum")}</p> : null}
      {walletAction || <FundingSubmit disabled={disabled || !valid} busy={busy} />}
    </div>
  </form>;
}

function FundingAmountField({ id, amount, sourceCurrencyCode = "USD", onChange, busy }) {
  const { t, locale } = useI18n();
  const usd = sourceCurrencyCode === "USD";
  const invalid = amount !== "" && !validPersonalFormAmount(Number(amount), sourceCurrencyCode);
  const currency = value => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(value);
  const sliderAmount = Number.isFinite(Number(amount)) ? Math.min(PERSONAL_FUNDING_MAXIMUM_USD, Math.max(PERSONAL_FORM_MINIMUM_USD, Number(amount))) : PERSONAL_FORM_MINIMUM_USD;
  const setSliderAmount = value => onChange(String(Math.min(PERSONAL_FUNDING_MAXIMUM_USD, Math.max(PERSONAL_FORM_MINIMUM_USD, Math.round(value * 100) / 100))));
  function sliderKeyDown(event) {
    const next = { ArrowRight: sliderAmount + 100, ArrowUp: sliderAmount + 100, ArrowLeft: sliderAmount - 100, ArrowDown: sliderAmount - 100,
      PageUp: sliderAmount + 1000, PageDown: sliderAmount - 1000, Home: PERSONAL_FORM_MINIMUM_USD, End: PERSONAL_FUNDING_MAXIMUM_USD }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSliderAmount(next);
  }
  return <fieldset className={`mb-onramp-amount-fieldset ${styles.amountField}`} disabled={busy}>
    <legend>{t("onramp.amountLabel")}</legend>
    {usd ? <div className={`mb-onramp-quick-amounts ${styles.quickAmounts}`}>{[PERSONAL_FORM_MINIMUM_USD, 500, 1000, 2000, 5000, 10000, PERSONAL_FUNDING_MAXIMUM_USD].map(value => <button type="button" key={value}
      className={Number(amount) === value ? "active" : ""} aria-pressed={Number(amount) === value} onClick={() => onChange(String(value))}>
      {new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)}</button>)}</div> : null}
    <label className="mb-onramp-amount-input" htmlFor={`${id}-amount`}><span>{sourceCurrencyCode}</span><input id={`${id}-amount`} name="amount" autoComplete="off" type="number" min={String(usd ? PERSONAL_FORM_MINIMUM_USD : PERSONAL_FUNDING_MINIMUM_MXN)} max={usd ? String(PERSONAL_FUNDING_MAXIMUM_USD) : "1000000000"} step="0.01" inputMode="decimal"
      value={amount} onChange={event => onChange(event.target.value)} aria-label={t("onramp.amountLabel")} aria-invalid={invalid || undefined} aria-describedby={[usd ? `${id}-usd-limits` : "", invalid ? `${id}-amount-hint` : ""].filter(Boolean).join(" ") || undefined} required /></label>
    {usd ? <div className={styles.amountSliderGroup}>
      <label className="sr-only" htmlFor={`${id}-amount-slider`}>{t("funding.amountSlider")}</label>
      <input className={styles.amountSlider} id={`${id}-amount-slider`} name="amountSlider" type="range" dir="ltr" min={PERSONAL_FORM_MINIMUM_USD} max={PERSONAL_FUNDING_MAXIMUM_USD} step="any" value={sliderAmount}
        onChange={event => setSliderAmount(Math.round(Number(event.target.value) / 100) * 100)} onKeyDown={sliderKeyDown} aria-valuetext={currency(sliderAmount)} aria-describedby={`${id}-usd-limits`} />
      <div className={styles.sliderLimits} dir="ltr" aria-hidden="true"><span>{currency(PERSONAL_FORM_MINIMUM_USD)}</span><span>{currency(PERSONAL_FUNDING_MAXIMUM_USD)}</span></div>
      <small id={`${id}-usd-limits`} className="mb-onramp-disclosure">{t("funding.personalAmountLimits", { minimum: currency(PERSONAL_FORM_MINIMUM_USD), maximum: currency(PERSONAL_FUNDING_MAXIMUM_USD) })}</small>
    </div> : null}
    {invalid ? <small id={`${id}-amount-hint`} role="alert" className="mb-onramp-disclosure">{t(usd ? "funding.personalAmountRange" : "funding.personalMxnAmountRange")}</small> : null}
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
  return <div className={`mb-onramp-country-picker ${styles.countryField}`}>
    <div className={styles.countryHeading}>
      <label htmlFor={`${id}-country`}>{label || t("onramp.countryLabel")}</label>
      <Popover>
        <PopoverTrigger asChild>
          <button className={styles.residencyInfoButton} type="button" aria-label={t("funding.residenceCountryInfo")}>
            <Info size={18} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent className={styles.residencyPopover} align="start" sideOffset={8} collisionPadding={16}
          aria-label={t("funding.residenceCountryInfo")} aria-describedby={`${id}-residency-popup-copy`} onOpenAutoFocus={event => event.preventDefault()}>
          <div id={`${id}-residency-popup-copy`}>
            <p>{t("funding.residenceCountryHelp")}</p><p><strong>{t("funding.residenceCountrySsn")}</strong></p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
    <select id={`${id}-country`} value={value} onChange={event => onChange(event.target.value)} autoComplete="off" disabled={busy} required>
      <option value="">{t("funding.countryPrompt")}</option>{countries.map(([code]) => <option value={code} key={code}>{countryName(code)}</option>)}
    </select></div>;
}

function FundingMethodField({ id, value, methods, status, countrySelected, sourceCurrencyCode = "USD", minimumUsd, limits, onChange, onRetry, onUseMinimum = undefined, busy, partialAvailability = false }) {
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
      {unavailable ? <><p>{t(status === "error" ? "funding.methodsLoadFailed" : "funding.methodsForAmountUnavailable")}</p>{status === "error" ? <button className="executive-button" type="button" onClick={onRetry} disabled={busy}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button> : null}</>
        : !countrySelected ? t("funding.chooseCountryFirst") : status === "loading" ? t("walletPage.checkingAvailability") : null}
      {ready && partialAvailability && methods.length ? <><p>{t("funding.methodsPartiallyLoaded")}</p><button className="executive-button" type="button" onClick={onRetry} disabled={busy}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button></> : null}
      {ready && limits ? t("funding.methodRange", { minimum: currency(limits.minimumAmount ?? limits.minimumUsd), maximum: currency(limits.maximumAmount ?? limits.maximumUsd) })
        : ready && !methods.length && minimumUsd !== null ? <p>{t("funding.providerMinimum", { amount: currency(minimumUsd) })}</p> : null}
      {ready && !methods.length && onUseMinimum ? <button className="executive-button" type="button" onClick={onUseMinimum} disabled={busy}>{t("funding.useProviderMinimum", { amount: currency(minimumUsd) })}</button> : null}
      {ready && methods.length ? <p>{t("funding.providerFinalReview")}</p> : null}
    </div>
  </fieldset>;
}

function FundingSubmit({ disabled, busy }) {
  const { t } = useI18n();
  return <button className="executive-button primary mb-onramp-primary" type="submit" disabled={disabled || busy}>
    {busy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(busy ? "funding.preparingTopUp" : "walletPage.addFundsAction")}
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
