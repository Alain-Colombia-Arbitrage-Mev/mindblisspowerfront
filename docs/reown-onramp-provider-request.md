# Reown/MELD provider restriction request

Status: submitted on 2026-11-10 through the authenticated project's official
Reown support messenger. Ticket **#154416921**: "Restrict Mindbliss on-ramp to
Topper and Swapped; disable Binance Connect". Creation was confirmed by the
support UI. Provider restriction has not yet been confirmed or applied by Reown.

Subject: Restrict Mindbliss AppKit on-ramp to Topper and Swapped

Hello Reown team,

We use Reown AppKit 1.8.24 for the personal wallet on https://app.mindblisspower.com.
Public project ID: `452389915db63a5312fd4e13626742e4`.

Please confirm and apply a supported project-level allowlist containing only
Topper and Swapped. Binance Connect must not appear as a quote or be chosen as
the default provider. We will keep Reown's production integration; our separate
administrative MELD sandbox account must not be used for personal wallet funding.

On 2026-11-10, a production checkout for Colombia, USD 50 and USDT on Polygon
displayed Binance Connect by default. Topper and Swapped quotes were also
present. The public widget ignores a `serviceProviders` URL parameter, and we
found no documented public URL parameter or AppKit option for a hard allowlist.
We have not completed a purchase or submitted payment details.

Please provide:

1. The supported merchant/project configuration to enforce the two-provider
   allowlist, including confirmation that it is enforced in the hosted checkout.
2. Current country, payment-method and amount eligibility for the United States,
   Mexico, Panama and Colombia, with USDT on Polygon as the destination asset.
3. Confirmation that the existing destination address, country, amount, asset
   and selected canonical payment method remain locked through provider handoff.
4. The supported project-specific, authenticated settlement notification flow.
   We need to correlate our opaque `externalSessionId` with the destination,
   received token amount and final transaction status. Browser redirects and
   an opened checkout are not sufficient proof of payment.

Thank you.

## References checked

- https://reown.com/contact — official DevRel contact and dashboard links.
- https://docs.meld.io/docs/stablecoins/meld-checkout-integration/meld-checkout-guide/url-parameters
- https://docs.meld.io/docs/stablecoins/meld-checkout-integration/meld-checkout-guide/index
- Installed AppKit `OnRampController` supports the MELD aggregator, without a
  documented selection of its underlying providers.

No customer email, wallet address, API secret, checkout token, signature or
payment details are included in this request.

## Additional reproduction: payment-method mismatch

Follow-up sent in the ticket's conversation on 2026-11-10 and verified in the
support UI: production routes advertise SKRILL for
Swapped, Colombia, USD 50 and USDT Polygon. A checkout with documented
`paymentMethodType=SKRILL` and `paymentMethodTypeLocked=SKRILL` displayed
"No payment methods available" and disabled Buy, even after manually selecting
the Swapped quote. No Buy action or payment submission occurred. Reown/MELD must
confirm how hosted checkout capabilities are reconciled with route discovery.
