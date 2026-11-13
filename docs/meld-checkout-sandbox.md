# Administrative sandbox Checkout and payout discovery

The frontend and backend implementation changes belong to their `wallet`
branches. They do not enable financial operations in `main`, the personal
Reown portal, or a production MELD merchant.

## Observed account configuration

The Fintech account in the MELD dashboard is in Sandbox. Under Developer → API
Keys, it exposes the existing active sandbox API key, but no Public Crypto
Widget Key or Generate Meld Checkout URL control. Developer → Preferences has
a checkout link to `https://sb.meldcrypto.com/` without a `publicKey` parameter.
No keys were generated, revealed, rotated or published during this inspection.

The documented generic mint endpoint is available. A validation-only request
to `POST https://api-sb.meld.io/crypto/session/widget/url` with an empty body
returned HTTP 400 `BAD_REQUEST`, with `[publicKey] publicKey cannot be blank`.
This does not create or validate an operational Checkout session.

The code therefore keeps `MELD_CHECKOUT_ENABLED=false`. To complete the live
sandbox test, MELD must supply/enable an active Public Crypto Widget Key for
this same sandbox account. Its value goes into the backend secret
`MELD_WIDGET_PUBLIC_KEY`, alongside the existing `MELD_API_SANDBOX` and
`MELD_ACCOUNT_ID`. A sandbox API secret is not a replacement for the public key.
Migration 113 must also be reviewed, tested and applied before enabling generic
Checkout. It remains unapplied while this account has no publishable widget key.

## Generic BUY flow

The browser submits only request ID, residence country, source currency and
amount. The native backend checks the session, assigned administrative address,
ownership, minimum, maximum and idempotency before recording a pending attempt.
It mints a new URL with BUY and server-side `prefill`/`locked` for residence
country, source currency, source amount, USDT Polygon and assigned destination.

The returned `https://sb.meldcrypto.com/?wt=…` bearer link is validated exactly,
served only to the requesting owner, and not logged or stored in full. The
callback uses `meldCheckoutReference`, distinct from the older provider-specific
flow. It never confirms payment. No mint, reload, callback or history read
creates wallet credits or real commission entries.

The generic mint contract does not document a provider filter. Banxa must be
selected within MELD for the Banxa test; the application does not invent a
provider parameter. Only an independently fetched, fully matched sandbox
transaction can bind a provider/session and produce a test confirmation.
The actual provider and method are recorded, rather than assuming Banxa.

The existing shared Banxa connection still rejects both quotes and direct
provider-session creation with `SERVICE_PROVIDER_AUTHENTICATION_EXCEPTION`.
An operational generic Checkout has not yet been tested and is not evidence
that Banxa's connection is repaired. Support reports remain drafts.

## Off-ramp and wallet transfers

Payout discovery uses the crypto-to-fiat route ordering:

`GET /network-partner/supported/routes/CRYPTO_OFFRAMP/{country}/USDT_POLYGON/{fiat}`

The authenticated administrative endpoint returns every eligible provider and
payout method from that account's sandbox catalog. Limits retain the currency
reported by MELD; an MXN or USD limit is never relabelled as a USDT amount.
Empty routes remain a successful empty catalog, while provider failures remain
errors. No timer creates quote requests, sell sessions or transfers.

Observed on November 12, 2026 in America/Bogota:

| Residence / payout | Catalog result for USDT Polygon |
| --- | --- |
| US / USD | Transak, PAYOUT_TO_CARD; limits 10–25,000 USD |
| MX / MXN | Transak, PAYOUT_TO_CARD; limits 187–466,480 MXN |
| MX / USD | No route |
| CO / USD | No route |
| CO / COP | No route |

These are discovery results, not completed sells or proof of bank/card payout.
Banxa did not appear in these off-ramp corridors. Recheck account discovery
before presenting a payout method; account and provider availability can change.

The user connects an external EIP-1193 wallet controlling the administrative
address assigned from the existing pool. The server verifies a single-use
ownership message against that exact address and the current Better Auth
session. Connecting a different address cannot replace the assigned address.
Session expiry, account changes and network changes retire pending actions.
The personal Reown wallet and its gas sponsor are not used by this portal.

Migration 114 independently adds session-bound ownership, immutable transfer
drafts and sandbox SELL records. It does not depend on migration 113. There is
no broadcast endpoint: wallet-to-wallet transfers can only prepare and journal
a draft. This test release cannot send funds, even if a broadcast flag is set.

After ownership verification, SELL can request a provider-specific sandbox
quote and a MELD sandbox checkout. This path uses the sandbox API key and does
not need the missing generic Checkout public key. Country, fiat currency and
payment method must match the live account catalog. USDT amounts retain six
decimals; fiat limits are never treated as USDT limits or converted using an
invented exchange rate. Source asset, source address, amount, payout currency
and method are locked. No provider deposit is automatically funded.

Explicit status checks and signed webhooks can record independently fetched,
fully matched sandbox transaction facts. A callback, popup close or quote never
confirms a payout. These records create no real credits or commissions.

The correct SELL flow obtains the provider's deposit address from independently
fetched `cryptoDetails.destinationWalletAddress`. The customer's
`sourceWalletAddress` or `sessionWalletAddress` must never be substituted for
the provider deposit destination. A user-confirmed, signed send and verified
chain receipt must precede any assertion of completed funding or payout.

The referenced Ramp & Swap product currently documents USDH coverage and USDC
on Arbitrum as an intermediate asset. It is not enabled here as a substitute
for the requested USDT Polygon flow.

## Primary documentation

- [Generic Checkout integration](https://docs.meld.io/docs/stablecoins/meld-checkout-integration/meld-checkout-guide/index)
- [BUY and SELL API flow](https://docs.meld.io/docs/stablecoins/white-label-api-integration/whitelabel-api-guide/index)
- [Preferred off-ramp flow and deposit address](https://docs.meld.io/docs/stablecoins/additional-information/flow/sell-flow)
- [Ramp & Swap coverage](https://docs.meld.io/docs/stablecoins/ramp-swap-flow)
