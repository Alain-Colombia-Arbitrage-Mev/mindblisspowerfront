import assert from "node:assert/strict";
import test from "node:test";

import { browserOnrampRegion, buildAdministrativeMeldOnrampUrl, buildMeldOnrampUrl } from "./meld-onramp.mjs";

const address = "0x1111111111111111111111111111111111111111";
const projectId = "a".repeat(32);
const checkoutReference = "d8a4c010-cc33-44da-a297-8b3c6440f491";
const providerUrl = "https://meldcrypto.com/?publicKey=public-reown-key&destinationCurrencyCode=USDC";

test("Meld checkout is bound to Polygon USDT, the $50 floor, region and a verified provider", () => {
  const url = new URL(buildMeldOnrampUrl({ providerUrl, address, projectId, checkoutReference, countryCode: "CO", locale: "es-CO", serviceProvider: "TOPPER" }));
  assert.equal(url.origin, "https://meldcrypto.com");
  assert.equal(url.searchParams.get("destinationCurrencyCode"), "USDT_POLYGON");
  assert.equal(url.searchParams.get("sourceCurrencyCode"), "USD");
  assert.equal(url.searchParams.get("sourceAmount"), "50");
  assert.equal(url.searchParams.get("countryCode"), "CO");
  assert.equal(url.searchParams.get("walletAddress"), address);
  assert.equal(url.searchParams.get("externalCustomerId"), checkoutReference);
  assert.equal(url.searchParams.get("externalSessionId"), checkoutReference);
  assert.equal(url.searchParams.get("serviceProviders"), "TOPPER");
});

test("Meld URL rejects foreign origins and invalid wallet context", () => {
  for (const invalid of ["https://meldcrypto.com.evil.test", "http://meldcrypto.com", "https://user@meldcrypto.com"]) {
    assert.throws(() => buildMeldOnrampUrl({ providerUrl: invalid, address, projectId, checkoutReference, serviceProvider: "TOPPER" }), /meld_provider_invalid/);
  }
  assert.throws(() => buildMeldOnrampUrl({ providerUrl, address: "invalid", projectId, checkoutReference, serviceProvider: "TOPPER" }), /meld_context_invalid/);
});

test("administrative checkout uses its assigned address without a personal wallet connection", () => {
  const url = new URL(buildAdministrativeMeldOnrampUrl({ providerUrl, address, checkoutReference, countryCode: "CO", serviceProvider: "SWAPPED" }));
  assert.equal(url.searchParams.get("walletAddress"), address);
  assert.equal(url.searchParams.get("externalCustomerId"), checkoutReference);
  assert.equal(url.searchParams.get("destinationCurrencyCode"), "USDT_POLYGON");
  assert.equal(url.searchParams.get("sourceAmount"), "50");
  assert.equal(url.searchParams.get("serviceProviders"), "SWAPPED");
});

test("country detection uses explicit locale regions and a bounded timezone fallback", () => {
  assert.equal(browserOnrampRegion(["es-CO", "es"], "America/Bogota"), "CO");
  assert.equal(browserOnrampRegion(["en-US-u-ca-gregory"], "America/Bogota"), "US");
  assert.equal(browserOnrampRegion(["es-419"], "America/Bogota"), "CO");
  assert.equal(browserOnrampRegion(["es"], "Unknown/Zone"), "");
});

test("approved quote selection is preserved in the checkout handoff", () => {
  const url = new URL(buildMeldOnrampUrl({ providerUrl, address, projectId, checkoutReference, countryCode: "CO", amount: 250,
    paymentMethodType: "CREDIT_DEBIT_CARD", serviceProvider: "TOPPER" }));
  assert.equal(url.searchParams.get("sourceAmount"), "250");
  assert.equal(url.searchParams.get("paymentMethodType"), "CREDIT_DEBIT_CARD");
  assert.equal(url.searchParams.get("serviceProviders"), "TOPPER");
  assert.throws(() => buildMeldOnrampUrl({ providerUrl, address, projectId, checkoutReference, amount: 49, serviceProvider: "TOPPER" }), /meld_context_invalid/);
  assert.throws(() => buildMeldOnrampUrl({ providerUrl, address, projectId, checkoutReference }), /meld_context_invalid/);
  assert.throws(() => buildMeldOnrampUrl({ providerUrl, address, projectId, checkoutReference, serviceProvider: "BINANCECONNECT" }), /meld_context_invalid/);
  assert.throws(() => buildMeldOnrampUrl({ providerUrl, address, projectId, checkoutReference, serviceProvider: "BANXA" }), /meld_context_invalid/);
});
