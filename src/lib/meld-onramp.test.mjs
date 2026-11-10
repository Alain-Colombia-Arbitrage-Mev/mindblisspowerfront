import assert from "node:assert/strict";
import test from "node:test";

import { browserOnrampRegion, buildMeldOnrampUrl } from "./meld-onramp.mjs";

const address = "0x1111111111111111111111111111111111111111";
const projectId = "a".repeat(32);
const providerUrl = "https://meldcrypto.com/?publicKey=public-reown-key&destinationCurrencyCode=USDC";

test("Meld checkout is bound to USDT, the $50 package floor, region and approved providers", () => {
  const url = new URL(buildMeldOnrampUrl({ providerUrl, address, projectId, countryCode: "CO", locale: "es-CO" }));
  assert.equal(url.origin, "https://meldcrypto.com");
  assert.equal(url.searchParams.get("destinationCurrencyCode"), "USDT");
  assert.equal(url.searchParams.get("sourceCurrencyCode"), "USD");
  assert.equal(url.searchParams.get("sourceAmount"), "50");
  assert.equal(url.searchParams.get("countryCode"), "CO");
  assert.equal(url.searchParams.get("walletAddress"), address);
  assert.equal(url.searchParams.get("externalCustomerId"), projectId);
  assert.equal(url.searchParams.get("serviceProviders"), "TOPPER,SWAPPED");
});

test("Meld URL rejects foreign origins and invalid wallet context", () => {
  for (const invalid of ["https://meldcrypto.com.evil.test", "http://meldcrypto.com", "https://user@meldcrypto.com"]) {
    assert.throws(() => buildMeldOnrampUrl({ providerUrl: invalid, address, projectId }), /meld_provider_invalid/);
  }
  assert.throws(() => buildMeldOnrampUrl({ providerUrl, address: "invalid", projectId }), /meld_context_invalid/);
});

test("country detection uses explicit locale regions and a bounded timezone fallback", () => {
  assert.equal(browserOnrampRegion(["es-CO", "es"], "America/Bogota"), "CO");
  assert.equal(browserOnrampRegion(["en-US-u-ca-gregory"], "America/Bogota"), "US");
  assert.equal(browserOnrampRegion(["es-419"], "America/Bogota"), "CO");
  assert.equal(browserOnrampRegion(["es"], "Unknown/Zone"), "");
});
