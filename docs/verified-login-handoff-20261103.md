# Verified login handoff

Email verification proves mailbox ownership, not access to the member portal.
Both password and email-OTP login must establish a fresh native Better Auth
session before the BFF acknowledges success. The browser immediately replaces
the login page with a full document request to `/dashboard`. Registration and
password sign-in use the same handoff. This navigation is not authorization:
the dashboard verifies the canonical service JWT before rendering its shell,
and each private API independently checks access and ownership.

## Access must not wait for profile enrichment

The default session response can enrich name and referral code through the
payments service. Previously a delayed payments response held the login's
canonical lookup until its 12-second browser deadline, leaving a valid session
on the verified-email screen. A payments failure was already ignored unless it
explicitly denied access, so waiting for optional presentation data was not an
authentication requirement.

The Better Auth `view=access` projection checks the same fresh service JWT and
canonical identity, including live restrictions when it is issued. It does not
call payments. Default session consumers and the Cognito suspension gate keep
their existing enriched response. No referral code is invented. An unavailable
identity verifier still returns a private generic error. This projection remains
available to session consumers but no longer gates login/registration navigation:
another browser-side preflight must not leave a freshly confirmed native session
on a verified-email screen. No `ready: true` or permissions are fabricated to
unlock navigation. A plain fixed `/dashboard` anchor provides a fallback without
JavaScript or another preflight; an invalid identity still cannot render the
protected shell or use its private APIs.

## Server-side handoff failures

The dashboard uses the strict verifier. Missing/invalid canonical proof returns
to login with `auth=session-not-established` (Better Auth only). A typed service
failure renders only the existing public AuthShell, never DashboardShell or its
children. The retry links make a fresh document request. Opaque support references
distinguish native token acquisition (`MBP-LOGIN-SERVICE`) from trusted-verifier
unavailability (`MBP-LOGIN-VERIFY`); no cause, identity or credentials are exposed.
These layout error projections are ordinary rendered pages, not a claim that
the login succeeded or an HTTP 503 response. API failure status semantics stay
unchanged. Cookies are not erased for temporary service failures.

`auth_service_token` diagnostics expose only endpoint/response/transport stages
and a bounded HTTP status or `unavailable`. No-cookie and successful calls are
silent. `auth_handoff_unavailable` logs only service_token/verification. These
events supplement the existing signature/claims verifier diagnostics without
logging upstream bodies, exceptions, cookies, emails, subjects or keys.

Optional browser referral hints and owner-authorized keepalive persistence may
start after fresh native proof, but never block the document navigation. Their
endpoint still verifies the service JWT and expected owner; this change neither
claims persistence on failure nor moves existing positions.

## Trust boundaries

- Require exactly one usable native session-token cookie from the login response.
- Check `/get-session` with that new cookie only. Its verified user, subject,
  native token and unexpired session must match the login response and mailbox.
- Keep native tokens and service JWTs on the server; never project them to JSON.
- Continue checking service-JWT signature, issuer, audience, expiry and canonical
  member identity. Do not infer member authorization from `emailVerified` alone.
- An unavailable verifier is a retryable service error, not evidence that a
  member needs manual approval. Invalid tokens still fail closed.
- Server diagnostics contain only allowlisted phase/status enums, never email,
  subject, cookies, JWTs, keys, raw exceptions or database connection details.

## Cloudflare configuration

The portal verifier uses the private `CORE_API` service binding. Its
`BETTER_AUTH_JWKS_URL` must be `https://auth.core.internal/api/auth/jwks`, not the
public website URL. Public DNS is deliberately not a fallback. Issuer and
audience must still match the authentication service; changing the transport
URL does not change those checks or rotate signing keys.

A sealed binding's presence does not prove its value. Reconcile the JWKS URL
through Wrangler without reading or exposing other secrets. Preserve deployment
variables, payment flags and all other bindings.

## Verification scope

Run login/native-session proof tests, JWT verifier/error classification tests,
the complete portal suite, lint and typecheck. Build and smoke-test the actual
OpenNext Worker in an isolated Docker runtime before publication. Anonymous
production checks confirm availability and protection, not a member's completed
login. The member must enter their own OTP; never retrieve or redeem it for them.

No email verification state, identity binding, role, rank, position, balance or
payment rule is changed by this fix.
