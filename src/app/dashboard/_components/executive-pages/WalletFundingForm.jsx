"use client";

import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { browserOnrampRegion } from "@/lib/meld-onramp.mjs";
import { ONRAMP_COUNTRIES } from "@/lib/meld-onramp-client.mjs";
import { fundingRequestId, readAdministrativeSandboxOptions, readPersonalFundingOptions } from "@/lib/wallet-funding-client.mjs";
import { validFundingAmount } from "@/lib/wallet-funding-contract.mjs";

const EMPTY_OPTIONS = { status: "idle", country: "", paymentMethods: [], routes: [] };

export function eligiblePaymentMethods(routes, amount) {
  if (!validFundingAmount(amount) || !Array.isArray(routes)) return [];
  return [...new Set(routes.flatMap(route => (route.paymentMethods || [])
    .filter(item => Number.isFinite(item.minimumUsd) && Number.isFinite(item.maximumUsd)
      && amount >= item.minimumUsd && amount <= item.maximumUsd).map(item => item.method)))];
}

function lowestRouteMinimum(routes) {
  const limits = (routes || []).flatMap(route => route.paymentMethods || []).map(item => item.minimumUsd).filter(Number.isFinite);
  return limits.length ? Math.max(50, Math.min(...limits)) : null;
}

/** Personal state and availability never consume the administrative options endpoint. */
export function PersonalFundingForm({ disabled = false, busy = false, onContinue }) {
  const { t } = useI18n();
  const id = useId();
  const [amount, setAmount] = useState("50");
  const [countryCode, setCountryCode] = useState("");
  const [method, setMethod] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);
  const current = options.country === countryCode;
  const methods = current && options.status === "ready" ? eligiblePaymentMethods(options.routes, Number(amount)) : [];
  const methodsKey = methods.join(",");
  const valid = validFundingAmount(Number(amount)) && /^[A-Z]{2}$/.test(countryCode) && methods.includes(method);

  useEffect(() => {
    const detected = browserOnrampRegion([...(navigator.languages || [navigator.language])], Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (ONRAMP_COUNTRIES.some(([country]) => country === detected)) setCountryCode(detected);
  }, []);

  useEffect(() => {
    setMethod("");
    if (!countryCode) { setOptions(EMPTY_OPTIONS); return undefined; }
    const controller = new AbortController();
    setOptions({ ...EMPTY_OPTIONS, status: "loading", country: countryCode });
    readPersonalFundingOptions(countryCode, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setOptions({ ...data, status: "ready" });
    }).catch(() => { if (!controller.signal.aborted) setOptions({ ...EMPTY_OPTIONS, status: "error", country: countryCode }); });
    return () => controller.abort();
  }, [countryCode, revision]);

  useEffect(() => { setMethod(methodsKey.split(",").includes("CREDIT_DEBIT_CARD") ? "CREDIT_DEBIT_CARD" : methodsKey.split(",")[0] || ""); }, [methodsKey, countryCode, amount]);

  async function submit(event) {
    event.preventDefault();
    if (disabled || busy || submitting.current || !valid) return;
    submitting.current = true;
    try { await onContinue({ requestId: fundingRequestId(), amount: Number(amount), countryCode, paymentMethodType: method }); }
    finally { submitting.current = false; }
  }

  return <form className="mb-onramp-simple" onSubmit={event => void submit(event).catch(() => {})} aria-label={t("walletPage.personalWalletLabel")}>
    <div className="mb-onramp-simple-main">
      <AssetLabel provider="Reown" />
      <FundingAmountField id={id} amount={amount} onChange={setAmount} busy={busy} />
      <FundingCountryField id={id} value={countryCode} onChange={setCountryCode} busy={busy} />
      <FundingMethodField id={id} value={methods.includes(method) ? method : ""} methods={methods} status={current ? options.status : "loading"}
        countrySelected={Boolean(countryCode)} minimumUsd={current ? lowestRouteMinimum(options.routes) : null} onChange={setMethod} onRetry={() => setRevision(value => value + 1)} busy={busy} />
      <FundingSubmit disabled={disabled || !valid} busy={busy} />
    </div>
  </form>;
}

/** Both approved providers are discovered only within this administrative sandbox account. */
export function AdministrativeSandboxFundingForm({ disabled = false, busy = false, onContinue, onSelectionChange = undefined }) {
  const { t } = useI18n();
  const id = useId();
  const [amount, setAmount] = useState("50");
  const [countryCode, setCountryCode] = useState("US");
  const [preferredProvider, setPreferredProvider] = useState("TRANSAK");
  const [method, setMethod] = useState("");
  const [options, setOptions] = useState({ status: "idle", country: "", providers: [] });
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);
  const current = options.country === countryCode;
  const eligibleProviders = current && options.status === "ready" ? options.providers
    .filter(provider => eligiblePaymentMethods(provider.routes, Number(amount)).length > 0).map(provider => provider.serviceProvider) : [];
  const serviceProvider = eligibleProviders.includes(preferredProvider) ? preferredProvider : eligibleProviders[0] || "";
  const selectedOptions = options.providers.find(provider => provider.serviceProvider === serviceProvider);
  const methods = current && selectedOptions ? eligiblePaymentMethods(selectedOptions.routes, Number(amount)) : [];
  const methodsKey = methods.join(",");
  const valid = validFundingAmount(Number(amount)) && methods.includes(method);

  function changeSelection(update, value) {
    update(value);
    onSelectionChange?.();
  }

  useEffect(() => {
    const controller = new AbortController();
    setMethod("");
    setOptions({ status: "loading", country: countryCode, providers: [] });
    Promise.all(["TRANSAK", "BANXA"].map(provider => readAdministrativeSandboxOptions(countryCode, provider, { signal: controller.signal }))).then(providers => {
      if (!controller.signal.aborted) setOptions({ status: "ready", country: countryCode, providers });
    }).catch(() => {
      if (!controller.signal.aborted) { setOptions({ status: "error", country: countryCode, providers: [] }); controller.abort(); }
    });
    return () => controller.abort();
  }, [countryCode, revision]);

  useEffect(() => { if (current && options.status === "ready" && serviceProvider) setPreferredProvider(serviceProvider); }, [current, options.status, serviceProvider]);

  useEffect(() => { setMethod(methodsKey.split(",").includes("CREDIT_DEBIT_CARD") ? "CREDIT_DEBIT_CARD" : methodsKey.split(",")[0] || ""); }, [methodsKey, countryCode, serviceProvider, amount]);

  async function submit(event) {
    event.preventDefault();
    if (disabled || busy || submitting.current || !valid) return;
    submitting.current = true;
    try { await onContinue({ requestId: fundingRequestId(), amount: Number(amount), countryCode, serviceProvider, paymentMethodType: method }); }
    finally { submitting.current = false; }
  }

  return <form className="mb-onramp-simple" onSubmit={event => void submit(event).catch(() => {})} aria-label={t("walletPage.administrativeWalletLabel")}>
    <div className="mb-onramp-simple-main">
      <AssetLabel provider={t("funding.sandbox")} />
      <FundingAmountField id={id} amount={amount} onChange={value => changeSelection(setAmount, value)} busy={busy} />
      <FundingCountryField id={id} value={countryCode} onChange={value => changeSelection(setCountryCode, value)} busy={busy} label={t("funding.testCountry")} />
      {eligibleProviders.length > 1 ? <label className="mb-onramp-country-picker" htmlFor={`${id}-provider`}><span>{t("funding.provider")}</span>
        <select id={`${id}-provider`} value={serviceProvider} onChange={event => changeSelection(setPreferredProvider, event.target.value)} disabled={busy}>
          {eligibleProviders.map(provider => <option key={provider} value={provider}>{provider === "TRANSAK" ? "Transak" : "Banxa"}</option>)}
        </select></label> : serviceProvider ? <p className="mb-onramp-disclosure">{t("onramp.processedBy")} {serviceProvider === "TRANSAK" ? "Transak" : "Banxa"}</p> : null}
      <FundingMethodField id={id} value={methods.includes(method) ? method : ""} methods={methods} status={current ? options.status : "loading"}
        countrySelected={Boolean(countryCode)} minimumUsd={current ? lowestRouteMinimum(selectedOptions?.routes || options.providers.flatMap(provider => provider.routes)) : null} onChange={value => changeSelection(setMethod, value)} onRetry={() => setRevision(value => value + 1)} busy={busy} />
      <FundingSubmit disabled={disabled || !valid} busy={busy} />
    </div>
  </form>;
}

function AssetLabel({ provider }) {
  return <div className="mb-onramp-asset-row"><span className="mb-onramp-asset-chip"><ShieldCheck size={16} aria-hidden="true" />USDT · Polygon</span><span className="mb-wallet-funding-status">{provider}</span></div>;
}

function FundingAmountField({ id, amount, onChange, busy }) {
  const { t, locale } = useI18n();
  return <fieldset className="mb-onramp-amount-fieldset" disabled={busy}>
    <legend>{t("onramp.amountLabel")}</legend>
    <div className="mb-onramp-quick-amounts">{[50, 100, 250, 500].map(value => <button type="button" key={value}
      className={Number(amount) === value ? "active" : ""} aria-pressed={Number(amount) === value} onClick={() => onChange(String(value))}>
      {new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)}</button>)}</div>
    <label className="mb-onramp-amount-input" htmlFor={`${id}-amount`}><span>USD</span><input id={`${id}-amount`} type="number" min="50" max="25000" step="0.01" inputMode="decimal"
      value={amount} onChange={event => onChange(event.target.value)} aria-describedby={`${id}-amount-hint`} required /></label>
    <small id={`${id}-amount-hint`} className="mb-onramp-disclosure">{t("funding.amountRange")}</small>
  </fieldset>;
}

function FundingCountryField({ id, value, onChange, busy, label = "" }) {
  const { t, locale } = useI18n();
  function countryName(code) { try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code; } catch { return code; } }
  return <label className="mb-onramp-country-picker" htmlFor={`${id}-country`}><span>{label || t("onramp.countryLabel")}</span>
    <select id={`${id}-country`} value={value} onChange={event => onChange(event.target.value)} disabled={busy} required>
      <option value="">{t("funding.countryPrompt")}</option>{ONRAMP_COUNTRIES.map(([code]) => <option value={code} key={code}>{countryName(code)}</option>)}
    </select></label>;
}

function FundingMethodField({ id, value, methods, status, countrySelected, minimumUsd, onChange, onRetry, busy }) {
  const { t, locale } = useI18n();
  const ready = countrySelected && status === "ready";
  const unavailable = countrySelected && (status === "error" || (ready && !methods.length));
  return <div className="mb-onramp-country-picker"><label htmlFor={`${id}-method`}>{t("onramp.paymentMethodLabel")}</label>
    <select id={`${id}-method`} value={value} onChange={event => onChange(event.target.value)} disabled={busy || !ready || !methods.length} required aria-describedby={`${id}-methods-state`}>
      {!value ? <option value="">{t(!countrySelected ? "funding.countryPrompt" : status === "loading" ? "walletPage.checkingAvailability" : "walletPage.noPaymentMethods")}</option> : null}
      {methods.map(method => <option value={method} key={method}>{paymentMethodLabel(method, t)}</option>)}
    </select>
    <div id={`${id}-methods-state`} role="status" className="mb-onramp-disclosure">
      {unavailable ? <><p>{t(status === "error" ? "funding.methodsLoadFailed" : "funding.methodsForAmountUnavailable")}</p><button className="executive-button" type="button" onClick={onRetry} disabled={busy}><RefreshCw size={14} aria-hidden="true" />{t("walletPage.retry")}</button></>
        : countrySelected ? t(status === "loading" ? "walletPage.checkingAvailability" : "funding.methodsVerified") : t("funding.chooseCountryFirst")}
      {ready && minimumUsd !== null ? <p>{t("funding.providerMinimum", { amount: new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(minimumUsd) })}</p> : null}
    </div>
  </div>;
}

function FundingSubmit({ disabled, busy }) {
  const { t } = useI18n();
  return <button className="executive-button primary mb-onramp-primary" type="submit" disabled={disabled || busy}>
    {busy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}{t(busy ? "recharge.connecting" : "walletPage.addFundsAction")}
  </button>;
}

export function paymentMethodLabel(code, t) {
  const brands = { ASTROPAY: "AstroPay", NETELLER: "Neteller", PAYSAFECARD: "PaysafeCard", SKRILL: "Skrill" };
  if (Object.hasOwn(brands, code)) return brands[code];
  if (["CREDIT_DEBIT_CARD", "CARD", "VISA", "MASTERCARD"].includes(code)) return t("onramp.cardPayment");
  if (code === "APPLE_PAY") return "Apple Pay";
  if (code === "GOOGLE_PAY") return "Google Pay";
  if (["BANK_TRANSFER", "SEPA", "ACH"].includes(code)) return t("onramp.bankTransfer");
  return code.replaceAll("_", " ");
}
