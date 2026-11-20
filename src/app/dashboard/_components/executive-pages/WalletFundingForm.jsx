"use client";

import { CreditCard, Info, Landmark, Loader2, RefreshCw, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { APP_MELD_COUNTRIES, APP_MELD_MINIMUM_USD, appMeldCurrencyChoices, appMeldDefaultCurrency, appMeldDestinationFor, appMeldFundingAsset, appMeldLimits, appMeldMinorUnits, appMeldRouteSupported, appMeldSourceAmount } from "@/lib/app-meld-funding-contract.mjs";
import { fundingRequestId, readPersonalFundingOptions } from "@/lib/wallet-funding-client.mjs";
import AppWalletDepositQr from "./AppWalletDepositQr";
import styles from "./wallet-funding.module.css";

const EMPTY_OPTIONS = { status: "idle", country: "", sourceCurrencyCode: "USD", paymentMethods: [], routes: [] };
// The small backend test amount is retained for existing records, not offered
// by the public form. Provider floors may raise its public minimum.
const PERSONAL_FORM_MINIMUM_USD = APP_MELD_MINIMUM_USD;
const PERSONAL_FORM_DEFAULT_USD = 100;
function defaultAmount(country, currency) {
  if (currency === "COP") return "";
  return String(currency === "USD" ? PERSONAL_FORM_DEFAULT_USD : currency === "BRL" ? 500 : appMeldLimits(currency, country)[0]);
}

function routeAsset(route, country, currency) {
  return route.destinationCurrencyCode ?? appMeldFundingAsset(country, currency);
}

export function eligiblePaymentMethods(routes, amount, sourceCurrencyCode = "USD", countryCode = "") {
  if (!Array.isArray(routes) || !appMeldSourceAmount(amount, sourceCurrencyCode, countryCode)) return [];
  const entered = Number.isFinite(amount) && amount > 0;
  return [...new Set(routes.flatMap(route => (route.paymentMethods || [])
    .filter(item => { const limits = routeLimits(item, sourceCurrencyCode, countryCode); return appMeldRouteSupported(countryCode, sourceCurrencyCode, item.method, route.serviceProvider, routeAsset(route, countryCode, sourceCurrencyCode)) && limits && (!entered || (amount >= limits.minimumAmount && amount <= limits.maximumAmount)); })
    .map(item => item.method)))];
}

function routeLimits(item, sourceCurrencyCode, countryCode = "") {
  if ((item.currencyCode || "USD") !== sourceCurrencyCode) return null;
  const providerMinimum = item.minimumAmount ?? item.minimumUsd;
  const providerMaximum = item.maximumAmount ?? item.maximumUsd;
  const [floor, ceiling] = appMeldLimits(sourceCurrencyCode, countryCode);
  const maximumAmount = Math.min(ceiling, providerMaximum);
  const minimumAmount = Math.max(floor, providerMinimum);
  return Number.isFinite(providerMinimum) && providerMinimum >= 0 && Number.isFinite(providerMaximum) && Number.isFinite(maximumAmount) && maximumAmount >= minimumAmount
    ? { minimumAmount, maximumAmount } : null;
}

function lowestRouteMinimum(routes, sourceCurrencyCode = "USD", countryCode = "") {
  const limits = (routes || []).flatMap(route => (route.paymentMethods || []).filter(item => appMeldRouteSupported(countryCode, sourceCurrencyCode, item.method, route.serviceProvider, routeAsset(route, countryCode, sourceCurrencyCode))))
    .map(item => routeLimits(item, sourceCurrencyCode, countryCode)?.minimumAmount).filter(Number.isFinite);
  return limits.length ? Math.min(...limits) : null;
}

export function selectedMethodLimits(routes, method, amount, sourceCurrencyCode = "USD", countryCode = "") {
  const matches = (routes || []).flatMap(route => route.paymentMethods || [])
    .filter(item => item.method === method).map(item => routeLimits(item, sourceCurrencyCode, countryCode))
    .filter(item => item && (!(amount > 0) || (amount >= item.minimumAmount && amount <= item.maximumAmount)));
  if (!matches.length) return null;
  const minimumAmount = Math.max(sourceCurrencyCode === "USD" ? PERSONAL_FORM_MINIMUM_USD : 0, Math.min(...matches.map(item => item.minimumAmount)));
  const maximumAmount = Math.max(...matches.map(item => item.maximumAmount));
  return sourceCurrencyCode === "USD" ? { minimumUsd: minimumAmount, maximumUsd: maximumAmount } : { minimumAmount, maximumAmount };
}

// ISO currencies are choices to consult, not a claim that a provider supports a route.
const PROVIDER_NAMES = { MERCURYO: "Mercuryo", ONRAMPMONEY: "Onramp Money", ALCHEMYPAY: "Alchemy Pay", BANXA: "Banxa", ONMETA: "Onmeta" };
const PERSONAL_COUNTRIES = APP_MELD_COUNTRIES.map(code => [code]);
export function fundingCurrencyChoices(country) {
  const currencies = appMeldCurrencyChoices(country);
  return country === "MX" ? ["USD", "MXN"] : currencies;
}

/** Personal state and availability never consume the administrative options endpoint. */
export function PersonalFundingForm({ disabled = false, busy = false, onContinue, onSelectionChange = undefined, destinationAddress = "", walletAction = null }) {
  const { t, locale } = useI18n();
  const id = useId();
  const [amount, setAmount] = useState(String(PERSONAL_FORM_DEFAULT_USD));
  const [countryCode, setCountryCode] = useState("");
  const [method, setMethod] = useState("");
  const [providerChoice, setProviderChoice] = useState("");
  const [destinationChoice, setDestinationChoice] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [revision, setRevision] = useState(0);
  const [sourceCurrencyCode, setSourceCurrencyCode] = useState("USD");
  const submitting = useRef(false);
  const localCurrencies = useRef({});
  const defaultAmountPending = useRef(false);
  const methodContext = useRef("");
  const usesReown = countryCode === "US";
  const current = options.country === countryCode && (options.sourceCurrencyCode || "USD") === sourceCurrencyCode;
  const methods = current && options.status === "ready" ? eligiblePaymentMethods(options.routes, Number(amount), sourceCurrencyCode, countryCode) : [];
  const methodsKey = methods.join(",");
  const methodRoutes = current ? options.routes.filter(route => route.paymentMethods.some(item => item.method === method)) : [];
  const networkChoices = [...new Set(methodRoutes.map(route => routeAsset(route, countryCode, sourceCurrencyCode)))];
  const eligibleRoutes = methodRoutes.filter(route => eligiblePaymentMethods([route], Number(amount), sourceCurrencyCode, countryCode).includes(method));
  const preferred = options.destinationCurrencyCode;
  const destinationCode = destinationChoice || (eligibleRoutes.some(route => routeAsset(route, countryCode, sourceCurrencyCode) === preferred)
    ? preferred : eligibleRoutes[0] ? routeAsset(eligibleRoutes[0], countryCode, sourceCurrencyCode) : networkChoices[0] || preferred);
  const destination = appMeldDestinationFor(destinationCode || appMeldFundingAsset(countryCode, sourceCurrencyCode));
  const matchingRoutes = methodRoutes.filter(route => routeAsset(route, countryCode, sourceCurrencyCode) === destinationCode);
  const selectableRoutes = matchingRoutes.filter(route => eligibleRoutes.includes(route));
  const provider = providerChoice ? selectableRoutes.find(route => route.serviceProvider === providerChoice) : selectableRoutes[0];
  const selectedRoutes = provider ? [provider] : providerChoice ? matchingRoutes.filter(route => route.serviceProvider === providerChoice) : matchingRoutes;
  const selectedLimits = current && method ? selectedMethodLimits(selectedRoutes, method, 0, sourceCurrencyCode, countryCode) : null;
  const routeMinimum = current ? selectedLimits?.minimumAmount ?? selectedLimits?.minimumUsd ?? lowestRouteMinimum(options.routes, sourceCurrencyCode, countryCode) : null;
  const selectionUnavailable = Boolean(current && options.status === "ready" && method && !provider);
  const minorUnits = appMeldMinorUnits(countryCode, sourceCurrencyCode);
  const localeAmount = value => new Intl.NumberFormat(locale, { style: "currency", currency: sourceCurrencyCode }).format(value);
  const otherMethods = current && options.status === "ready" ? [...new Set(options.routes.flatMap(route => route.paymentMethods
    .filter(item => appMeldRouteSupported(countryCode, sourceCurrencyCode, item.method, route.serviceProvider, routeAsset(route, countryCode, sourceCurrencyCode)))
    .map(item => item.method)))].filter(other => other !== method && !methods.includes(other)).map(other => {
      const limits = selectedMethodLimits(options.routes, other, 0, sourceCurrencyCode, countryCode);
      return { method: other, minimum: limits?.minimumAmount ?? limits?.minimumUsd };
    }).filter(other => Number.isFinite(other.minimum) && Number(amount) < other.minimum) : [];
  const showCurrency = Boolean(countryCode && (sourceCurrencyCode !== "USD" || fundingCurrencyChoices(countryCode).length > 1));
  const parsedAmount = Number(amount);
  const valid = Boolean((usesReown || (provider && destination)) && /^0x[0-9a-f]{40}$/i.test(destinationAddress));

  function changeSelection(update, value) {
    update(value);
    onSelectionChange?.();
  }

  useEffect(() => {
    const context = `${countryCode}:${sourceCurrencyCode}`;
    if (methodContext.current !== context) { setMethod(""); setProviderChoice(""); setDestinationChoice(""); }
    methodContext.current = context;
    if (!countryCode || usesReown) { setOptions(EMPTY_OPTIONS); return undefined; }
    const controller = new AbortController();
    setOptions({ ...EMPTY_OPTIONS, status: "loading", country: countryCode, sourceCurrencyCode });
    readPersonalFundingOptions(countryCode, { signal: controller.signal, sourceCurrencyCode }).then(data => {
      if (!controller.signal.aborted) {
        setOptions({ ...data, status: "ready" });
        if (defaultAmountPending.current) {
          const minimum = lowestRouteMinimum(data.routes, sourceCurrencyCode, countryCode);
          if (minimum !== null) setAmount(initial => Number(initial) < minimum ? String(minimum) : initial);
          defaultAmountPending.current = false;
        }
      }
    }).catch(() => { if (!controller.signal.aborted) setOptions({ ...EMPTY_OPTIONS, status: "error", country: countryCode, sourceCurrencyCode }); });
    return () => controller.abort();
  }, [countryCode, sourceCurrencyCode, revision, usesReown]);

  useEffect(() => {
    const eligible = methodsKey.split(",");
    const preferred = { MXN: "SPEI", BRL: "PIX" }[sourceCurrencyCode];
    setMethod(selected => selected || (preferred && eligible.includes(preferred) ? preferred
      : eligible.includes("CREDIT_DEBIT_CARD") ? "CREDIT_DEBIT_CARD" : eligible.includes("PSE") ? "PSE" : eligible[0] || ""));
  }, [methodsKey, countryCode, amount, sourceCurrencyCode]);

  async function submit(event) {
    event.preventDefault();
    if (disabled || busy || submitting.current || !valid) return;
    submitting.current = true;
    try {
      if (usesReown) await onContinue({ countryCode });
      else await onContinue({ requestId: fundingRequestId(), amount: parsedAmount, countryCode, sourceCurrencyCode,
        paymentMethodType: method, serviceProvider: provider.serviceProvider, destinationCurrencyCode: destinationCode });
    } finally { submitting.current = false; }
  }

  return <form className="mb-onramp-simple" onSubmit={event => void submit(event).catch(() => {})} aria-label={t("walletPage.personalWalletLabel")}>
    <div className="mb-onramp-simple-main">
      <div className={`${styles.formFields}${usesReown ? ` ${styles.reownFields}` : !showCurrency ? ` ${styles.implicitCurrency}` : ""}`}>
        <FundingCountryField id={id} value={countryCode} countries={PERSONAL_COUNTRIES} label={t("funding.residenceCountryLabel")} onChange={value => {
          const currency = localCurrencies.current[value] || appMeldDefaultCurrency(value);
          changeSelection(setCountryCode, value);
          defaultAmountPending.current = Boolean(value);
          if (value !== countryCode) setAmount(defaultAmount(value, currency));
          setSourceCurrencyCode(currency);
        }} busy={busy} />
        {usesReown ? <section className={styles.reownCheckout} aria-labelledby={`${id}-reown-checkout`}>
          <h3 id={`${id}-reown-checkout`}>{t("funding.reownUsCheckoutTitle")}</h3>
          <p>{t("funding.reownUsCheckoutDescription")}</p>
        </section> : <>
          {showCurrency ? <FundingCurrencyField id={id} country={countryCode} value={sourceCurrencyCode} onChange={value => {
            if (!fundingCurrencyChoices(countryCode).includes(value)) return;
            localCurrencies.current[countryCode] = value;
            defaultAmountPending.current = true;
            changeSelection(setSourceCurrencyCode, value);
            setAmount(defaultAmount(countryCode, value));
          }} busy={busy} /> : null}
          <FundingAmountField id={id} amount={amount} sourceCurrencyCode={sourceCurrencyCode} minimumAmount={routeMinimum} maximumAmount={selectedLimits?.maximumAmount ?? selectedLimits?.maximumUsd} countryCode={countryCode}
            onChange={value => { defaultAmountPending.current = false; changeSelection(setAmount, value); }} busy={busy} />
          <FundingMethodField id={id} value={methods.includes(method) ? method : ""} methods={methods} status={current ? options.status : "loading"}
            selectionUnavailable={selectionUnavailable}
            countrySelected={Boolean(countryCode)} sourceCurrencyCode={sourceCurrencyCode} minimumUsd={routeMinimum}
            amountValid={appMeldSourceAmount(parsedAmount, sourceCurrencyCode, countryCode)}
            onUseMinimum={routeMinimum !== null && Number(amount) < routeMinimum ? () => changeSelection(setAmount, routeMinimum.toFixed(minorUnits)) : undefined}
            limits={selectedLimits} onChange={value => { setProviderChoice(""); setDestinationChoice(""); changeSelection(setMethod, value); }}
            onRetry={() => setRevision(value => value + 1)} busy={busy}>
            {otherMethods.length ? <div className="flex flex-wrap gap-2">
              {otherMethods.map(other => <button className="executive-button" type="button" disabled={busy} key={other.method} onClick={() => {
                defaultAmountPending.current = false; setProviderChoice(""); setDestinationChoice(""); setMethod(other.method);
                changeSelection(setAmount, other.minimum.toFixed(minorUnits));
              }}>{t("funding.methodAtMinimum", { method: paymentMethodLabel(other.method, t), amount: localeAmount(other.minimum) })}</button>)}
            </div> : null}
            {networkChoices.length > 1 ? <label className={`mb-onramp-country-picker ${styles.currencyField}`} htmlFor={`${id}-network`}><span>{t("funding.depositNetwork")}</span>
              <select id={`${id}-network`} value={destinationCode} disabled={busy} onChange={event => {
                setProviderChoice(""); changeSelection(setDestinationChoice, event.target.value);
              }}>{networkChoices.map(code => <option key={code} value={code}>{appMeldDestinationFor(code)?.name}</option>)}</select></label> : null}
            {matchingRoutes.length > 1 ? <label className={`mb-onramp-country-picker ${styles.currencyField}`} htmlFor={`${id}-provider`}><span>{t("funding.providerLabel")}</span>
              <select id={`${id}-provider`} value={providerChoice || provider?.serviceProvider || ""} onChange={event => changeSelection(setProviderChoice, event.target.value)} disabled={busy}>
                {!providerChoice && !provider ? <option value="" disabled>{t("funding.providerLabel")}</option> : null}
                {matchingRoutes.map(route => <option key={route.serviceProvider} value={route.serviceProvider}>{PROVIDER_NAMES[route.serviceProvider]}</option>)}
              </select></label> : provider ? <small>{t("funding.providerLabel")} · {PROVIDER_NAMES[provider.serviceProvider]}</small> : null}
          </FundingMethodField>
        </>}
      </div>
      <FundingDestination address={destinationAddress} asset={countryCode && !usesReown ? destination?.asset : undefined}
        network={usesReown ? "" : destination?.name || "Polygon"} editableByProvider={provider?.serviceProvider === "MERCURYO"}
        reviewMessage={usesReown ? "funding.reownUsDestinationReview" : undefined} />
      <div className={styles.fundingActions}>
        {walletAction || <FundingSubmit disabled={disabled || !valid} busy={busy}
          label={usesReown ? "funding.reownUsCheckoutAction" : undefined} />}
        {!disabled && destinationAddress ? <AppWalletDepositQr key={destinationAddress} address={destinationAddress}
          preferredDestinationCode={!usesReown && current && method && destinationCode ? destinationCode : "USDC_POLYGON"} disabled={busy} /> : null}
      </div>
    </div>
  </form>;
}

function FundingAmountField({ id, amount, sourceCurrencyCode = "USD", minimumAmount = null, maximumAmount = undefined, countryCode = "", onChange, busy }) {
  const { t, locale } = useI18n();
  const usd = sourceCurrencyCode === "USD";
  const cop = sourceCurrencyCode === "COP";
  const [floor, ceiling] = appMeldLimits(sourceCurrencyCode, countryCode);
  const minimum = Math.max(floor, minimumAmount ?? floor);
  const minorUnits = appMeldMinorUnits(countryCode, sourceCurrencyCode);
  const maximum = Math.min(ceiling, maximumAmount ?? ceiling);
  const invalid = amount !== "" && (!appMeldSourceAmount(Number(amount), sourceCurrencyCode, countryCode) || Number(amount) < minimum || Number(amount) > maximum);
  const currency = value => new Intl.NumberFormat(locale, { style: "currency", currency: sourceCurrencyCode }).format(value);
  const presets = usd ? [...new Set([minimum, PERSONAL_FORM_DEFAULT_USD, 500, 1000, 2000, 5000, 10000, maximum])].filter(value => value >= minimum && value <= maximum)
    : cop && minimumAmount !== null ? [...new Set([minimum, 200000, 500000, 1000000, 2000000, maximum])].filter(value => value >= minimum && value <= maximum) : [];
  const sliderAmount = Number.isFinite(Number(amount)) ? Math.min(maximum, Math.max(minimum, Number(amount))) : minimum;
  const setSliderAmount = value => onChange(String(Math.min(maximum, Math.max(minimum, Math.round(value * 100) / 100))));
  function sliderKeyDown(event) {
    const next = { ArrowRight: sliderAmount + 100, ArrowUp: sliderAmount + 100, ArrowLeft: sliderAmount - 100, ArrowDown: sliderAmount - 100,
      PageUp: sliderAmount + 1000, PageDown: sliderAmount - 1000, Home: minimum, End: maximum }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSliderAmount(next);
  }
  return <fieldset className={`mb-onramp-amount-fieldset ${styles.amountField}`} disabled={busy}>
    <legend className={styles.amountLegend}>{t("onramp.amountLabel")}<span className={styles.amountCurrency}>{sourceCurrencyCode}</span></legend>
    {presets.length ? <div className={`mb-onramp-quick-amounts ${styles.quickAmounts}`}>{presets.map(value => <button type="button" key={value}
      className={Number(amount) === value ? "active" : ""} aria-label={currency(value)} aria-pressed={Number(amount) === value} onClick={() => onChange(String(value))}>
      <bdi>{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)}</bdi></button>)}</div> : null}
    <label className={`mb-onramp-amount-input ${styles.amountInput}`} htmlFor={`${id}-amount`}><span>{sourceCurrencyCode}</span><input id={`${id}-amount`} name="amount" autoComplete="off" type="number" min={String(minimum)} max={String(maximum)} step={minorUnits === 0 ? "1" : "0.01"} inputMode={minorUnits === 0 ? "numeric" : "decimal"}
      value={amount} onChange={event => onChange(event.target.value)} aria-label={t("onramp.amountLabel")} aria-invalid={invalid || undefined} aria-describedby={[usd ? `${id}-usd-limits` : "", invalid ? `${id}-amount-hint` : ""].filter(Boolean).join(" ") || undefined} required /></label>
    {usd ? <div className={styles.amountSliderGroup}>
      <label className="sr-only" htmlFor={`${id}-amount-slider`}>{t("funding.amountSlider")}</label>
      <input className={styles.amountSlider} id={`${id}-amount-slider`} name="amountSlider" type="range" dir="ltr" min={minimum} max={maximum} step="any" value={sliderAmount}
        onChange={event => setSliderAmount(Math.round(Number(event.target.value) / 50) * 50)} onKeyDown={sliderKeyDown} aria-valuetext={currency(sliderAmount)} aria-describedby={`${id}-usd-limits`} />
      <div className={styles.sliderLimits} dir="ltr" aria-hidden="true"><span>{currency(minimum)}</span><span>{currency(maximum)}</span></div>
      <small id={`${id}-usd-limits`} className="mb-onramp-disclosure">{t("funding.personalAmountLimits", { minimum: currency(minimum), maximum: currency(maximum) })}</small>
    </div> : null}
    {invalid ? <small id={`${id}-amount-hint`} role="alert" className="mb-onramp-disclosure">{t("funding.localAmountRange")}</small> : null}
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
            <p>{t("funding.residenceCountryHelp")}</p><p><strong>{t("funding.residenceUsDocuments")}</strong></p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
    <select id={`${id}-country`} value={value} onChange={event => onChange(event.target.value)} autoComplete="off" disabled={busy} required>
      <option value="">{t("funding.countryPrompt")}</option>{countries.map(([code]) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name, locale))
        .map(({ code, name }) => <option value={code} key={code}>{name}</option>)}
    </select></div>;
}

function FundingMethodField({ id, value, methods, status, countrySelected, sourceCurrencyCode = "USD", minimumUsd, limits, onChange, onRetry, onUseMinimum = undefined, busy, partialAvailability = false, amountValid = true, selectionUnavailable = false, children = undefined }) {
  const { t, locale } = useI18n();
  const ready = countrySelected && status === "ready";
  const unavailable = countrySelected && (status === "error" || (ready && amountValid && !methods.length));
  const currency = number => new Intl.NumberFormat(locale, { style: "currency", currency: sourceCurrencyCode, maximumFractionDigits: 2 }).format(number);
  return <fieldset className={styles.methodField} disabled={busy} aria-busy={countrySelected && status === "loading"} aria-describedby={`${id}-methods-state`}>
    <legend>{t("onramp.paymentMethodLabel")}{ready && methods.length ? <span className={styles.methodCount}>{t("funding.methodCount", { count: new Intl.NumberFormat(locale).format(methods.length) })}</span> : null}</legend>
    {methods.length ? <div className={styles.methodChoices}>{methods.map(method => {
      const Icon = ["CREDIT_DEBIT_CARD", "CARD", "VISA", "MASTERCARD"].includes(method) ? CreditCard
        : ["BANK_TRANSFER", "SEPA", "ACH", "SPEI", "PSE", "PIX", "VIETQR", "LOCAL_BANK_TRANSFER"].includes(method) ? Landmark : ["APPLE_PAY", "GOOGLE_PAY", "MPESA"].includes(method) ? Smartphone : WalletCards;
      return <label className={`${styles.methodOption}${value === method ? ` ${styles.methodSelected}` : ""}`} key={method}>
        <input type="radio" name={`${id}-method`} value={method} checked={value === method} onChange={() => onChange(method)} disabled={!ready} required />
        <Icon size={17} aria-hidden="true" /><span>{paymentMethodLabel(method, t)}</span>
      </label>;
    })}</div> : null}
    {children}
    <div id={`${id}-methods-state`} role="status" className="mb-onramp-disclosure">
      {selectionUnavailable && methods.length ? <p>{t("funding.methodUnavailable")}</p> : null}
      {unavailable ? <><p>{t(status === "error" ? "funding.methodsLoadFailed" : "funding.methodsForAmountUnavailable")}</p>{status === "error" ? <button className="executive-button" type="button" onClick={onRetry} disabled={busy}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button> : null}</>
        : !countrySelected ? t("funding.chooseCountryFirst") : status === "loading" ? <span className={styles.methodLoading}><Loader2 className="animate-spin" size={15} aria-hidden="true" />{t("walletPage.checkingAvailability")}</span>
          : ready && !amountValid ? t("funding.localAmountRange") : null}
      {ready && partialAvailability && methods.length ? <><p>{t("funding.methodsPartiallyLoaded")}</p><button className="executive-button" type="button" onClick={onRetry} disabled={busy}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button></> : null}
      {ready && limits ? t("funding.methodRange", { minimum: currency(limits.minimumAmount ?? limits.minimumUsd), maximum: currency(limits.maximumAmount ?? limits.maximumUsd) })
        : ready && amountValid && !methods.length && minimumUsd !== null ? <p>{t("funding.providerMinimum", { amount: currency(minimumUsd) })}</p> : null}
      {ready && (!methods.length || selectionUnavailable) && onUseMinimum ? <button className="executive-button" type="button" onClick={onUseMinimum} disabled={busy}>{t("funding.useProviderMinimum", { amount: currency(minimumUsd) })}</button> : null}
      {ready && methods.length ? <p>{t("funding.providerFinalReview")}</p> : null}
    </div>
  </fieldset>;
}

function FundingSubmit({ disabled, busy, label = "walletPage.addFundsAction" }) {
  const { t } = useI18n();
  return <button className="executive-button primary mb-onramp-primary" type="submit" disabled={disabled || busy}>
    {busy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(busy ? "funding.preparingTopUp" : label)}
  </button>;
}

export function FundingDestination({ address, asset, network = "Polygon", editableByProvider = false, reviewMessage = "" }) {
  const { t } = useI18n();
  const id = useId();
  return <div className={styles.destinationReview}><label htmlFor={`${id}-destination`}>{t("funding.reviewDestination")}{network ? <small>{asset ? `${asset} · ${network}` : network}</small> : null}</label>
    <input id={`${id}-destination`} type="text" readOnly value={address} dir="ltr" title={address || undefined}
      aria-describedby={`${id}-destination-help`} placeholder={t("funding.destinationReviewEmpty")} />
    <small id={`${id}-destination-help`} className={address && !editableByProvider && !reviewMessage ? "sr-only" : undefined}>
      {t(!address ? "funding.destinationReviewEmpty" : reviewMessage || (editableByProvider ? "funding.destinationReviewEditable" : "funding.destinationReviewCopy"))}
    </small>
  </div>;
}

export function paymentMethodLabel(code, t) {
  const brands = { ASTROPAY: "AstroPay", NETELLER: "Neteller", PAYSAFECARD: "PaysafeCard", SKRILL: "Skrill" };
  if (Object.hasOwn(brands, code)) return brands[code];
  if (["CREDIT_DEBIT_CARD", "CARD", "VISA", "MASTERCARD"].includes(code)) return t("onramp.cardPayment");
  if (code === "APPLE_PAY") return "Apple Pay";
  if (code === "GOOGLE_PAY") return "Google Pay";
  if (code === "PIX") return "Pix";
  if (code === "MPESA") return "M-Pesa";
  if (code === "VIETQR") return "VietQR";
  if (code === "SEPA") return "SEPA";
  if (code === "PAYID") return "PayID";
  if (code === "OPEN_BANKING") return t("funding.openBanking");
  if (code === "MOBILE_MONEY") return t("funding.mobileMoney");
  if (code === "KLARNA") return "Klarna";
  if (code === "KHIPU") return "Khipu";
  if (code === "UPI") return "UPI";
  if (code === "IMPS") return "IMPS";
  if (code === "SPEI") return t("funding.speiPayment");
  if (code === "PSE") return t("funding.psePayment");
  if (code === "LOCAL_BANK_TRANSFER") return t("funding.localBankTransfer");
  if (code === "VENMO") return t("funding.venmoPayment");
  if (code === "PAYPAL") return t("funding.paypalPayment");
  if (code === "ACH") return `${t("onramp.bankTransfer")} (ACH)`;
  if (["BANK_TRANSFER", "SEPA"].includes(code)) return t("onramp.bankTransfer");
  return code.replaceAll("_", " ");
}
