# Wallet configuration in Cloudflare

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
`rewon` portal. The `/dashboard/payments` server route passes this public mode to
the administrative component; it does not change the personal wallet's Reown
project or environment. Omitting the mode retains the existing production path.

The administrative component keeps address assignment and address display, but
shows a translated sandbox notice instead of the top-up form. The checkout is
disabled while sandbox persistence is not isolated: the current production
attempt writer and webhook handler calculate real commission states and have no
environment discriminator. Do not send sandbox attempts or callbacks to them.
Sandbox activity must never credit balances or generate real commissions.

The available `MELD_API_SANDBOX` credential belongs in an encrypted Core secret,
not in frontend `NEXT_PUBLIC_*` variables, Git or Docker build arguments. Keeping
the secret in Cloudflare does not enable a checkout. Do not rename it to
`MELD_API_KEY` or treat it as a live credential.

The next sandbox checkout implementation must use the separate sandbox API
`https://api-sb.meld.io` and sandbox widget `https://sb.meldcrypto.com`, with its
own publishable key, isolated test records and separate webhook configuration.
Meld's current checkout API mints a per-session `widgetUrl` server-side through
`POST /crypto/session/widget/url`; it takes the matching private/public keys and
server-authored `prefill`/`locked` fields. Use the returned URL as supplied rather
than reconstructing it or appending payment parameters. This endpoint is not
implemented by this sandbox notice release. See the official
[checkout guide](https://docs.meld.io/docs/stablecoins/meld-checkout-integration/meld-checkout-guide.md)
and [sandbox guide](https://docs.meld.io/docs/stablecoins/sandbox-guide.md).

The existing production administrative path still accepts `MELD_CHECKOUT_URL`
from server configuration and a live `MELD_API_KEY` from the Core. Those are
future production settings for the separate Meld account, not prerequisites for
configuring the already-live Reown project. After changing container
configuration, restart/roll out the Core API so new secrets reach its process.

The personal wallet's current quote/intent preflight still uses the shared Meld
backend. Reown being in production does not make that private Meld API live.
Decouple that preflight through a production-compatible verification and capture
path before claiming personal top-ups work; do not bypass backend capture or
substitute sandbox quotes for real amounts.

Topper and Swapped must be enabled on the Meld account and have a supported
country, fiat and USDT network route. The application displays only routes and
quotes actually returned by the provider.

## Webhook

The deployed configuration already contains the private webhook secrets
`MELD_WEBHOOK_SIGNING_KEY`, `MELD_ACCOUNT_ID` and `MELD_WEBHOOK_PROFILE_ID`.
`MELD_WEBHOOK_ENABLED` currently remains `false`; storing secrets does not activate
webhook capture. The public callback is
`https://app.mindblisspower.com/api/webhooks/meld`. Enable the reviewed callback
and capture flow only after validating the live account, signature and backend
persistence configuration. A checkout return page does not confirm settlement.
