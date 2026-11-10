# Wallet configuration in Cloudflare

## Current branch split

`rewon` at `app.mindblisspower.com` now exposes the personal Reown wallet only.
New personal funding permits United States and Mexico, excluding Neteller and
Skrill. The administrative page, sidebar card, forms, funding endpoints and MELD
callback are retired from this frontend; they return 404 without forwarding.
Existing records and the backend administrative wallet assignment remain intact.

The separate `wallet` frontend is deployed to `wallet.mindblisspower.com` and
exposes the administrative MELD sandbox wallet only. Its branch contains
`docs/wallet-portal-deployment.md` with the deployment boundaries. Both apps use
the same backend identities and independent host-only browser sessions. Light
is the default theme; explicitly chosen dark preferences remain supported.

The older integration notes below describe the shared backend and the previous
combined portal. Administrative paths in those notes are no longer exposed on
the `rewon` frontend, and Spain is no longer eligible for new personal funding.

The personal wallet uses Reown AppKit. The administrative wallet uses its
assigned backend address and a separate Meld checkout. Configure them independently.

## Public Reown identifier: build time

`npm run cf:build` and `npm run cf:smoke` select only `REOWN_PROJECT_ID` or
`NEXT_PUBLIC_REOWN_PROJECT_ID`, in this order of sources:

1. The current process environment.
2. This frontend's `.env.local`.
3. The sibling `backend/.env.local`.

The identifier must contain exactly 32 hexadecimal characters. Missing, malformed
or conflicting identifiers stop the build. The script never loads other dotenv
variables into the build environment. Only this public identifier is passed as
`NEXT_PUBLIC_REOWN_PROJECT_ID` to Docker; `.env*`, `.dev.vars*` and credentials
remain excluded by `.dockerignore`. No ID value is printed by the script.

Next.js embeds the public identifier in client JavaScript. Setting a Worker
runtime variable after compilation cannot repair an artifact built without it;
rebuild and publish the frontend when changing the Reown project.

## Current environments: Reown production and administrative Meld sandbox

The user's Reown project is in production. The user's separate Meld account is
in sandbox. `ADMINISTRATIVE_ONRAMP_ENVIRONMENT=sandbox` is configured only on the
`rewon` portal. The `/dashboard/wallet-administrative` server route passes this public mode to
the administrative component; it does not change the personal wallet's Reown
project or environment. Omitting the mode retains the existing production path.

The two funding screens are `/dashboard/wallet-personal` and
`/dashboard/wallet-administrative`. `/dashboard/payments` remains the financial
summary and contains links only. It does not mount either funding form or AppKit.
Connecting an AppKit address is not proof of ownership: the personal screen
requires the native session, a single-use signature challenge and the backend
binding before enabling funding.

The personal card records an initiated funding request through
`POST /api/member/wallet-funding/personal/intent` after proving its linked wallet.
That path uses no private Meld credential or quote. Reown supplies its own live
checkout configuration. Mindbliss keeps Reown's `externalCustomerId` attribution
and adds only its recorded session reference, requested USD amount, USDT Polygon,
country and selected payment method. Documented checkout locks carry actual field
values, not boolean flags. Unsupported `serviceProvider`/`serviceProviders` URL
parameters are removed. A production check on 2026-11-10 showed that they do not
exclude Binance Connect. The requested Topper/Swapped restriction needs Reown/MELD
merchant configuration; the support request is tracked separately in
`docs/reown-onramp-provider-request.md`. The provider confirms availability,
received amount and fees; an initiated record does not confirm a paid transaction.
No synthetic quote or 1% collected commission is displayed or calculated here.

The administrative card retains address assignment and displays the translated
sandbox notice alongside a separate test form. Its initial test country is US,
independent of the personal wallet's detected country. Transak and Banxa are the
only administrative sandbox choices approved for this release. Personal discovery
and backend request eligibility allow only Topper/Swapped production routes.
Method, form, session and history state are never shared between screens.

The personal wallet currently permits only United States (`US`), Mexico (`MX`)
and Spain (`ES`), per the user's latest country policy. `NETELLER` and `SKRILL`
are excluded from its eligible methods. The form, client boundaries, BFF and
backend enforce this policy; direct API input cannot restore a removed choice.
Historical requests from other countries remain readable. The administrative
sandbox retains its own independent country and method catalogue.
The AppKit built-in on-ramp shortcut is hidden; funding starts through the
Mindbliss form and its recorded, verified destination. The pinned SDK's Meld
controller configuration still supplies the production checkout URL.

`GET /api/member/wallet-funding/personal/options?country=CO` reads production
routes using the public Meld checkout key published by the pinned Reown SDK.
It does not read the administrative secret. Discovery is authenticated at the
Mindbliss BFF and returns only canonical methods and USD limits for the selected
country, USD and USDT Polygon. No global unauthenticated fallback is used.

`GET /api/member/wallet-funding/administrative/options?country=US&serviceProvider=TRANSAK`
reads payment methods and USD limits from the administrative sandbox account only. Each method
selector resets and cancels its previous request when country or provider changes.
Loading, empty and failed reads disable checkout and offer an explicit retry;
they never default to invented card methods. Amount changes discard the previous
method and filter methods against their returned limits. Both POST endpoints
require `paymentMethodType` and revalidate the current country/method/amount on
the server. Personal requests echo the method and eligible production providers.
Migration 94 records the requested method; historical unknown values remain NULL.

`POST /api/member/wallet-funding/administrative/session` creates the test attempt
and mints a provider widget through `https://api-sb.meld.io/crypto/session/widget`.
This white-label API uses the sandbox secret directly on the server and does not
require exposing a secret or reusing Reown's checkout key. Wallet, amount and
asset are server-authored and locked where supported. The client opens the
returned `https://sb.meldcrypto.com` URL exactly as received. It never rebuilds a
token URL or appends payment parameters. See the official
[widget reference](https://docs.meld.io/api-reference/crypto/retail-ramp/crypto-session-widget-create.md).

The available `MELD_API_SANDBOX` credential belongs in an encrypted Core secret,
not in frontend `NEXT_PUBLIC_*` variables, Git or Docker build arguments. Keeping
the secret in Cloudflare does not enable a checkout. Do not rename it to
`MELD_API_KEY` or treat it as a live credential.

Core forwards this sandbox credential only when `MELD_ADMIN_SANDBOX_ENABLED=true`.
Administrative sessions require the trusted proxy IP envelope signed by the BFF;
the IP never comes from a browser JSON field. Provider failures are generic and
are not retried automatically. A used administrative request ID cannot create a
second provider session. Sandbox coverage can differ from live coverage; an
unsupported route remains unavailable rather than falling back to production.

The existing production administrative path still accepts `MELD_CHECKOUT_URL`
from server configuration and a live `MELD_API_KEY` from the Core. Those are
future production settings for the separate Meld account, not prerequisites for
configuring the already-live Reown project. After changing container
configuration, restart/roll out the Core API so new secrets reach its process.

## Separate backend histories

The personal request table `payments.reown_funding_intent` and administrative test
table `payments.meld_sandbox_funding_attempt` are separate from the existing paid
Meld commission ledger. `GET /api/member/wallet-funding/history?walletKind=...`
returns only the authenticated user's selected history. Both cards label these
as requests/tests, never confirmed balances. Sandbox activity cannot accrue real
commissions or satisfy a production purchase. Reown request records remain
`initiated` until an independent live settlement integration is added; closing
or returning from the provider does not confirm payment.

`GET /api/member/wallet-funding/{personal|administrative}/status?checkoutReference=...`
returns an owner-filtered persisted request and its immutable destination. The
read function added in migration 95 has no settlement writes or table grants.
Its current `confirmation` is always `{state: "unconfirmed", source: "none",
testMode: ...}`. The native BFF rejects claims of confirmed/pending settlement,
crossed wallets, environments, references, assets and networks. A status check
cannot replay checkout creation. The successful-payment visual is reserved for
a future authenticated, persisted settlement integration; it is not activated
by a browser URL, a created session or a requested USD amount.

Observed routes on 2026-11-10 for USD to USDT Polygon, using each wallet's own
credentials and the administrative account scope:

| Country | Reown production discovery | MELD administrative sandbox |
| --- | --- | --- |
| United States | Topper, Swapped | Transak, Banxa |
| Mexico | Swapped | Banxa |
| Panama | Topper, Swapped | No routes |
| Colombia | Topper, Swapped | Banxa |

These are discovery results, not guarantees of a quote or payment. Banxa sandbox
rejected the tested US checkout; Transak US opened a sandbox quote. The
frontend fetches fresh methods when the country changes and applies provider
limits to each amount; it does not create card methods for an unavailable route.

### Provider-managed currency conversion

The user's decision on 2026-11-10 is to leave conversion, fees and local payment
processing to each on-ramp provider. Do not introduce a separate Mindbliss FX
service as a prerequisite for local payment methods. Discovery now accepts
`sourceCurrencyCode` (USD by default) and validates each method's `currencyCode`,
`minimumAmount` and `maximumAmount` against that selected fiat. Personal discovery
still uses only Reown's production account; administrative discovery still uses
only its own sandbox credential and approved provider. The UI clears the old
amount when changing currency and aborts superseded country/currency requests.

Mexico/MXN discovery can expose SPEI when that provider returns a valid route.
This is not an enabled purchase: non-USD checkout remains blocked in the form,
client, BFF and backend until the required USD minimum policy is resolved. The
documented pre-checkout quote does not guarantee a `fiatAmountInUsd` field;
authenticated transaction details provide that valuation later. The user's
decision about validating the threshold before checkout versus before credit is
pending. No local amount is written into a field representing dollars, and no
currency migration or settlement change has been applied for this release.

Administrative session failures with the exact safe MELD code
`SERVICE_PROVIDER_AUTHENTICATION_EXCEPTION` map to
`wallet_funding_provider_authentication_unavailable`. The attempt is retained as
unavailable, while the UI explains that the provider's test connection needs
review; it does not suggest that a different amount or country repairs shared
provider credentials. Other upstream messages and credentials remain private.

Future local-currency support must keep amount and currency together in each
wallet's own provider discovery, checkout and records. Use the provider's actual
quote and authenticated settlement information. A USD reference amount alone
does not prove the local-currency minimum, and removing the currency lock is not
proof that a provider preserves the USD equivalent. Never relabel 50 USD as
50 MXN, treat net USDT as gross USD, or claim a USD minimum was verified when the
provider has not returned evidence for that valuation. Confirm the supported
provider conversion contract before enabling such a route.

The MELD sandbox support report remains a draft by the user's explicit decision;
do not send it without new authorization.

## Webhook

The deployed configuration already contains the private webhook secrets
`MELD_WEBHOOK_SIGNING_KEY`, `MELD_ACCOUNT_ID` and `MELD_WEBHOOK_PROFILE_ID`.
`MELD_WEBHOOK_ENABLED` currently remains `false`; storing secrets does not activate
webhook capture. The public callback is
`https://app.mindblisspower.com/api/webhooks/meld`. Enable the reviewed callback
and capture flow only after validating the live account, signature and backend
persistence configuration. A checkout return page does not confirm settlement.
