# MELD sandbox routing support request

Status: prepared; not submitted. No production keys or customer wallet addresses
are included. Submission requires the user's chosen contact channel and email.

Subject: Shared Banxa sandbox authentication failure and USDT Polygon coverage

Hello MELD team,

Our administrative wallet integration at https://app.mindblisspower.com uses our
own MELD sandbox account, separate from the Reown production personal wallet.

The connected Banxa integration is shown in the dashboard as **Shared Meld
Integration — Meld Shared: Crypto -> NP SB**. It exposes no credential-editing
controls; the dashboard states that provider-to-MELD webhooks are already set up.

Creating a BUY widget for US, USD 50, USDT_POLYGON and CREDIT_DEBIT_CARD returned
HTTP 401 with `SERVICE_PROVIDER_AUTHENTICATION_EXCEPTION` at
2026-11-10T21:38:12Z. This is a MELD-to-provider authentication error, rather than
an API-key rejection from our frontend. No payment or real charge was made.

The technical sandbox request reference is retained in the private diagnostic
receipt. It can be sent privately to MELD for correlation if authorized; it is
not published in this repository.

Authenticated discovery was checked with Basic auth plus the account-scoping
header, without restricting the provider filter:

| Country / fiat | USDT Polygon routes |
| --- | --- |
| US / USD | Transak, Banxa |
| MX / USD | Banxa |
| MX / MXN | Transak, Banxa |
| PA / USD or PAB | None |
| CO / USD | Banxa |
| CO / COP | None |

Transak US sandbox widget creation and quote display worked. We have not
completed a transaction. Enabling Unlimit blindly is not a solution: the global
sandbox discovery also returned no Unlimit routes for the tested USD corridors
or MX/MXN with USDT_POLYGON.

Please repair or replace the shared Banxa sandbox credentials, and confirm the
supported sandbox providers, currencies and methods for US, Mexico, Panama and
Colombia with USDT Polygon. In particular, please explain the gap between
published routes and a provider session that fails authentication. If those
corridors cannot be tested in sandbox, please identify the supported test path.

Please also document how an account can receive a reliable fiat USD/MXN gross
reference before selecting MXN methods while preserving a USD 50 app minimum.
The crypto quote response has no documented independent fiat USD valuation;
we will not invent a conversion rate or treat net USDT as gross USD.

No API secret, signature, checkout URL/token, customer email, address, KYC document
or payment details are attached.
