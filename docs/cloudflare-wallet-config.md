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

## Administrative Meld checkout: frontend runtime

Add `MELD_CHECKOUT_URL` to the `mindbliss-portal-rewon` Worker environment. Its
value is the live Meld checkout URL supplied for this account:
`https://meldcrypto.com/?publicKey=YOUR_MELD_PUBLIC_KEY`. This is a public checkout
key, separate from the private API credential. Never put an API secret in this URL.
The administrative flow must use this URL without connecting a personal wallet.

## Private Meld API credential: Core runtime

Add the live `MELD_API_KEY` as an encrypted secret on
`mindbliss-core-production`, using Cloudflare Dashboard → Workers & Pages →
`mindbliss-core-production` → Settings → Variables and Secrets, or run from
`backend/deploy/cloudflare/core`:

```powershell
npx --no-install wrangler secret put MELD_API_KEY --env production
```

Paste the live key into Wrangler's private prompt. Never place the key in Git,
frontend `NEXT_PUBLIC_*` variables or a Docker build argument. Production reads
only `MELD_API_KEY`; staging uses `MELD_API_SANDBOX`. A sandbox key cannot enable
live payments. After changing container configuration, restart/roll out the Core
API so the new secret reaches the process.

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
