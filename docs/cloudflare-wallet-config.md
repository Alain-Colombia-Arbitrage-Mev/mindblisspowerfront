# Administrative wallet portal

The wallet branch is the dedicated administrative wallet frontend for
https://wallet.mindblisspower.com, deployed to the mindbliss-wallet Worker.
It has no rewon or public-site production deployment target. The rewon branch
owns the personal wallet at https://app.mindblisspower.com.

## Independent authentication

Email OTP and password sign-in use the existing Better Auth backend. Social
sign-in is not advertised until this portal's specific OAuth callback is verified.
Cookies remain host-only, Secure, HttpOnly and SameSite=Lax. Signing in to one
portal does not copy its cookie to another. Do not broaden cookie domains or
change the existing JWT issuer, audience or canonical account binding.

The Worker uses the existing CORE_API private service and HYPERDRIVE_MEMBER_FRESH
reader bindings. Its private runtime secret names are AUTH_BFF_SHARED_SECRET,
PAYMENTS_SERVICE_TOKEN, BETTER_AUTH_JWT_ISSUER, BETTER_AUTH_JWT_AUDIENCE and
BETTER_AUTH_JWKS_URL. Reprovision these from the reviewed encrypted deployment
backup without printing or storing plaintext. Do not generate another BFF secret
or copy backend provider keys into the frontend. Secrets do not inherit by branch.

The exact wallet origin must be admitted by the Core funding gate and the
backend's trusted auth origins. Mutations retain exact same-origin checks.
AUTH_PUBLIC_ORIGIN must be https://wallet.mindblisspower.com. No wildcard origins
or cross-subdomain cookies are needed.

## Administrative funding only

After login /dashboard redirects to /dashboard/wallet-administrative. Sidebar,
overview and financial summary offer only administrative funding. Personal wallet
pages, ownership APIs, personal funding APIs and legacy mixed on-ramp endpoints
return 404, including encoded variants. History admits only the administrative
walletKind. The route import graph contains no personal wallet component or
Reown SDK. Other member features remain available.

The backend assigns the user's unique administrative deposit address and sends
that trusted address through /api/member/wallet-funding/administrative/session to
MELD sandbox. Transak and Banxa are this account's configured test providers.
Personal Reown credentials, methods, addresses and histories are never used as a
fallback when a sandbox route fails.

Country, fiat currency and method discovery belong to this separate MELD sandbox
account. Changing country or currency aborts previous reads and discards obsolete
methods. USD keeps 50-25,000 USD limits plus provider limits. Local-currency
methods can be inspected; non-USD checkout creation remains blocked until the
provider-verified USD minimum contract is available. Showing SPEI does not claim
that its checkout or the 50 USD equivalent has been enabled. Never relabel 50 MXN
as 50 USD or net USDT as gross USD.

## Provider errors and status

MELD's shared Banxa sandbox integration returned
SERVICE_PROVIDER_AUTHENTICATION_EXCEPTION. The interface explains that changing
the country or amount does not repair this provider connection. It does not
retry financial requests, silently change provider or fall back to production.
The MELD report remains prepared and unsent by the user's explicit choice.

A created session or a return URL does not confirm a paid recharge. Owned status
reads remain unconfirmed until authenticated settlement evidence is persisted.
Sandbox requests stay in their separate table and cannot create real balances or
commissions. No migration or webhook activation belongs to this frontend split.

## Build and theme

npm run cf:build builds without reading dotenv files or requiring a personal
wallet identifier. The Docker artifact has no Reown build argument. Provider
credentials remain in the private backend.

Light is the default in SSR and before first paint. An explicitly saved dark
preference remains respected. Browser storage stays local to each portal host.
