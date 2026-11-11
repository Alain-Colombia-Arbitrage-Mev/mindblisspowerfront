import {
  PERSONAL_WALLET_MELD_ASSET,
  PERSONAL_WALLET_MINIMUM_USD,
  PERSONAL_WALLET_MAXIMUM_USD,
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
const ALLOWED_PROVIDERS = new Set(["TOPPER", "SWAPPED"]);

/** Build only the trusted Meld checkout URL obtained from Reown's controller. */
export function buildMeldOnrampUrl({ providerUrl, address, projectId, checkoutReference, countryCode = "", locale = "",
  amount = PERSONAL_WALLET_MINIMUM_USD, paymentMethodType = "", serviceProvider = "" }) {
  if (!ADDRESS.test(address || "") || !PROJECT_ID.test(projectId || "") || !CUSTOMER_REFERENCE.test(checkoutReference || "")) throw new Error("meld_context_invalid");
  return buildOnrampUrl({ providerUrl, address, externalCustomerId: checkoutReference, countryCode, locale,
    asset: PERSONAL_WALLET_MELD_ASSET, amount, paymentMethodType, serviceProvider,
    minimumUsd: PERSONAL_WALLET_MINIMUM_USD, maximumUsd: PERSONAL_WALLET_MAXIMUM_USD });
}

export function buildAdministrativeMeldOnrampUrl({ providerUrl, address, checkoutReference, countryCode = "", locale = "",
  amount = ADMINISTRATIVE_WALLET_MINIMUM_USD, paymentMethodType = "", serviceProvider = "" }) {
  if (!ADDRESS.test(address || "") || !CUSTOMER_REFERENCE.test(checkoutReference || "")) throw new Error("meld_context_invalid");
  return buildOnrampUrl({ providerUrl, address, externalCustomerId: checkoutReference, countryCode, locale,
    asset: ADMINISTRATIVE_WALLET_MELD_ASSET, amount, paymentMethodType, serviceProvider,
    minimumUsd: ADMINISTRATIVE_WALLET_MINIMUM_USD, maximumUsd: 25_000 });
}

function buildOnrampUrl({ providerUrl, address, externalCustomerId, countryCode, locale, asset, amount,
  paymentMethodType, serviceProvider, minimumUsd, maximumUsd }) {
  const url = new URL(providerUrl || "");
  if (url.origin !== "https://meldcrypto.com" || url.pathname !== "/" || url.username || url.password || url.hash) {
    throw new Error("meld_provider_invalid");
  }
  if (!url.searchParams.get("publicKey")) throw new Error("meld_provider_invalid");

  url.searchParams.set("destinationCurrencyCode", asset);
  url.searchParams.set("sourceCurrencyCode", "USD");
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < minimumUsd || normalizedAmount > maximumUsd) throw new Error("meld_context_invalid");
  if (paymentMethodType && !PAYMENT_METHOD.test(paymentMethodType)) throw new Error("meld_context_invalid");
  if (!PROVIDER.test(serviceProvider || "") || !ALLOWED_PROVIDERS.has(serviceProvider)) throw new Error("meld_context_invalid");
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

// Kept for existing integration helpers; the personal portal imports the neutral utility.
export { browserOnrampRegion } from './browser-onramp-region.mjs';
