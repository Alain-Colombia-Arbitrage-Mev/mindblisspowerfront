# Verified login handoff

The support reference `MBP-LOGIN-SESSION` previously combined three different
states: an absent native browser session, a denied canonical member binding,
and a rejected service-token proof. The screenshot alone cannot identify the
affected account or establish a Safari-specific defect.

## Confirmed defects and bounded corrections

- The API's canonical identity comparison trims/lowercases legacy emails, but
  the JWT previously contained the untrimmed stored email. The strict portal
  validator correctly rejected that claim. The API now emits the same normalized
  email only after all existing ownership/binding checks pass. No DB row changes.
- Better Auth's native token middleware can turn a session-storage exception
  into HTTP401. Strict portal handoff reads now confirm absence with one signed
  GET to its direct session endpoint using the same cookie. Only native200/null
  establishes absence; storage failure, malformed data or a non-null limited
  session returns a generic503, not a false logout. Cookie/expiry checks stay
  native, and the token request is never retried. Healthy logins need no probe.
- A native canonical-binding denial has a closed error code. Strict handoff
  reads translate only that code to private403 guidance. Unknown403 responses,
  malformed responses and outages are not described as account restrictions.
- Existing member-data consumers retain their previous fail-closed behavior.
  A token lookup is shared only within the same request's cookie object. Neither
  an email verification flag nor a limited native session authorizes the panel.
- After a proven OTP/password login, the client makes one bounded same-origin
  GET to confirm that the browser returned an authorized session for the same
  email before automatic navigation. Failure retains the verified screen and a
  native dashboard link; it never sends another OTP or repeats a mutation.
- Anonymous dashboard visits go to ordinary login without an alarming failure
  reference. Explicit binding denials show `MBP-LOGIN-ACCESS`, not a logout loop.

## Security and verification boundaries

Preserve host-only Secure/HttpOnly/SameSite cookies, signature/issuer/audience
and expiry validation, canonical restrictions, CSRF/Origin checks, and no-store
on every authenticated page and API. Do not auto-approve users, move network
nodes, clear limits, or send diagnostic OTPs.

Tests use synthetic identities, fault-injected storage and provider mocks.
Browser-behavior fixtures exercise accepted/discarded sessions, wrong owners,
limited accounts, timeouts, cancellation and older mobile AbortController APIs.
These are not a claim that a physical iPhone or the reported account was tested.
Real-device confirmation requires the user to perform their own login; codes,
cookies, passwords and provider bodies must never be requested or logged.
