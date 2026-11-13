"use client";

import { CreditCard, Info, Landmark, Loader2, RefreshCw, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ONRAMP_COUNTRIES } from "@/lib/meld-onramp-client.mjs";
import { fundingRequestId, readAdministrativeSandboxOptions } from "@/lib/wallet-funding-client.mjs";
import { validFundingAmount } from "@/lib/wallet-funding-contract.mjs";
import { validMeldCheckoutAmount } from "@/lib/administrative-meld-checkout-contract.mjs";
import styles from "./wallet-funding.module.css";

const MINIMUM_USD = 50, MAXIMUM_USD = 25_000;
const PROVIDERS = ["TRANSAK", "BANXA"];
const MXN_METHODS = new Set(["CREDIT_DEBIT_CARD", "APPLE_PAY", "GOOGLE_PAY"]);
const idleOptions = () => ({ status: "idle", country: "", sourceCurrencyCode: "USD", providers: [], failedProviders: [] });
const validAmount = (amount, currency) => currency === "USD" ? validFundingAmount(amount, "administrative")
  : currency === "MXN" && Number.isFinite(amount) && amount > 0 && amount <= 1_000_000_000 && Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001;
export function fundingCurrencyChoices(country) { return country === "MX" ? ["USD", "MXN"] : ["USD"]; }

function routeLimits(item, currency) {
  if ((item.currencyCode || "USD") !== currency || (currency === "MXN" && !MXN_METHODS.has(item.method))) return null;
  const low = item.minimumAmount ?? item.minimumUsd, high = item.maximumAmount ?? item.maximumUsd;
  if (!Number.isFinite(low) || low < 0 || !Number.isFinite(high) || high < low) return null;
  const minimumAmount = Math.max(currency === "USD" ? MINIMUM_USD : 0.01, low);
  const maximumAmount = Math.min(currency === "USD" ? MAXIMUM_USD : 1_000_000_000, high);
  return maximumAmount >= minimumAmount ? { minimumAmount, maximumAmount } : null;
}
const routeMethods = (routes, currency) => [...new Set((routes || []).flatMap(route => route.paymentMethods || [])
  .filter(item => routeLimits(item, currency)).map(item => item.method))];
export function eligiblePaymentMethods(routes, amount, sourceCurrencyCode = "USD") {
  if (!Array.isArray(routes) || !validAmount(amount, sourceCurrencyCode)) return [];
  return [...new Set(routes.flatMap(route => route.paymentMethods || []).filter(item => {
    const limits = routeLimits(item, sourceCurrencyCode);
    return limits && amount >= limits.minimumAmount && amount <= limits.maximumAmount;
  }).map(item => item.method))];
}
export function selectedMethodLimits(routes, method, amount, sourceCurrencyCode = "USD") {
  const matches = (routes || []).flatMap(route => route.paymentMethods || []).filter(item => item.method === method)
    .map(item => routeLimits(item, sourceCurrencyCode)).filter(item => item && (!(amount > 0) || (amount >= item.minimumAmount && amount <= item.maximumAmount)));
  if (!matches.length) return null;
  const minimumAmount = Math.min(...matches.map(item => item.minimumAmount)), maximumAmount = Math.max(...matches.map(item => item.maximumAmount));
  return sourceCurrencyCode === "USD" ? { minimumUsd: minimumAmount, maximumUsd: maximumAmount } : { minimumAmount, maximumAmount };
}

/** MELD sandbox has its own provider catalogue, amounts, destination and checkout. */
export function AdministrativeSandboxFundingForm({ disabled = false, busy = false, onContinue, onSelectionChange = undefined, destinationAddress = "",
  onOpenCheckout = undefined, checkoutCapability = undefined, onRetryCheckoutCapabilities = undefined, onShowCheckoutHistory = undefined }) {
  const { t } = useI18n(), id = useId();
  const [amount, setAmount] = useState("50"), [countryCode, setCountryCode] = useState("");
  const [preferredProvider, setPreferredProvider] = useState("TRANSAK"), [method, setMethod] = useState("");
  const [options, setOptions] = useState(idleOptions), [revision, setRevision] = useState(0), [sourceCurrencyCode, setSourceCurrencyCode] = useState("USD");
  const submitting = useRef(false), discovery = useRef(null), contextEpoch = useRef(0), selectionEpoch = useRef(0), mounted = useRef(false);
  const liveGeneralCheckout = useRef(false);
  const renderEpoch = selectionEpoch.current;
  const current = options.country === countryCode && options.sourceCurrencyCode === sourceCurrencyCode;
  const providers = current && options.status === "ready" ? options.providers.filter(provider => PROVIDERS.includes(provider.serviceProvider)
    && routeMethods(provider.routes, sourceCurrencyCode).length) : [];
  const serviceProvider = providers.some(provider => provider.serviceProvider === preferredProvider) ? preferredProvider : providers[0]?.serviceProvider || "";
  const selectedOptions = providers.find(provider => provider.serviceProvider === serviceProvider);
  const methods = selectedOptions ? routeMethods(selectedOptions.routes, sourceCurrencyCode) : [];
  const methodsKey = methods.join(",");
  const eligibleMethods = selectedOptions ? eligiblePaymentMethods(selectedOptions.routes, Number(amount), sourceCurrencyCode) : [];
  const amountValid = validAmount(Number(amount), sourceCurrencyCode);
  const selectionUnavailable = Boolean(method && !eligibleMethods.includes(method));
  const limits = selectedOptions ? selectedMethodLimits(selectedOptions.routes, method, 0, sourceCurrencyCode) : null;
  const minimum = limits?.minimumAmount ?? limits?.minimumUsd ?? null, maximum = limits?.maximumAmount ?? limits?.maximumUsd;
  const discoveryStatus = options.status === "ready" && options.failedProviders.length && !providers.length ? "error" : options.status;
  const partialAvailability = current && discoveryStatus === "ready" && options.failedProviders.length > 0;
  const valid = current && Boolean(countryCode) && fundingCurrencyChoices(countryCode).includes(sourceCurrencyCode) && amountValid
    && eligibleMethods.includes(method) && /^0x[0-9a-f]{40}$/i.test(destinationAddress);
  const generalCheckoutValid = checkoutCapability?.status === "ready" && checkoutCapability.configured === true
    && validMeldCheckoutAmount(Number(amount), countryCode, sourceCurrencyCode) && /^0x[0-9a-f]{40}$/i.test(destinationAddress);
  liveGeneralCheckout.current = generalCheckoutValid;

  function changeSelection(update, value) {
    if (!mounted.current || busy || submitting.current) return;
    selectionEpoch.current++; update(value); onSelectionChange?.();
  }
  function invalidateDiscovery() { contextEpoch.current++; discovery.current?.controller.abort(); }
  function changeCountry(value) {
    if (!mounted.current || busy || submitting.current) return;
    invalidateDiscovery(); selectionEpoch.current++;
    setCountryCode(ONRAMP_COUNTRIES.some(([code]) => code === value) ? value : "");
    if (sourceCurrencyCode !== "USD") setAmount("50");
    setSourceCurrencyCode("USD"); setMethod(""); onSelectionChange?.();
  }
  function changeCurrency(value) {
    if (!mounted.current || busy || submitting.current || !fundingCurrencyChoices(countryCode).includes(value)) return;
    invalidateDiscovery(); selectionEpoch.current++;
    setSourceCurrencyCode(value); setAmount(value === "USD" ? "50" : ""); setMethod(""); onSelectionChange?.();
  }
  function retryDiscovery() {
    if (!mounted.current || busy || submitting.current || !countryCode) return;
    invalidateDiscovery(); selectionEpoch.current++; setRevision(value => value + 1); onSelectionChange?.();
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      contextEpoch.current++;
      discovery.current?.controller.abort();
      discovery.current = null;
    };
    // Keep the selection epoch stable through React's effect replay: the
    // lifecycle guard retires an old instance without disabling its replay.
  }, []);

  useEffect(() => {
    if (!countryCode || !fundingCurrencyChoices(countryCode).includes(sourceCurrencyCode)) { setOptions(idleOptions()); return undefined; }
    const controller = new AbortController(), operation = { controller, epoch: contextEpoch.current };
    discovery.current = operation;
    setOptions({ status: "loading", country: countryCode, sourceCurrencyCode, providers: [], failedProviders: [] });
    void Promise.allSettled(PROVIDERS.map(provider => readAdministrativeSandboxOptions(countryCode, provider, { signal: controller.signal, sourceCurrencyCode }))).then(results => {
      if (controller.signal.aborted || discovery.current !== operation || contextEpoch.current !== operation.epoch) return;
      const nextProviders = [], failedProviders = [];
      results.forEach((result, index) => {
        const value = result.status === "fulfilled" ? result.value : null;
        if (value?.country === countryCode && (value.sourceCurrencyCode || "USD") === sourceCurrencyCode && value.serviceProvider === PROVIDERS[index]) {
          const routes = sourceCurrencyCode === "MXN" ? (value.routes || []).map(route => ({ ...route, paymentMethods: (route.paymentMethods || [])
            .filter(item => MXN_METHODS.has(item.method) && (value.serviceProvider === "TRANSAK" || item.method === "CREDIT_DEBIT_CARD")) })) : value.routes;
          nextProviders.push({ ...value, routes });
        }
        else failedProviders.push(PROVIDERS[index]);
      });
      setOptions({ status: "ready", country: countryCode, sourceCurrencyCode, providers: nextProviders, failedProviders });
    });
    return () => { controller.abort(); if (discovery.current === operation) discovery.current = null; };
  }, [countryCode, sourceCurrencyCode, revision]);

  useEffect(() => {
    if (current && options.status === "ready") {
      const choices = methodsKey ? methodsKey.split(",") : [];
      setMethod(previous => choices.includes(previous) ? previous : choices.includes("CREDIT_DEBIT_CARD") ? "CREDIT_DEBIT_CARD" : choices[0] || "");
    }
    // Amount changes preserve the selected provider and rail, even outside its limits.
  }, [methodsKey, countryCode, sourceCurrencyCode, serviceProvider, current, options.status]);

  async function submit(event) {
    event.preventDefault();
    if (!mounted.current || renderEpoch !== selectionEpoch.current || disabled || busy || submitting.current || !valid) return;
    submitting.current = true;
    try { await onContinue({ requestId: fundingRequestId(), amount: Number(amount), countryCode, sourceCurrencyCode, serviceProvider, paymentMethodType: method }); }
    finally { submitting.current = false; }
  }
  async function openGeneralCheckout() {
    if (!mounted.current || renderEpoch !== selectionEpoch.current || disabled || busy || submitting.current || !liveGeneralCheckout.current || !onOpenCheckout) return;
    submitting.current = true;
    try { await onOpenCheckout({ requestId: fundingRequestId(), country: countryCode, sourceCurrencyCode, amount: Number(amount) }); }
    finally { submitting.current = false; }
  }
  return <form className="mb-onramp-simple" onSubmit={event => void submit(event).catch(() => {})} aria-label={t("walletPage.administrativeWalletLabel")}>
    <div className="mb-onramp-simple-main"><div className={styles.formFields}>
      <FundingCountryField id={id} value={countryCode} onChange={changeCountry} busy={busy} />
      <FundingCurrencyField id={id} country={countryCode} value={sourceCurrencyCode} onChange={changeCurrency} busy={busy} />
      <FundingAmountField id={id} amount={amount} sourceCurrencyCode={sourceCurrencyCode} minimumAmount={minimum} maximumAmount={maximum} onChange={value => changeSelection(setAmount, value)} busy={busy} />
      <FundingMethodField id={id} value={method} methods={methods} status={current ? discoveryStatus : countryCode ? "loading" : "idle"} partialAvailability={partialAvailability}
        countrySelected={Boolean(countryCode)} sourceCurrencyCode={sourceCurrencyCode} minimumUsd={minimum} limits={limits} amountValid={amountValid} selectionUnavailable={selectionUnavailable}
        onChange={value => { if (methods.includes(value)) changeSelection(setMethod, value); }} onRetry={retryDiscovery}
        onUseMinimum={minimum !== null && Number(amount) < minimum ? () => changeSelection(setAmount, String(minimum)) : undefined} busy={busy} />
    </div>
    {providers.length > 1 ? <details className={styles.providerChoice}><summary>{t("onramp.processedBy")} {serviceProvider === "TRANSAK" ? "Transak" : "Banxa"}<span>{t("funding.changeProvider")}</span></summary>
      <label className="mb-onramp-country-picker" htmlFor={`${id}-provider`}><span>{t("funding.providerLabel")}</span>
        <select id={`${id}-provider`} value={serviceProvider} onChange={event => { if (providers.some(provider => provider.serviceProvider === event.target.value)) changeSelection(setPreferredProvider, event.target.value); }} disabled={busy}>
          {providers.map(provider => <option key={provider.serviceProvider} value={provider.serviceProvider}>{provider.serviceProvider === "TRANSAK" ? "Transak" : "Banxa"}</option>)}
        </select></label></details> : serviceProvider ? <p className={styles.processedBy}>{t("onramp.processedBy")} {serviceProvider === "TRANSAK" ? "Transak" : "Banxa"}</p> : null}
    <FundingDestination address={destinationAddress} />
    <FundingSubmit disabled={disabled || !valid} busy={busy} />
    {onOpenCheckout ? <section className={styles.providerChoice} aria-label={t("funding.meldCheckoutAction")}>
      <p className={styles.hint}>{t(checkoutCapability?.status === "loading" ? "common.loading" : checkoutCapability?.status === "error"
        ? "funding.meldCheckoutCapabilityError" : checkoutCapability?.configured ? "funding.meldCheckoutHelp" : "funding.meldCheckoutConfiguration")}</p>
      <button type="button" className="executive-button" disabled={disabled || busy || !generalCheckoutValid}
        onClick={() => void openGeneralCheckout().catch(() => {})}>{t("funding.meldCheckoutAction")}</button>
      {checkoutCapability?.status === "error" && onRetryCheckoutCapabilities ? <button type="button" className="executive-button" disabled={busy}
        onClick={onRetryCheckoutCapabilities}>{t("walletPage.retry")}</button> : null}
      {checkoutCapability?.status === "ready" && checkoutCapability.configured && onShowCheckoutHistory ? <button type="button" className="executive-button" disabled={busy}
        onClick={() => { if (mounted.current && !busy && !submitting.current) onShowCheckoutHistory(); }}>{t("funding.meldCheckoutHistory")}</button> : null}
    </section> : null}
    </div>
  </form>;
}

function FundingAmountField({ id, amount, sourceCurrencyCode = "USD", minimumAmount = null, maximumAmount = undefined, onChange, busy }) {
  const { t, locale } = useI18n(), usd = sourceCurrencyCode === "USD";
  const minimum = minimumAmount ?? (usd ? MINIMUM_USD : 0.01), maximum = maximumAmount ?? (usd ? MAXIMUM_USD : 1_000_000_000);
  const invalid = amount !== "" && (!validAmount(Number(amount), sourceCurrencyCode) || Number(amount) < minimum || Number(amount) > maximum);
  const currency = value => new Intl.NumberFormat(locale, { style: "currency", currency: sourceCurrencyCode, maximumFractionDigits: 2 }).format(value);
  const presets = usd ? [50, 100, 500, 1000, 2500, 5000, 10000, 25000].filter(value => value >= minimum && value <= maximum)
    : minimumAmount !== null ? [...new Set([minimum, 500, 1000, 2000, 5000, 10000, 20000].filter(value => value >= minimum && value <= maximum))] : [];
  const sliderAmount = Math.max(minimum, Math.min(maximum, Number(amount) || minimum));
  function sliderKeyDown(event) {
    const next = { ArrowRight: sliderAmount + 100, ArrowUp: sliderAmount + 100, ArrowLeft: sliderAmount - 100, ArrowDown: sliderAmount - 100,
      PageUp: sliderAmount + 1000, PageDown: sliderAmount - 1000, Home: minimum, End: maximum }[event.key];
    if (next === undefined) return;
    event.preventDefault(); onChange(String(Math.max(minimum, Math.min(maximum, next))));
  }
  return <fieldset className={`mb-onramp-amount-fieldset ${styles.amountField}`} disabled={busy}>
    <legend className={styles.amountLegend}>{t("onramp.amountLabel")}<span className={styles.amountCurrency}>{sourceCurrencyCode}</span></legend>
    {presets.length ? <div className={`mb-onramp-quick-amounts ${styles.quickAmounts}`}>{presets.map(value => <button type="button" key={value}
      className={Number(amount) === value ? "active" : ""} aria-label={currency(value)} aria-pressed={Number(amount) === value} onClick={() => onChange(String(value))}>
      <bdi>{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)}</bdi></button>)}</div> : null}
    <label className={`mb-onramp-amount-input ${styles.amountInput}`} htmlFor={`${id}-amount`}><span>{sourceCurrencyCode}</span><input id={`${id}-amount`} name="amount" type="number" min={String(minimum)} max={String(maximum)} step="0.01" inputMode="decimal" autoComplete="off"
      value={amount} onChange={event => onChange(event.target.value)} aria-label={t("onramp.amountLabel")} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-amount-hint` : `${id}-amount-limits`} required /></label>
    {usd ? <div className={styles.amountSliderGroup}><label className="sr-only" htmlFor={`${id}-amount-slider`}>{t("funding.amountSlider")}</label>
      <input className={styles.amountSlider} id={`${id}-amount-slider`} type="range" dir="ltr" min={minimum} max={maximum} step="0.01" value={sliderAmount} onChange={event => onChange(event.target.value)} onKeyDown={sliderKeyDown} aria-valuetext={currency(sliderAmount)} disabled={busy} />
      <div className={styles.sliderLimits} aria-hidden="true"><bdi>{currency(minimum)}</bdi><bdi>{currency(maximum)}</bdi></div></div> : null}
    <small id={`${id}-amount-limits`} className={styles.hint}>{usd ? t("funding.personalAmountLimits", { minimum: currency(minimum), maximum: currency(maximum) }) : t("funding.administrativeMxnLimits")}</small>
    {invalid ? <small id={`${id}-amount-hint`} role="alert" className="mb-onramp-disclosure">{t(usd ? "funding.amountRange" : "funding.localAmountRequired")}</small> : null}
  </fieldset>;
}
function FundingCurrencyField({ id, country, value, onChange, busy }) {
  const { t, locale } = useI18n(), names = new Intl.DisplayNames([locale], { type: "currency" });
  return <label className={`mb-onramp-country-picker ${styles.currencyField}`} htmlFor={`${id}-currency`}><span>{t("funding.currencyLabel")}</span>
    <select id={`${id}-currency`} value={value} onChange={event => onChange(event.target.value)} disabled={busy || !country} required>
      {fundingCurrencyChoices(country).map(code => <option key={code} value={code}>{code} · {names.of(code) || code}</option>)}
    </select></label>;
}
function FundingCountryField({ id, value, onChange, busy, countries = ONRAMP_COUNTRIES }) {
  const { t, locale } = useI18n();
  const names = new Intl.DisplayNames([locale], { type: "region" });
  return <div className={`mb-onramp-country-picker ${styles.countryField}`}><div className={styles.countryHeading}>
    <label htmlFor={`${id}-country`}>{t("funding.residenceCountryLabel")}</label>
    <Popover><PopoverTrigger asChild><button type="button" className={styles.residencyInfoButton} aria-label={t("funding.residenceCountryInfo")}><Info size={18} aria-hidden="true" /></button></PopoverTrigger>
      <PopoverContent className={styles.residencyPopover} sideOffset={8} collisionPadding={16} aria-label={t("funding.residenceCountryInfo")}><p>{t("funding.residenceCountryHelp")}</p><p><strong>{t("funding.residenceCountrySsn")}</strong></p></PopoverContent></Popover>
    </div><select id={`${id}-country`} value={value} onChange={event => onChange(event.target.value)} disabled={busy} autoComplete="off" required>
      <option value="">{t("funding.countryPrompt")}</option>{countries.map(([code]) => <option key={code} value={code}>{names.of(code) || code}</option>)}
    </select></div>;
}
function FundingMethodField({ id, value, methods, status, countrySelected, sourceCurrencyCode = "USD", minimumUsd, limits, onChange, onRetry, onUseMinimum, busy, partialAvailability = false, amountValid = true, selectionUnavailable = false }) {
  const { t, locale } = useI18n(), ready = countrySelected && status === "ready";
  const currency = value => new Intl.NumberFormat(locale, { style: "currency", currency: sourceCurrencyCode }).format(value);
  return <fieldset className={styles.methodField} disabled={busy} aria-busy={countrySelected && status === "loading"} aria-describedby={`${id}-methods-state`}>
    <legend>{t("onramp.paymentMethodLabel")}{ready && methods.length ? <span className={styles.methodCount}>{t("funding.methodCount", { count: methods.length })}</span> : null}</legend>
    {methods.length ? <div className={styles.methodChoices}>{methods.map(method => { const Icon = ["CREDIT_DEBIT_CARD", "CARD", "VISA", "MASTERCARD"].includes(method) ? CreditCard : ["APPLE_PAY", "GOOGLE_PAY"].includes(method) ? Smartphone : ["BANK_TRANSFER", "SEPA", "ACH"].includes(method) ? Landmark : WalletCards;
      return <label key={method} className={`${styles.methodOption}${value === method ? ` ${styles.methodSelected}` : ""}`}><input type="radio" name={`${id}-method`} value={method} checked={value === method} onChange={() => onChange(method)} disabled={!ready} required /><Icon size={17} aria-hidden="true" /><span>{paymentMethodLabel(method, t)}</span></label>;
    })}</div> : null}
    <div id={`${id}-methods-state`} role="status" className="mb-onramp-disclosure">
      {!countrySelected ? t("funding.chooseCountryFirst") : status === "loading" ? <span className={styles.methodLoading}><Loader2 className="animate-spin" size={15} aria-hidden="true" />{t("walletPage.checkingAvailability")}</span>
        : status === "error" ? <p>{t("funding.methodsLoadFailed")}</p> : ready && !methods.length ? <p>{t("funding.methodsForAmountUnavailable")}</p> : null}
      {ready && selectionUnavailable ? <p>{t(amountValid ? "funding.methodUnavailable" : sourceCurrencyCode === "USD" ? "funding.amountRange" : "funding.localAmountRequired")}</p> : null}
      {ready && limits ? <p>{t("funding.methodRange", { minimum: currency(limits.minimumAmount ?? limits.minimumUsd), maximum: currency(limits.maximumAmount ?? limits.maximumUsd) })}</p> : null}
      {ready && onUseMinimum ? <button className="executive-button" type="button" onClick={onUseMinimum} disabled={busy}>{t("funding.useProviderMinimum", { amount: currency(minimumUsd) })}</button> : null}
      {ready && partialAvailability ? <p>{t("funding.methodsPartiallyLoaded")}</p> : null}
      {countrySelected && (status === "error" || partialAvailability) ? <button className="executive-button" type="button" onClick={onRetry} disabled={busy}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button> : null}
      {ready && methods.length ? <p>{t("funding.providerFinalReview")}</p> : null}
    </div>
  </fieldset>;
}
function FundingSubmit({ disabled, busy }) {
  const { t } = useI18n();
  return <button className="executive-button primary mb-onramp-primary" type="submit" disabled={disabled || busy}>{busy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(busy ? "funding.preparingTopUp" : "walletPage.addFundsAction")}</button>;
}
export function FundingDestination({ address }) {
  const { t } = useI18n(), id = useId();
  return <div className={styles.destinationReview}><label htmlFor={`${id}-destination`}>{t("funding.reviewDestination")}<small>USDT · Polygon</small></label><input id={`${id}-destination`} type="text" readOnly value={address} dir="ltr" title={address || undefined} aria-describedby={`${id}-destination-help`} placeholder={t("funding.destinationReviewEmpty")} /><small id={`${id}-destination-help`} className={address ? "sr-only" : undefined}>{address ? t("funding.destinationReviewCopy") : t("funding.destinationReviewEmpty")}</small></div>;
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
