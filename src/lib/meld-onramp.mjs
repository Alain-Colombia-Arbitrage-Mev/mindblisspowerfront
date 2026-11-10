import {
  PERSONAL_WALLET_ASSET,
  PERSONAL_WALLET_MINIMUM_USD,
  PERSONAL_WALLET_PROVIDERS,
} from "./personal-wallet.mjs";

const ADDRESS = /^0x[0-9a-f]{40}$/i;
const PROJECT_ID = /^[0-9a-f]{32}$/i;
const COUNTRY = /^[A-Z]{2}$/;
const LOCALE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

/** Build only the trusted Meld checkout URL obtained from Reown's controller. */
export function buildMeldOnrampUrl({ providerUrl, address, projectId, countryCode = "", locale = "" }) {
  if (!ADDRESS.test(address || "") || !PROJECT_ID.test(projectId || "")) throw new Error("meld_context_invalid");
  const url = new URL(providerUrl || "");
  if (url.protocol !== "https:" || url.hostname !== "meldcrypto.com" || url.username || url.password || url.hash) {
    throw new Error("meld_provider_invalid");
  }
  if (!url.searchParams.get("publicKey")) throw new Error("meld_provider_invalid");

  url.searchParams.set("destinationCurrencyCode", PERSONAL_WALLET_ASSET);
  url.searchParams.set("sourceCurrencyCode", "USD");
  url.searchParams.set("sourceAmount", String(PERSONAL_WALLET_MINIMUM_USD));
  url.searchParams.set("walletAddress", address);
  url.searchParams.set("externalCustomerId", projectId);
  url.searchParams.set("serviceProviders", PERSONAL_WALLET_PROVIDERS.join(","));
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
