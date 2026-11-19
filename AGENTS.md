<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## MELD production funding (`wallet`, November 19, 2026)

- The owner explicitly migrated NEW personal-wallet deposits to MELD production
  White-Label API. This supersedes the sandbox-only restrictions below for the
  new `/api/member/wallet-funding/*` flow. Historical sandbox activity remains
  separately labelled and read-only; never turn test results into real funds.
- Only deploy `mindbliss-wallet` and its dedicated `mindbliss-wallet-core`, using
  `wallet.wrangler.jsonc`. Do not deploy the shared production Core, `rewon` or
  `main`. Keep production API credentials strictly in that private backend.
- Use `MELD_PRODUCTION_API_KEYS` with `https://api.meld.io`, dated OpenAPI and
  account-scoped transaction verification. No sandbox credential fallback.
- Use the persisted, backend ownership-verified Reown address for receiving.
  Receiving does not require a fresh signing lease or another wallet unlock.
  It does not authorize sending funds. Never reuse another owner's SDK session.
- Discover countries, currencies and payment methods from actual production
  routes. Exclude Mercuryo and Binance Connect. Check a real quote before
  offering checkout; catalogue availability alone does not prove a valid quote.
- Record production attempts separately in SQL121, with immutable owner, amount,
  provider and USDT Polygon destination. A checkout callback never proves a
  payment; verify with an independent authenticated production transaction read.
- Do not connect the sandbox webhook/signing key to production. Without a
  separately configured production webhook, status checks are explicit reads.
- Never make real payments or submit identity documents during agent testing.

## Historical MELD administrative sandbox (`wallet` branch)

- Use the official MELD documentation MCP (`https://docs.meld.io/mcp`) and read
  `https://docs.meld.io/skill.md` before changing the integration. The connected
  tools are `search_meld` and `query_docs_filesystem_meld`.
- Verify exact payloads against the dated OpenAPI schemas. The playbook is a
  starting point; for example the documented transaction search is
  `GET /payments/transactions`, not an invented POST search route.
- This portal contains the administrative MELD sandbox wallet only. Keep the
  Reown production frontend, user records, credentials and financial ledgers
  separate. Do not merge or deploy changes to `main` without a new instruction.
- Use only the user's assigned backend destination and actual provider-supported
  country, fiat, method and amount limits. USD remains 50–25,000; MXN sandbox uses
  the provider's own minimum. Never invent an FX rate or relabel MXN as USD.
- Keep the API key and signing key in backend secrets. Prefer a validated sandbox
  provider checkout URL, with a validated MELD sandbox widget as fallback. A URL
  callback, popup message or checkout preparation does not prove payment.
- Use signed notifications only to trigger an independent authenticated sandbox
  transaction read. Match the owner, session, customer, provider, fiat amount and
  USDT Polygon destination before showing a test result. Sandbox results never
  credit real balances or accrue real commissions.
- The administrative webhook belongs at
  `https://wallet.mindblisspower.com/api/webhooks/meld`. Never enable the legacy
  commission-writing capture path for this sandbox. The shared Banxa integration
  is managed by MELD; do not replace its credentials or use production to bypass
  a sandbox authentication failure.
- Test without real charges, real transfers or automatic payment retries. Keep
  external support reports as drafts unless the user authorizes sending them.

### Generic Checkout and off-ramp work on `wallet`

- The user's generic Checkout request takes precedence over the earlier
  provider-specific URL preference for the new Checkout flow. Use a separate
  endpoint and pending-attempt record; never fabricate a provider session ID.
- Keep generic Checkout disabled until the actual sandbox Public Crypto Widget
  Key, reviewed database migration and live contract validation are available.
  Check the full mint guide: this endpoint is not in the mounted OpenAPI yet.
- Preserve `BUY`, assigned administrative destination and `USDT_POLYGON` in
  server-side `prefill` and `locked`. Query-string replacements do not set locks.
- Off-ramp discovery orders currencies crypto → fiat. Return only methods and
  limits reported for the account; preserve each limit's currency units.
- An assigned address, a relayer key or a gas sponsor does not identify an
  authorized signer for that administrative address. Do not activate SELL
  funding or wallet-to-wallet broadcasts until that signing mechanism exists.

### Connected Reown wallet and Transak sandbox

- The user explicitly selected the Reown-connected wallet as the destination
  for new sandbox recargas. Its backend-verified SQL116 binding replaces pool
  assignment for this new flow; never substitute the browser address directly.
- Use only `NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID`, the dedicated Wallet project.
  AppKit connects and signs ownership messages only. Its on-ramp, swaps, send,
  receive and payment functions remain disabled; funding uses Transak through
  the existing MELD sandbox account, never Reown's production on-ramp.
- New `/api/member/sandbox-wallet/*` requests use the private `WALLET_CORE`
  binding to `mindbliss-wallet-core`. Existing `CORE_API` continues to provide
  native authentication and profile access. Do not deploy the production Core
  worker to release this portal's sandbox changes.
- Require native-session authentication, exact Wallet origin, the canonical
  mounted-subject equality fence and signed POST envelopes. SQL116 owns the
  unique address binding and immutable per-attempt destination snapshots.
- Preserve the historical pool-based journal as explicitly opened read-only
  activity. Never relabel its proof or use it to fund the connected wallet.
- New checkout returns use only `sandboxCheckoutReference`. A return is not
  proof: only the independent authenticated MELD transaction read can show a
  sandbox result. It never changes real balances or real commissions.
- USD limits stay 50–25,000, further restricted by the returned Transak route.
  MXN uses the provider's actual sandbox limits. An empty country route must
  leave the CTA unavailable; never fall back to production or another provider.
