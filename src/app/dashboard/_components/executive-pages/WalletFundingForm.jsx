"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { browserOnrampRegion } from "@/lib/meld-onramp.mjs";
import { ONRAMP_COUNTRIES } from "@/lib/meld-onramp-client.mjs";
import { fundingRequestId, readAdministrativeSandboxOptions } from "@/lib/wallet-funding-client.mjs";
import { validFundingAmount } from "@/lib/wallet-funding-contract.mjs";

export function PersonalFundingForm(props) {
  return <FundingRequestFields {...props} sandbox={false} />;
}

export function AdministrativeSandboxFundingForm(props) {
  return <FundingRequestFields {...props} sandbox />;
}

function FundingRequestFields({ sandbox, disabled = false, busy = false, onContinue }) {
  const { t, locale } = useI18n();
  const id = useId();
  const [amount, setAmount] = useState("50");
  const [countryCode, setCountryCode] = useState(sandbox ? "US" : "");
  const [serviceProvider, setServiceProvider] = useState("TRANSAK");
  const [method, setMethod] = useState("");
  const [options, setOptions] = useState({ status: "loading", paymentMethods: [], country: "", serviceProvider: "" });
  const [optionsRevision, setOptionsRevision] = useState(0);
  const submitting = useRef(false);
  const currentOptions = options.country === countryCode && options.serviceProvider === serviceProvider;
  const valid = validFundingAmount(Number(amount)) && /^[A-Z]{2}$/.test(countryCode)
    && (!sandbox || (currentOptions && options.status === "ready" && options.paymentMethods.includes(method)));

  useEffect(() => {
    if (sandbox) return;
    const detected = browserOnrampRegion([...(navigator.languages || [navigator.language])], Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (ONRAMP_COUNTRIES.some(([country]) => country === detected)) setCountryCode(detected);
  }, [sandbox]);

  useEffect(() => {
    if (!sandbox) return undefined;
    const controller = new AbortController();
    setOptions({ status: "loading", paymentMethods: [], country: countryCode, serviceProvider });
    setMethod("");
    readAdministrativeSandboxOptions(countryCode, serviceProvider, { signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return;
      setOptions({ status: "ready", paymentMethods: data.paymentMethods, country: countryCode, serviceProvider });
      setMethod(data.paymentMethods.includes("CREDIT_DEBIT_CARD") ? "CREDIT_DEBIT_CARD" : data.paymentMethods[0] || "");
    }).catch(() => { if (!controller.signal.aborted) setOptions({ status: "error", paymentMethods: [], country: countryCode, serviceProvider }); });
    return () => controller.abort();
  }, [sandbox, countryCode, serviceProvider, optionsRevision]);

  async function submit(event) {
    event.preventDefault();
    if (disabled || busy || submitting.current || !valid) return;
    submitting.current = true;
    try {
      await onContinue({ requestId: fundingRequestId(), amount: Number(amount), countryCode,
        ...(sandbox ? { serviceProvider, paymentMethodType: method } : {}) });
    } finally { submitting.current = false; }
  }

  function countryName(code) {
    try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code; }
    catch { return code; }
  }

  return <form className="mb-onramp-simple" onSubmit={event => void submit(event).catch(() => {})}>
    <div className="mb-onramp-simple-main">
      <div className="mb-onramp-asset-row"><span className="mb-onramp-asset-chip"><ShieldCheck size={16} aria-hidden="true" />USDT · Polygon</span>
        <span className="mb-wallet-funding-status">{sandbox ? t("funding.sandbox") : "Reown"}</span></div>
      <fieldset className="mb-onramp-amount-fieldset" disabled={disabled || busy}>
        <legend>{t("onramp.amountLabel")}</legend>
        <div className="mb-onramp-quick-amounts">{[50, 100, 250, 500].map(value => <button type="button" key={value}
          className={Number(amount) === value ? "active" : ""} onClick={() => setAmount(String(value))}>${value}</button>)}</div>
        <label className="mb-onramp-amount-input" htmlFor={`${id}-amount`}><span>USD</span><input id={`${id}-amount`} type="number"
          min="50" max="25000" step="0.01" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} required /></label>
      </fieldset>
      <label className="mb-onramp-country-picker" htmlFor={`${id}-country`}><span>{sandbox ? t("funding.testCountry") : t("onramp.countryLabel")}</span>
        <select id={`${id}-country`} value={countryCode} onChange={event => setCountryCode(event.target.value)} disabled={disabled || busy} required>
          <option value="">{t("funding.countryPrompt")}</option>
          {ONRAMP_COUNTRIES.map(([code]) => <option value={code} key={code}>{countryName(code)}</option>)}
        </select>
      </label>
      {sandbox ? <label className="mb-onramp-country-picker" htmlFor={`${id}-provider`}><span>{t("funding.provider")}</span>
        <select id={`${id}-provider`} value={serviceProvider} onChange={event => setServiceProvider(event.target.value)} disabled={disabled || busy}>
          <option value="TRANSAK">Transak</option><option value="BANXA">Banxa</option>
        </select>
      </label> : null}
      {sandbox ? <label className="mb-onramp-country-picker" htmlFor={`${id}-method`}><span>{t("onramp.paymentMethodLabel")}</span>
        <select id={`${id}-method`} value={currentOptions ? method : ""} onChange={event => setMethod(event.target.value)} disabled={disabled || busy || !currentOptions || options.status !== "ready" || !options.paymentMethods.length} required>
          {!method ? <option value="">{options.status === "loading" ? t("walletPage.checkingAvailability") : t("walletPage.noPaymentMethods")}</option> : null}
          {(currentOptions ? options.paymentMethods : []).map(value => <option key={value} value={value}>{paymentMethodLabel(value, t)}</option>)}
        </select>
        {options.status === "error" || (options.status === "ready" && !options.paymentMethods.length) ? <span role="status">
          <small>{t("funding.methodsUnavailable")}</small><button className="executive-button" type="button" onClick={() => setOptionsRevision(value => value + 1)}>{t("walletPage.retry")}</button>
        </span> : null}
      </label> : null}
      <p className="mb-onramp-disclosure">{sandbox ? t("funding.sandboxFormCopy") : t("funding.personalFormCopy")}</p>
      <button className="executive-button primary mb-onramp-primary" type="submit" disabled={disabled || busy || !valid}>
        {busy ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
        {busy ? t("recharge.connecting") : t("walletPage.addFundsAction")}
      </button>
    </div>
  </form>;
}

function paymentMethodLabel(code, t) {
  if (["CREDIT_DEBIT_CARD", "CARD", "VISA", "MASTERCARD"].includes(code)) return t("onramp.cardPayment");
  if (code === "APPLE_PAY") return "Apple Pay";
  if (code === "GOOGLE_PAY") return "Google Pay";
  if (["BANK_TRANSFER", "SEPA", "ACH"].includes(code)) return t("onramp.bankTransfer");
  return code.replaceAll("_", " ");
}
