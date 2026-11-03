# Verified login handoff

Email verification proves mailbox ownership, not access to the member portal.
Both password and email-OTP login must establish a fresh native Better Auth
session before the BFF acknowledges success. The browser then checks the
canonical `/api/auth/session?view=access` response before navigating to
`/dashboard`. Registration uses the same access projection.

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
identity verifier still returns a private generic error; an invalid identity
still cannot navigate. The dashboard also enforces its server-side JWT gate.

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
