# Wallet: Reown connection and Transak sandbox

The `wallet` portal connects a user's own wallet with a dedicated Reown project.
New recargas target the address verified and stored by its isolated backend,
not the historical address pool and not the personal production wallet API.

## Runtime separation

- Site/branch: `https://wallet.mindblisspower.com`, `wallet`.
- Reown: dedicated **Mindbliss Wallet Sandbox** project. Only the public
  `NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID` is supplied to the Docker build.
- Session/profile: existing `CORE_API` binding, unchanged.
- New wallet proofs and journal: `WALLET_CORE` → `mindbliss-wallet-core` →
  isolated `WalletSandboxApi` container. No public backend route is deployed.
- Merchant: backend-only `MELD_API_SANDBOX` and `MELD_ACCOUNT_ID` against
  `https://api-sb.meld.io`; provider fixed to `TRANSAK`.
- Asset/network: `USDT_POLYGON`, Polygon 137.

Reown's own on-ramp and broadcasting functions are disabled. The word sandbox
describes the payment processor and ledger; connecting a wallet does not turn
its actual blockchain keys or existing assets into simulated funds.

## Flow and authority

1. Better Auth proves the current native session.
2. The user explicitly connects Reown, then activates the wallet with a bounded
   ownership message. No OTP, signature or checkout is requested automatically.
3. SQL116 enforces one immutable, unique connected address per native user.
   The proof is session-bound, expires within 24 hours and never outlives the
   session. Replays, account changes and another user's address are rejected.
4. Country/currency discovery returns only actual Transak sandbox routes and
   limits. USD remains 50–25,000 before the provider's tighter limits; MXN uses
   provider-native limits without an invented USD conversion.
5. The backend snapshots its own verified destination when creating the
   sandbox request. The browser cannot supply a provider, chain or address.
6. The fixed Transak staging URL opens after a validated acknowledgement.
   `sandboxCheckoutReference` selects the owned result on return; it cannot
   assert that the payment completed.
7. A manual status read searches and independently fetches the sandbox
   transaction, matching account, owner/session, customer, provider, amount,
   fiat, method and the immutable USDT Polygon destination. Only this evidence
   can show a test confirmation. No real balance or commission is written.

Old pool activity is loaded only when its separate disclosure is opened. It
does not supply a destination or proof for a new connected-wallet request.
Sending and off-ramp execution are not enabled by this new connection flow;
the UI explicitly identifies those unavailable sandbox operations.

## Validation and deployment

Read the official MELD skill and dated OpenAPI before changing payloads. The
transaction search is `GET /payments/transactions`. Keep support reports local
unless the user authorizes sending them.

Frontend checks: `npm test`, `npm run typecheck`, scoped ESLint and
`npm run cf:build`. The build reads only the public project ID from the explicit
environment or ignored `.env.wallet.local`; no private dotenv is copied.

Deploy only `wrangler deploy --config wrangler.jsonc --env wallet --keep-vars`
with the OpenNext deployment environment enabled. The backend has its own
`deploy/cloudflare/core/wallet.wrangler.jsonc`; do not use the production Core
configuration for this release.

Live sandbox discovery on 2026-11-13 confirmed US/USD and MX/MXN Transak card
quotes. CO/USD returned no Transak route, so its recharge stays unavailable.
These observations are not hardcoded coverage promises or exchange rates.
