# Independent pending memberships

Different explicit purchase intentions may buy the same catalog package while
earlier invoices remain pending. Each belongs to its own order and eventual
membership/CD. No existing invoice is cancelled or marked paid by this release.

The original Continue action retries its tab-local, subject/package-scoped UUID
after reload, transport uncertainty or Back. Preparing another independent
purchase clears only that intent; it creates no invoice until Continue is
explicitly pressed. Storage contains an opaque UUID only, not email, credentials,
provider links or financial data. Unavailable/corrupt storage fails closed before
checkout. The server remains authoritative for ownership and payment evidence.

The session exposes only its verified opaque subject for the namespace. The BFF
compares the expected subject with its independently verified live cookie/JWT;
a different account in another tab is rejected before private checkout transport.
The hint is not forwarded as identity. Summary loading/toggles retain the mounted
checkout controls, and active members see the existing catalog without a redesign.

Verification uses synthetic JSX handlers and isolated transports/storage, plus
Linux/OpenNext/workerd and anonymous production guards. No real invoice, payment,
session forgery or authentication message is used as a deployment test.

Final test counts and production version are recorded after rollout.
