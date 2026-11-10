# Administrative wallet portal

This frontend branch is `wallet`. Its only live target is
`https://wallet.mindblisspower.com`, Cloudflare Worker `mindbliss-wallet`
(`wrangler deploy --env wallet --keep-vars`). It must not deploy the `rewon`
application or claim the `app.mindblisspower.com` custom domain.

The portal contains the administrative wallet only. Its assigned destination,
MELD sandbox routes, checkout attempts and history remain in the existing
backend. No Reown wallet is created or connected, no personal address is used,
and no Reown project ID is required or read by its build. Personal wallet,
wallet-link and personal funding HTTP routes return 404 before private transport.

The separate `rewon` frontend at `app.mindblisspower.com` contains the personal
Reown production wallet, limited to United States and Mexico. Neteller and
Skrill are excluded from that app's new funding methods. These restrictions do
not replace this administrative portal's independent sandbox catalogue.

Authentication uses the existing native Better Auth backend and users. Browser
cookies are host scoped: sign in separately on this subdomain. No user records,
credentials, wallet pool entries or financial balances are copied. Email OTP
and existing passwords remain available. Google is not advertised here until
the new host's OAuth callback flow is configured and verified; the existing
app's provider configuration is not proof that this callback works.

The five frontend authentication/service secrets are provisioned from the
existing encrypted production credential bundle directly into Cloudflare.
Do not put those values in Git, `.env` build arguments or public JavaScript,
rotate the shared backend key as part of this deployment, or copy a private
MELD credential to this Worker. MELD sandbox credentials remain in Core.

The initial Worker deployment stays behind `CLOUDFLARE_DEPLOYMENT_READY=false`
until its service bindings, secrets and exact backend trusted origin are ready.
The production JWT issuer and audience remain unchanged. The Core permits
administrative session mutations only from this host and personal mutations
only from the personal app; wallet connection does not establish a panel session.

The light theme is the default in SSR, the initialization script and controls.
An explicitly stored dark preference continues to work. Theme tokens, fonts and
the existing visual identity are preserved.

MELD sandbox can return routes that its shared Banxa connection cannot open.
An exact `SERVICE_PROVIDER_AUTHENTICATION_EXCEPTION` produces a specific
connection-review message rather than advice to keep changing amount/country.
The draft support report is not sent, per the user's decision. US/Transak is the
verified sandbox test path; a prepared checkout is not a completed payment.

Local currency discovery keeps country, currency, provider and method together.
The equivalent USD 50 minimum for non-USD checkout is unresolved pending the
user's threshold policy and verified provider evidence. Do not enable an
unverified MXN amount, equate 50 MXN with USD 50, assume USDT parity or treat a
return URL as settlement. The webhook remains disabled until authenticated
settlement persistence is separately verified. Sandbox attempts never accrue
real commissions or wallet credits.
