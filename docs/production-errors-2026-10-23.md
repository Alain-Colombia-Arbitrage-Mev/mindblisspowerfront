# Production Error Corrections, 2026-10-23

Branch: `feature/production-errors-20261023`, based on the Docker QA branch.
Scope: client source, legacy compatibility entry points and release gates.
No production server was changed, and no production deployment was triggered.

## Corrected

- The previous global check reported 412 diagnostics. It now passes with the
  same checked source scope, plus explicit browser declarations. `checkJs`
  remains enabled; no `ts-ignore`, `ts-nocheck`, disabled checks or new source
  exclusions were introduced.
- Defined real optional contracts for auth observability, BFF request bodies,
  onboarding identity, field errors, React UI props and Radix refs. HTTP status
  fields accept their existing numeric/string values; email privacy logging
  and authorization behavior remain unchanged.
- Corrected import casing against actual source filenames for Linux. Removed
  remaining Vite-only environment access from checked Next modules. Command
  center requests remain same-origin; Base44 compatibility reads only explicit
  `NEXT_PUBLIC_BASE44_*` variables.
- Explicit numeric timestamps replace implicit Date subtraction. Numeric DOM
  attributes and slider values use numbers; event styling uses currentTarget.
- Corrected duplicate JSX/CSS properties, optional chart props, invalid hook
  imports and incompatible local view-model shapes. Binary tree positions and
  payout/Stripe formulas were not changed.
- An unverified participant no longer gets a verified checkmark. Only boolean
  `true` displays it, not missing values or truthy strings.
- The legacy AI dashboard now reuses the implemented read-only intelligence
  view rather than importing a nonexistent default API. Its obsolete action
  widgets are no longer entry-point dependencies; they are not new backend
  integrations. Legacy simulation modules remain simulation modules, not
  replacements for real users or Stripe data.
- Unimplemented War Room intervention paths no longer call a nonexistent
  method or report successful updates. They show an error and apply no changes.
  A supplied intervention callback is awaited with cleanup in `finally`.

## Prevention

The Docker builder now runs typecheck before the production build. The Docker
test target runs typecheck and unit tests. The existing deployment workflow
also requires typecheck and lint before tests/build, before AWS credentials or
server operations. That workflow was edited locally, not executed remotely.

## Verification

- Windows: `npm run typecheck` and `npm run lint` pass.
- Linux Docker: typecheck passes, production image builds, 130 tests pass with
  no failures/skips (126 existing + four new regression tests).
- Regression coverage checks verification indicators, fail-closed unsupported
  interventions, the legacy intelligence entry and existing investment terms.
- The rebuilt client container is running at http://127.0.0.1:3300/login.
- The existing Docker stack smoke passes all 23 HTTP probes. Additional runtime
  checks: register 200, onboarding 200, anonymous member onboarding 401 and an
  empty OTP request 400. No real OTP request or transaction was sent.
- Production dependency audit reports zero vulnerabilities.
- Raw logs: `D:/vicionpower/reportes/production-errors-*-20261023.log`.

## Not Yet Verified

Real Cognito/Outlook OTP delivery, Stripe sandbox end-to-end flows, BMP/SES,
deployment infrastructure, restore procedures and a realistic 1,100-user load
test still require dedicated staging configuration. These local corrections
do not certify those external services. The recovered historical database was
not mounted, migrated or rewritten.
