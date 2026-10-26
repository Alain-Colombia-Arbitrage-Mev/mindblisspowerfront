# Cache policy — 2026-10-26

## Cloudflare HTTP / static assets

The application Worker is no longer invoked for uploaded public files beneath
`/_next/static/`, `/fonts/` or `/mindbliss/`. All other routes still run the
readiness, host and application policies first. There is no SPA fallback or
asset-first exception for API, auth, dashboard, HTML or RSC. This does not make
user uploads or application data public; only files already bundled for public
distribution are admitted. Public assets can remain available while readiness
is closed, intentionally; readiness still gates every application endpoint.

After OpenNext compilation, `scripts/prepare-static-cache-headers.mjs` generates
`.open-next/assets/_headers` with exact rules for existing public files only;
`public/_headers` contains no prefix-wide TTL rules. Next build assets receive
one year and `immutable`, since their paths are deployment/content-versioned.
Fonts and brand images have mutable
filenames, so they get only one hour and `must-revalidate`, with the asset
service's ETag for conditional requests. Changing one of those files can take
an hour to appear for an existing browser; rename/version its URL when immediate
replacement is required. No immutable rule applies to non-versioned images.

Missing assets match no generated rule: a static-looking 404 keeps the asset
service's default revalidation policy instead of inheriting an immutable year.
The generator permits at most 100 rules and 2000 characters per line, fails the
build clearly when a limit is exceeded, and rejects symlinks, ambiguous paths,
private API/auth/dashboard/uploads/report namespaces, HTML/RSC/unknown data
under cached prefixes, environment files, databases and key material. Its CLI
has no directory override and writes only this repository's generated
`.open-next/assets/_headers`. Font licenses and README files are public and get
the same one-hour revalidation as other non-versioned font files.

Worker-level response caching is explicitly disabled. Every response generated
by application code, including errors, redirects and static-looking API URLs,
is forced to `private, no-store`. `CDN-Cache-Control` and
`Cloudflare-CDN-Cache-Control` are `no-store`; inherited surrogate TTLs, expiry
dates and cache tags are removed. Cookies and Next's RSC `Vary` remain intact.
There is no shared-user response cache, new paid cache service or global
"cache everything" rule.

The offline Worker smoke tests fetch actual built JS, fonts and a brand image,
assert asset cache headers, and check `If-None-Match` returns 304 without a body.
The private response wrapper makes a public asset header an assertion that the
asset was served before application execution. Unit tests also cover cache
deception paths, private responses, denial/error status codes and cookie/RSC
header preservation. These are local checks, not production billing metrics.

References: [Cloudflare selective asset routing](https://developers.cloudflare.com/workers/static-assets/binding/#run_worker_first),
[asset headers](https://developers.cloudflare.com/workers/static-assets/headers/),
and [Workers cache configuration](https://developers.cloudflare.com/workers/cache/configuration/).

## Browser rank catalogue

`src/lib/rank-catalog.mjs` retains only the non-personal rank catalogue in browser
memory for **300 seconds** after a successful read (previously 60 seconds).
It does not persist data in storage, use a shared-user/server cache or make the
authenticated endpoint public/CDN-cacheable. Server-side calls bypass this cache.

Each cached row is restricted to `code`, `name_es`, `required_points` and
`bonus_amount_usd`; row types and bounds are validated. Extra top-level and nested
fields such as email, wallet, permissions or the member's actual rank are not
retained. These are catalogue requirements/bonuses, not a member balance or an
authoritative compensation calculation.

Concurrent reads share one request. `readRankCatalog({ force: true })` supersedes
an older ordinary read, and concurrent forced refreshes share the new request.
Readers arriving during that refresh wait for it instead of receiving an older
value. A failed refresh discards its previous value; errors, denied responses and
malformed rows are not cached. Invalidation prevents an older in-flight result
from restoring the discarded cache. Each caller receives an isolated data copy.
The GET remains `no-store`, same-origin, rejects redirects and has a 15-second
timeout.

No UI, checkout, session, permissions, personal tree position, blacklist,
sales, payments, withdrawals, commissions or balance cache policies change here.
In particular, a displayed catalogue never replaces the authoritative checkout
price or server-side membership eligibility checks.

## Synthetic verification

Run:

```sh
node --test src/lib/expiring-resource.test.mjs src/lib/rank-catalog.test.mjs
```

The tests use mocked HTTP responses and a controlled clock, with no real users,
database queries or network traffic. All 15 focused tests pass.

For the same five mounted visits at `0`, `60`, `120`, `180` and `299.999` seconds:

| Browser policy | API GETs |
| --- | ---: |
| Previous 60-second TTL | 5 |
| New 300-second TTL | 1 |

This is **80% fewer catalogue GETs in this synthetic revisit scenario**, not a
measurement of overall production API usage, latency, Cloudflare charges or
database load. A visit at exactly 300 seconds triggers a new GET. Additional
tests cover concurrent refreshes, invalidation races, failures, malformed rows,
per-caller mutation isolation and bypass outside the browser.

Limits: catalogue display changes can take up to five minutes to appear in an
already-open browser unless explicitly refreshed. Separate tabs have separate
memory. This does not remove the authorization work of a fresh catalogue GET,
and it does not add a cross-request Workers database cache.

## Intent-only shell prefetch

The portal sidebar, brand/account links and header now retain native `next/link`
navigation but start with `prefetch={false}`. Hover, keyboard focus or touch
switches that link to `prefetch={null}`, restoring the framework's ordinary
prefetching, scheduling and invalidation behavior. Admission requires a visible
document and a browser that is not offline; changing the destination resets the
intent. Original handlers, classes, anchor attributes and modified-click behavior
are retained. Logout actions and links within page content are unchanged.

There are no `router.prefetch` calls, background polling, private-data caches or
custom prefetch TTLs. The trade-off is that an untouched destination might begin
loading later on click. This removes speculative work solely from showing the
shell; it does **not** establish a fixed number of avoided API/SQL calls per link.
In particular, the installed Next.js version partially prefetches dynamic routes
only up to their loading boundary, and the portal has `dashboard/loading.jsx`.
Production network measurement is still needed to quantify any billing impact.

The six component tests execute the real JSX handlers with deterministic hooks:

```sh
node --test src/components/panel/IntentLink.test.mjs
```

They cover no prefetch on mount, hover/focus/touch admission, hidden/offline and
cancelled-event guards, destination reset, explicit disable, forwarded anchor
props/modified clicks and the restricted shell-only integration. They do not
claim a live production navigation benchmark.

## Public signing-key snapshots, never authentication decisions

Only validated RSA public JWKS JSON is reused for at most 60 seconds in a
Worker isolate. The cache holds at most eight public configurations and 64 KiB
per document, keyed by issuer, audience, key URL and deployment configuration.
Every request still verifies its JWT signature, issuer, audience, expiry and
identity claims, and establishes the current session and data permissions.
Tokens, sessions, roles, bindings, HTTP promises and imported CryptoKeys never
enter this shared cache; each request creates its own resolver from a JSON copy.

Five sequential verifiers for the same configuration within the TTL perform
one key GET rather than five in the isolated tests. Simultaneous cold requests
may each fetch independently: cross-request I/O promises are deliberately not
shared in Workers. Deployments and isolate eviction reset this opportunistic
cache, so this is not a guarantee of one key request globally per minute.

An unknown signing `kid` can trigger one refresh, with a 30-second per-config
anti-abuse cooldown. Invalid documents, private-key fields, failed reads and
expired snapshots never authorize a token or enable a stale-on-error fallback.
Key rotation/revocation visibility is bounded by the 60-second TTL; new key IDs
can refresh earlier, subject to the cooldown. Session/role revocation checks
remain fresh and are not replaced by the key snapshot.

Tests use real synthetic RSA signatures and cover expiry, rotation, invalid
signatures/audiences, malformed keys, configuration isolation, stale concurrent
writes and separately bundled modules. Production public JWKS formatting was
read-only checked for compatibility without inspecting any private keys.

## Release checks

Final local validation: 387 unit/component tests, typecheck and lint passed.
The final Linux/OpenNext build and production dry-run passed. Offline workerd
ran 49 probes against the actual exported artifacts: real RSA verification,
private authorization failures, public static cache headers, ETag 304 and
uncached missing assets. No real messages, payments or production DB queries
were used in these fixtures. The authenticated production network still needs
real workload measurement to quantify the overall savings.

Use `Dockerfile.cloudflare` / `npm run cf:build` for a release: the Docker
pipeline generates exact-file headers after OpenNext and before validation.
If building OpenNext manually, run `node scripts/prepare-static-cache-headers.mjs`
after `npm run cf:bundle` and before any upload; never upload the unprocessed
`public/_headers` template as the final rule set.
