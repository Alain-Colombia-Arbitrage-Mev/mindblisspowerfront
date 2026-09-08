# Mindbliss registration and OTP delivery audit

Scope: customer application `app.mindblisspower.com`, Cognito pool
`us-east-1_8tLjOfPH1`, client `2daar7hvc5joua65e6kkil277v`, SES `cognito-otp`,
and Cognito's SNS SMS route in `us-east-1`.

## Observations

- The public application resolves to EC2 `i-060e76a6c26bded35` and uses the
  local payments API on port 9095 for account status checks.
- Seven days of application logs contained 29 signup code mismatches,
  14 provider rate-limit errors across confirmation/reset paths, and 36
  attempts to register an existing account. These are attempt counts,
  not distinct people and not proof that the provider failed delivery.
- Cognito had 2,387 accounts: 2,320 confirmed and 67 unconfirmed. Only 10
  stored phone numbers were verified; 2,377 were unverified. The old BFF
  rejected a saved unverified phone before attempting native `SMS_OTP`.
- Authentication sessions expired in 3 minutes, while the frontend kept
  the challenge cookie for 10 minutes.
- The SMS resend button used the default email channel, replacing the
  selected method. The confirmation form allowed changing the email while
  still showing a challenge for the previous email.
- Updating a phone could return `CodeDeliveryDetailsList`, but the BFF
  always requested another verification code anyway.
- SES production sending, DKIM (RSA-2048), custom MAIL FROM, and SPF were
  healthy. DMARC currently uses `p=none`. Account quota was 50,000/day,
  14/second, with 404 sent in the preceding 24 hours. No global sending
  suspension or quota exhaustion was observed.
- SNS SMS was outside the sandbox, with a USD 500 monthly ceiling and
  approximately USD 0.13 month-to-date usage. The country protection rules
  inspected for CO, MX, US, VE, PE and ES permitted sending.
- Only three US simulator originators were present. This does not provision
  a registered real US SMS sender.
- Staging's running frontend uses the same production Cognito pool/client.
  It is not an isolated authentication test environment.

## Changes

- Reuse a verification delivery returned by `UpdateUserAttributes`.
- Let Cognito prove ownership of a saved phone through `SMS_OTP`; do not
  mark member phone numbers verified administratively.
- Preserve Cognito's canonical username and the selected email/SMS channel
  for challenge continuation; keep the recipient fixed during verification.
- Apply a shared 45-second send cooldown and 12-attempt hourly budget per
  email on the current single application process. A multi-instance rollout
  would require a shared store for these limits.
- Handle provider retry delays and duplicate submits in the forms.
- Route unconfirmed accounts from password login/recovery to confirmation.
- Bound Cognito calls without automatically retrying a possibly completed
  send; record confirmation and phone verification outcomes without OTPs.
- Expand email typo suggestions, including `gmail.com.com`.
- Set Cognito authentication session validity to 10 minutes, preserving all
  writable app-client settings. Backups are generated outside the repo.
- Add SES CloudWatch metrics under `ses:configuration-set=cognito-otp` and
  connect Cognito `userNotification` errors to `OTPDeliveryLogs`, preserving
  the existing authentication event logs.
- Deploy purpose-specific signup/reset/contact-verification email templates
  and short ASCII SMS messages in `mbp-cognito-custom-message`.

## Verification

- 96 unit tests passed, including OTP delivery reuse, failed phone updates,
  canonical usernames, send budgets, network failures and template placeholders.
- Production Next.js build and targeted ESLint passed.
- Browser testing with a local HTTP fixture verified email -> SMS -> SMS
  resend, one automatic signup resend, locked recipient, typo suggestion,
  and mobile presentation. No customer messages were sent by these UI tests.
- A disposable Cognito fixture used AWS email/SMS simulator destinations.
  SignUp returned EMAIL delivery; native EMAIL_OTP and SMS_OTP returned valid
  challenge sessions. The fixture was removed and no RDS member was created.
- A separate SES simulator diagnostic produced both Send and Delivery;
  processing time was 319 ms. This does not establish human inbox placement.
- Real handset and inbox receipt require an authorized test recipient.

## Operations

Preview settings: `node scripts/configure-otp-delivery.mjs`.
Apply idempotently: `node scripts/configure-otp-delivery.mjs --apply`.
Run a disposable AWS simulator smoke test:
`node scripts/smoke-otp-simulator.mjs --run`.

Template source: `infra/cognito-custom-message/index.mjs`. Package this file at
the ZIP root and deploy to the named Lambda using its current `RevisionId`.
Keep the prior code ZIP before deployment. Configuration snapshots under the
Windows temporary directory retain the previous writable client settings.

References:

- [Cognito passwordless ownership verification](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html)
- [Attribute update delivery details](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_UpdateUserAttributes.html)
- [SES configuration-set metrics](https://docs.aws.amazon.com/ses/latest/dg/event-publishing-add-event-destination-cloudwatch.html)
- [SMS simulator scope](https://docs.aws.amazon.com/sms-voice/latest/userguide/test-phone-numbers.html)
