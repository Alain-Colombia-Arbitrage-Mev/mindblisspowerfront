import {
  PERSONAL_WALLET_MELD_ASSET,
  PERSONAL_WALLET_MINIMUM_USD,
} from "./personal-wallet.mjs";
import {
  ADMINISTRATIVE_WALLET_MELD_ASSET,
  ADMINISTRATIVE_WALLET_MINIMUM_USD,
} from "./administrative-wallet.mjs";

const ADDRESS = /^0x[0-9a-f]{40}$/i;
const PROJECT_ID = /^[0-9a-f]{32}$/i;
const COUNTRY = /^[A-Z]{2}$/;
const LOCALE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const CUSTOMER_REFERENCE = /^[A-Za-z0-9_-]{8,128}$/;
const PAYMENT_METHOD = /^[A-Z0-9_]{2,40}$/;
const PROVIDER = /^[A-Z0-9_]{2,40}$/;
const BLOCKED_PROVIDERS = new Set(["BINANCECONNECT", "BINANCEPAY"]);

/** Build only the trusted Meld checkout URL obtained from Reown's controller. */
export function buildMeldOnrampUrl({ providerUrl, address, projectId, checkoutReference, countryCode = "", locale = "",
  amount = PERSONAL_WALLET_MINIMUM_USD, paymentMethodType = "", serviceProvider = "" }) {
  if (!ADDRESS.test(address || "") || !PROJECT_ID.test(projectId || "") || !CUSTOMER_REFERENCE.test(checkoutReference || "")) throw new Error("meld_context_invalid");
  return buildOnrampUrl({ providerUrl, address, externalCustomerId: checkoutReference, countryCode, locale,
    asset: PERSONAL_WALLET_MELD_ASSET, amount, paymentMethodType, serviceProvider,
    minimumUsd: PERSONAL_WALLET_MINIMUM_USD });
}

export function buildAdministrativeMeldOnrampUrl({ providerUrl, address, checkoutReference, countryCode = "", locale = "",
  amount = ADMINISTRATIVE_WALLET_MINIMUM_USD, paymentMethodType = "", serviceProvider = "" }) {
  if (!ADDRESS.test(address || "") || !CUSTOMER_REFERENCE.test(checkoutReference || "")) throw new Error("meld_context_invalid");
  return buildOnrampUrl({ providerUrl, address, externalCustomerId: checkoutReference, countryCode, locale,
    asset: ADMINISTRATIVE_WALLET_MELD_ASSET, amount, paymentMethodType, serviceProvider,
    minimumUsd: ADMINISTRATIVE_WALLET_MINIMUM_USD });
}

function buildOnrampUrl({ providerUrl, address, externalCustomerId, countryCode, locale, asset, amount,
  paymentMethodType, serviceProvider, minimumUsd }) {
  const url = new URL(providerUrl || "");
  if (url.protocol !== "https:" || url.hostname !== "meldcrypto.com" || url.username || url.password || url.hash) {
    throw new Error("meld_provider_invalid");
  }
  if (!url.searchParams.get("publicKey")) throw new Error("meld_provider_invalid");

  url.searchParams.set("destinationCurrencyCode", asset);
  url.searchParams.set("sourceCurrencyCode", "USD");
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < minimumUsd || normalizedAmount > 25_000) throw new Error("meld_context_invalid");
  if (paymentMethodType && !PAYMENT_METHOD.test(paymentMethodType)) throw new Error("meld_context_invalid");
  if (!PROVIDER.test(serviceProvider || "") || BLOCKED_PROVIDERS.has(serviceProvider)) throw new Error("meld_context_invalid");
  url.searchParams.set("sourceAmount", String(normalizedAmount));
  url.searchParams.set("walletAddress", address);
  if (externalCustomerId) url.searchParams.set("externalCustomerId", externalCustomerId);
  if (externalCustomerId) url.searchParams.set("externalSessionId", externalCustomerId);
  url.searchParams.set("serviceProviders", serviceProvider);
  if (paymentMethodType) url.searchParams.set("paymentMethodType", paymentMethodType);
  if (COUNTRY.test(countryCode)) url.searchParams.set("countryCode", countryCode);
  if (LOCALE.test(locale)) url.searchParams.set("locale", locale);
  return url.toString();
}

/**
 * Prefer an explicit browser locale region. A small timezone fallback covers
 * locales such as es-419 without pretending a country when it is unknown.
 */
export function browserOnrampRegion(languages = [], timeZone = "") {
  for (const language of languages) {
    try {
      const region = new Intl.Locale(String(language).replace("_", "-")).region || "";
      if (COUNTRY.test(region)) return region;
    } catch { /* try the next browser locale */ }
  }
  return TIMEZONE_COUNTRIES[timeZone] || "";
}

const TIMEZONE_COUNTRIES = Object.freeze({
  "America/Bogota": "CO", "America/Mexico_City": "MX", "America/Lima": "PE",
  "America/Santiago": "CL", "America/Argentina/Buenos_Aires": "AR", "America/Sao_Paulo": "BR",
  "America/Caracas": "VE", "America/Guayaquil": "EC", "America/Panama": "PA",
  "America/Santo_Domingo": "DO", "America/Guatemala": "GT", "America/Tegucigalpa": "HN",
  "America/El_Salvador": "SV", "America/Managua": "NI", "America/Costa_Rica": "CR",
  "America/Montevideo": "UY", "America/Asuncion": "PY", "America/La_Paz": "BO",
});
