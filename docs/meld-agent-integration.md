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

The existing sandbox webhook profile still targeted the personal app during
the initial audit. Its signing secret matched the existing backend secret.
The administrative destination is `wallet.mindblisspower.com/api/webhooks/meld`.

Banxa is connected through MELD's shared sandbox integration, but returned
`SERVICE_PROVIDER_AUTHENTICATION_EXCEPTION` even for US/USD/USDC. That connection
requires MELD review; country changes, a fabricated quote, or a production key
do not repair it. The support report remains a draft.

## Primary references

- [AI toolkit](https://docs.meld.io/docs/welcome/build-with-ai)
- [White-Label quickstart](https://docs.meld.io/docs/stablecoins/white-label-api-integration/whitelabel-quickstart)
- [Webhook authentication](https://docs.meld.io/docs/stablecoins/for-all-products/webhooks-authentication)
- [Transaction search](https://docs.meld.io/api-reference/crypto/retail-ramp/payments-transactions-search)
- [Transaction proof](https://docs.meld.io/api-reference/crypto/retail-ramp/payments-transactions-get)
