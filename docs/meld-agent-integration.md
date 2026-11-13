# MELD agent integration workflow

This branch uses the official documentation MCP at `https://docs.meld.io/mcp`
and the [MELD API Integration Playbook](https://docs.meld.io/skill.md). The MCP
is documentation access; it does not administer private provider credentials.

The product remains White-Label API with hosted sandbox checkout. There is no
MELD API key in the browser and no additional wallet SDK in this portal.
`https://api-sb.meld.io`, `Authorization: BASIC …`, and API version `2026-02-03`
are used by the backend. The personal Reown production merchant stays separate.

## Verified flow

1. Discover methods and limits for the exact country/fiat/USDT Polygon corridor.
2. Obtain a matching quote before recording a checkout attempt. The quote amount
   is a JSON number. Bind the quote to the assigned administrative address.
3. Create the nested BUY session with the amount as a string, stable owner and
   attempt references, immutable destination fields, and the trusted return URL.
4. Prefer the validated Transak sandbox provider URL. Keep the validated MELD
   sandbox widget fallback. Both paths carry the chosen provider, amount and
   original fiat currency; no callback confirms a payment.
5. Read transaction state through the native backend session or signed webhook.
   Independently fetch the provider record and check its full stored context.
   Persist only bounded sandbox evidence. Display results as tests, without
   production credits, commission entries or personal wallet mutations.

The OpenAPI is authoritative when the general playbook differs. In particular,
transaction search is `GET /payments/transactions` with owned session filters.
Never perform a transaction lookup using an arbitrary browser-supplied vendor ID.

## Account checks

A controlled Transak sandbox quote and BUY-session preparation succeeded with
USD50 and USDT Polygon. The returned provider link used
`https://global-stg.transak.com/` with exactly `apiKey` and `sessionId`; the MELD
fallback used `https://sb.meldcrypto.com/` with a token. URL values and tokens
were not published, and checkout was not completed.

The existing sandbox webhook profile targeted the personal app during the
initial audit. It now points to
`https://wallet.mindblisspower.com/api/webhooks/meld`, retains its existing
signing secret, and subscribes to the four crypto transaction events plus
`WEBHOOK_TEST`, using version `2026-02-03`.

On 2026-11-13 UTC, MELD delivered the configuration test and a separate explicit
test request. Both were verified and stored as technical receipts with no
customer attempt, payment, credit or commission mutation. The explicit test
increased the receipt count from one to two. An invalid signature returned
HTTP 401. This verifies delivery and authentication; it does not represent a
completed sandbox purchase.

Banxa is connected through MELD's shared sandbox integration, but returned
`SERVICE_PROVIDER_AUTHENTICATION_EXCEPTION` even for US/USD/USDC. That connection
requires MELD review; country changes, a fabricated quote, or a production key
do not repair it. The support report remains a draft.

## Release validation

- The frontend full suite passed 1,678 tests; the final contract negotiation
  changes also passed their focused suite, type checking and lint checks.
- The backend funding release passed 100 tests with 1,390 assertions; Core
  contract forwarding passed 14 tests. The webhook/reconciliation and SQL
  isolation suites passed, including 75 PostgreSQL probes.
- The administrative portal was deployed from `wallet`; its personal and
  community routes remain unavailable. The shared API was deployed from
  `rewon`. Neither repository's `main` branch was modified.
- Contract header `x-mindbliss-sandbox-contract: v2` opts administrative clients
  into direct provider checkout and independent sandbox confirmation. Older
  clients retain the MELD widget and legacy status projection. Personal
  requests never opt into the administrative contract.

## Primary references

- [AI toolkit](https://docs.meld.io/docs/welcome/build-with-ai)
- [White-Label quickstart](https://docs.meld.io/docs/stablecoins/white-label-api-integration/whitelabel-quickstart)
- [Webhook authentication](https://docs.meld.io/docs/stablecoins/for-all-products/webhooks-authentication)
- [Transaction search](https://docs.meld.io/api-reference/crypto/retail-ramp/payments-transactions-search)
- [Transaction proof](https://docs.meld.io/api-reference/crypto/retail-ramp/payments-transactions-get)
