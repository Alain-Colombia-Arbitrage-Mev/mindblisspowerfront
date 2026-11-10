"use client";

import { CheckCircle2, CreditCard, Landmark, Loader2, MapPin, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/i18n/LanguageProvider";
import { browserOnrampRegion } from "@/lib/meld-onramp.mjs";
import { createOnrampQuote, ONRAMP_COUNTRIES, ONRAMP_CRYPTO, readOnrampAvailability } from "@/lib/meld-onramp-client.mjs";
import { MINDBLISS_ONRAMP_FEE_PERCENT, PERSONAL_WALLET_ASSET, PERSONAL_WALLET_MINIMUM_USD,
  PERSONAL_WALLET_NETWORK } from "@/lib/personal-wallet.mjs";

const QUICK_AMOUNTS = Object.freeze([50, 100, 250, 500]);

export default function StablecoinOnrampForm({ walletAddress = "", disabled = false, busy = false, onContinue }) {
  const { locale, t } = useI18n();
  const onramp = useStablecoinOnramp(walletAddress);
  const [editingRegion, setEditingRegion] = useState(false);
  const countryName = useMemo(() => localizedCountry(onramp.country, locale), [locale, onramp.country]);
  const invalidAmount = !Number.isFinite(Number(onramp.amount)) || Number(onramp.amount) < onramp.minimum
    || Number(onramp.amount) > onramp.maximum;
  const validating = onramp.availabilityStatus === "loading" || onramp.quoteStatus === "loading";

  async function primaryAction() {
    if (disabled || !walletAddress) return;
    if (!onramp.selectedQuote) {
      await onramp.requestQuote();
      return;
    }
    await onContinue(onramp.checkoutInput());
  }

  return (
    <div className={`mb-onramp-simple ${onramp.selectedQuote ? "has-quote" : ""}`}>
      <div className="mb-onramp-simple-main">
        <div className="mb-onramp-asset-row">
          <span className="mb-onramp-asset-chip"><ShieldCheck size={16} aria-hidden="true" />
            {PERSONAL_WALLET_ASSET} · {PERSONAL_WALLET_NETWORK}</span>
          <span className="mb-onramp-region"><MapPin size={14} aria-hidden="true" /> {countryName} · USD
            <button type="button" onClick={() => setEditingRegion(value => !value)}>{t("onramp.changeRegion")}</button>
          </span>
        </div>

        {editingRegion ? (
          <label className="mb-onramp-country-picker">
            <span>{t("onramp.countryLabel")}</span>
            <select value={onramp.country} onChange={event => { onramp.setCountry(event.target.value); setEditingRegion(false); }}>
              {ONRAMP_COUNTRIES.map(([code]) => <option value={code} key={code}>{localizedCountry(code, locale)}</option>)}
            </select>
          </label>
        ) : null}

        <fieldset className="mb-onramp-amount-fieldset">
          <legend>{t("onramp.amountLabel")}</legend>
          <div className="mb-onramp-quick-amounts">
            {QUICK_AMOUNTS.map(value => (
              <button type="button" key={value} className={Number(onramp.amount) === value ? "active" : ""}
                onClick={() => onramp.setAmount(String(value))}>${value}</button>
            ))}
          </div>
          <label className="mb-onramp-amount-input">
            <span>USD</span>
            <input type="number" min={onramp.minimum} max={onramp.maximum} step="10" value={onramp.amount}
              onChange={event => onramp.setAmount(event.target.value)} inputMode="decimal" aria-invalid={invalidAmount} />
          </label>
          <small>{t("onramp.routeMinimum", { amount: onramp.minimum })} · {t("onramp.mindblissFee", { percent: MINDBLISS_ONRAMP_FEE_PERCENT })}</small>
        </fieldset>

        {onramp.verifiedQuotes.length ? (
          <fieldset className="mb-onramp-methods">
            <legend>{t("onramp.paymentMethodLabel")}</legend>
            <div>
              {onramp.verifiedQuotes.map(quote => {
                const Icon = paymentMethodIcon(quote.paymentMethodType);
                const selected = onramp.selectedQuote?.paymentMethodType === quote.paymentMethodType;
                return <button type="button" key={quote.paymentMethodType} className={selected ? "active" : ""}
                  onClick={() => onramp.selectQuote(quote.paymentMethodType)} aria-pressed={selected}>
                  <Icon size={17} aria-hidden="true" /><span>{paymentMethodLabel(quote.paymentMethodType, t)}</span>
                  {selected ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
                </button>;
              })}
            </div>
          </fieldset>
        ) : null}

        {disabled ? <p className="mb-onramp-message warning" role="status">{t("walletPage.destinationUnavailable")}</p>
          : <OnrampState state={onramp} t={t} />}

        <button className="executive-button primary mb-onramp-primary" type="button" onClick={() => void primaryAction().catch(() => {})}
          disabled={disabled || busy || validating || invalidAmount || onramp.availabilityStatus !== "ready"}>
          {busy || validating ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
          {busy ? t("recharge.connecting") : onramp.quoteStatus === "loading" ? t("walletPage.loadingQuote")
            : onramp.selectedQuote ? t("onramp.continueWithProvider", { provider: onramp.selectedQuote.serviceProvider })
              : t("onramp.requestQuote")}
        </button>
        <p className="mb-onramp-disclosure">{t("onramp.feeDisclosure")}</p>
      </div>

      {onramp.selectedQuote ? <VerifiedQuote quote={onramp.selectedQuote} t={t} /> : null}
    </div>
  );
}

function useStablecoinOnramp(walletAddress) {
  const defaultCountry = typeof navigator === "undefined" ? "CO" : browserOnrampRegion(
    [...(navigator.languages || [navigator.language || "es-CO"])], Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ) || "CO";
  const [country, setCountryState] = useState(defaultCountry);
  const [amount, setAmountState] = useState(String(PERSONAL_WALLET_MINIMUM_USD));
  const [availabilityStatus, setAvailabilityStatus] = useState("loading");
  const [methods, setMethods] = useState([]);
  const [quoteStatus, setQuoteStatus] = useState("idle");
  const [quoteResult, setQuoteResult] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setAvailabilityStatus("loading");
    setMethods([]);
    setQuoteResult(null);
    setQuoteStatus("idle");
    setSelectedMethod("");
    readOnrampAvailability(country, { signal: controller.signal }).then(result => {
      const next = result.available ? result.paymentMethods : [];
      setMethods(next);
      setAvailabilityStatus(next.length ? "ready" : "unavailable");
      const minimum = routeMinimum(next);
      setAmountState(current => Number(current) < minimum ? String(minimum) : current);
    }).catch(error => { if (error?.name !== "AbortError") setAvailabilityStatus("error"); });
    return () => controller.abort();
  }, [country]);

  const resetQuote = () => { setQuoteResult(null); setQuoteStatus("idle"); setSelectedMethod(""); };
  const setCountry = value => setCountryState(value);
  const setAmount = value => { setAmountState(value); resetQuote(); };
  const requestQuote = async () => {
    setQuoteStatus("loading");
    try {
      const result = await createOnrampQuote({ country, fiat: "USD", crypto: ONRAMP_CRYPTO, amount: Number(amount),
        ...(walletAddress ? { walletAddress } : {}) });
      setQuoteResult(result);
      setSelectedMethod(result.available ? result.quote.paymentMethodType : "");
      setQuoteStatus(result.available ? "ready" : "unavailable");
      return result;
    } catch (error) {
      setQuoteResult(null);
      setSelectedMethod("");
      setQuoteStatus("error");
      throw error;
    }
  };
  const verifiedQuotes = quoteResult?.available ? quoteResult.quotes : [];
  const selectedQuote = verifiedQuotes.find(item => item.paymentMethodType === selectedMethod)
    || (quoteResult?.available ? quoteResult.quote : null);
  const minimum = routeMinimum(methods);
  const maximum = routeMaximum(methods);
  const checkoutInput = () => ({ amount: Number(amount), countryCode: country,
    paymentMethodType: selectedQuote?.paymentMethodType || "", serviceProvider: selectedQuote?.serviceProvider || "" });
  return { country, setCountry, amount, setAmount, availabilityStatus, quoteStatus, verifiedQuotes, selectedQuote,
    selectQuote: setSelectedMethod, requestQuote, checkoutInput, minimum, maximum };
}

function OnrampState({ state, t }) {
  if (state.availabilityStatus === "loading") return <p className="mb-onramp-message" role="status"><Loader2 className="animate-spin" size={14} /> {t("onramp.checkingAvailability")}</p>;
  if (state.availabilityStatus === "unavailable" || state.quoteStatus === "unavailable") {
    return <p className="mb-onramp-message warning" role="status">{t("onramp.noVerifiedOption")}</p>;
  }
  if (state.availabilityStatus === "error" || state.quoteStatus === "error") {
    return <p className="mb-onramp-message warning" role="status">{t("onramp.noVerifiedOption")}</p>;
  }
  return null;
}

function VerifiedQuote({ quote, t }) {
  return <aside className="mb-onramp-verified" aria-label={t("onramp.bestOption")}>
    <div><span>{t("onramp.bestOption")}</span><CheckCircle2 size={17} aria-hidden="true" /></div>
    <p>{t("onramp.youReceive")}</p>
    <strong>{quote.destinationAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} <small>{PERSONAL_WALLET_ASSET}</small></strong>
    <dl>
      <div><dt>{t("onramp.totalFees")}</dt><dd>${quote.totalFee.toFixed(2)} USD</dd></div>
      <div><dt>{t("onramp.paymentMethodLabel")}</dt><dd>{paymentMethodLabel(quote.paymentMethodType, t)}</dd></div>
      <div><dt>{t("onramp.processedBy")}</dt><dd>{quote.serviceProvider}</dd></div>
    </dl>
  </aside>;
}

function routeMinimum(methods) {
  const values = methods.map(method => method.minimum).filter(value => typeof value === "number" && Number.isFinite(value));
  return Math.max(PERSONAL_WALLET_MINIMUM_USD, values.length ? Math.min(...values) : PERSONAL_WALLET_MINIMUM_USD);
}

function routeMaximum(methods) {
  const values = methods.map(method => method.maximum).filter(value => typeof value === "number" && Number.isFinite(value));
  return Math.min(25_000, values.length ? Math.max(...values) : 25_000);
}

function localizedCountry(code, locale) {
  try { return new Intl.DisplayNames([locale || "es"], { type: "region" }).of(code) || code; }
  catch { return ONRAMP_COUNTRIES.find(([value]) => value === code)?.[1] || code; }
}

function paymentMethodIcon(code) {
  if (code === "BANK_TRANSFER" || code === "ACH" || code === "SEPA") return Landmark;
  if (code === "APPLE_PAY" || code === "GOOGLE_PAY") return Smartphone;
  return CreditCard;
}

function paymentMethodLabel(code, t) {
  const labels = { CREDIT_DEBIT_CARD: "onramp.cardPayment", CARD: "onramp.cardPayment", VISA: "onramp.cardPayment",
    MASTERCARD: "onramp.cardPayment", APPLE_PAY: "Apple Pay", GOOGLE_PAY: "Google Pay",
    BANK_TRANSFER: "onramp.bankTransfer", ACH: "ACH", SEPA: "SEPA" };
  const label = labels[code];
  return label?.startsWith("onramp.") ? t(label) : label || code.replaceAll("_", " ");
}
