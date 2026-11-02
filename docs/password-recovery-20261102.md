# Password recovery, 2026-11-02

Better Auth no longer redirects `/forgot-password` to login or hides recovery.
The existing visual system is preserved. **Crear o cambiar contraseña** opens
one email-owned flow for first-credential creation and password replacement.

Only the original email receives a purpose-specific recovery OTP. The recipient
is locked during confirmation; changing the form is not an account-email update.
Codes are six ASCII digits, five minutes; passwords are12–128 exact characters
with confirmation. The BFF privately validates/filters input and signs an empty
cookie context. Only the exact HTTP200 reset acknowledgement displays success.
No session, JWT, role, binding, email change or payment follows from the form.

Unknown, restricted and credential-less states are not publicly enumerated.
Requests do not guarantee delivery; timeouts retain code entry and never resend
automatically. Cooldowns cannot shorten300 seconds. A reset timeout does not
promise rollback: try sign-in with the chosen new password before requesting
another code. Submit locks, unmount aborts and stale-response guards are tested.

Cognito recovery remains separate. Existing email-only registration, payment
intent, tree/compensation, logout and admin policies are unchanged. No real OTP
or password was used as a deployment test. Account-specific administrative
reactivation is separately authorized and audited, never part of recovery.

Pre-release:551 portal tests, typecheck and ESLint passed;90 network-disabled
workerd probes passed with real RSA checks and synthetic recovery transports.
Backend installed-handler auth suite111 tests and Core89 routing tests passed.

Production published and checked2026-11-02: portal source `2c1dbe8`, Worker version
`55c33838-bc7c-4fa6-8cbb-71f894386cf9`; backend source `f941c94`, Core version
`4a403836-0bd8-4ba8-921c-8e32f6d228f5`. Both versions serve100% of traffic.
APIv9 is healthy with rollout completed. Admin, Paymentsv14, Enginev1 and
Withdrawalsv3 were not updated; financial flags and other service pins match
the pre-release state.

All11 anonymous recovery checks passed: live recovery/login pages, visible link,
5-minute code notice, exact deployed recovery asset SHA256, GET rejection,
cross-origin rejection and empty-input rejection. All13 existing anonymous
login/logout/checkout/webhook guards also passed, and existing payment-panel and
logout assets match the reviewed build. Recovery pages/responses are private,
no-store. No valid recipient request, real OTP, password, authenticated session or
invoice was used in these checks. Real recipient delivery and user completion
remain user-owned; no automatic verification or account-email change occurred.
