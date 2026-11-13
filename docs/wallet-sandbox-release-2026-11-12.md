# Administrative sandbox integration

Target: branch `wallet`, `wallet.mindblisspower.com` only. The shared backend
changes stay on `rewon`; neither repository's `main` branch changes. The
personal Reown production frontend and its financial records are separate.

## Fresh account checks

Read-only MELD sandbox discovery and quote requests, observed November 12,
2026 (Bogotá). Destination: `USDT_POLYGON`. No widget sessions, purchases,
KYC, wallet signatures or real charges were created for this matrix.

| Country / fiat | Sandbox account result |
| --- | --- |
| United States / USD | Transak quoted card, Apple Pay and Google Pay. |
| Mexico / MXN | Transak quoted card, Apple Pay and Google Pay. Provider limits apply in MXN. |
| Mexico / USD; Colombia / USD | Only Banxa advertised routes; quote rejected with provider authentication error. |
| Colombia / COP | No routes returned. |
| Spain, United Kingdom, Brazil, Argentina, Chile, Peru, Costa Rica, Uruguay / USD | Only Banxa advertised routes. Its shared sandbox authentication must be repaired before checkout can work. |
| Ecuador, Panama, Dominican Republic, Guatemala / USD | No routes returned. |

Banxa's advertised US/USD routes also fail authentication. No SPEI route was
returned by this sandbox account. These results describe the configured test
account, not global provider coverage or the separate Reown production merchant.
The application does not manufacture methods from a country list.

## Persistence and isolation

USD retains the administrative range of 50–25,000. MXN is enabled only for
Mexico, with the actual sandbox provider's own amount limits; no conversion
or USD minimum is invented. The backend verifies a positive exact quote before
inserting an attempt or requesting a widget. A failed quote creates no payment
attempt. Owner-scoped preflight limits and in-flight exclusion prevent repeated
clicks from flooding the provider. The database still enforces its durable
attempt limit and ownership checks.

Requests, history and status retain their original fiat currency. Replaying a
reference with another currency, amount, address or owner fails. The old USD
writer delegates to the new currency-aware writer so a warm older instance
cannot replay an MXN request as USD. Sandbox preparation never becomes proof
of settlement, wallet credit or real commission.

Community, referral, rank, team, communication, membership and personal-wallet
pages are retired in this portal. Personal payment, relay, wallet-link and
Reown webhook endpoints return 404 before private transport. Native Better
Auth sessions, registration fixes, profile/password controls and administrative
wallet ownership remain intact. The frontend import graph contains no reachable
Reown SDK or personal wallet provider.
