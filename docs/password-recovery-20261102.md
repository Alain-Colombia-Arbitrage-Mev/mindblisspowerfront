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
