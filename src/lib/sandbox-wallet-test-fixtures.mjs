export const sandboxSubject = 'synthetic-wallet-owner';
export const sandboxAddress = `0x${'1'.repeat(40)}`;
export const sandboxOtherAddress = `0x${'2'.repeat(40)}`;
export const sandboxReference = '11111111-1111-4111-8111-111111111111';
export const sandboxOtherReference = '22222222-2222-4222-8222-222222222222';
export const sandboxSignature = `0x${'ab'.repeat(65)}`;
export const sandboxCapability = { flow: 'sandbox_wallet', configured: true, environment: 'sandbox', asset: 'USDT',
  network: 'polygon', chainId: 137, serviceProvider: 'TRANSAK', canBroadcast: false };
export const sandboxStatus = { ...sandboxCapability, status: 'linked', verified: true, address: sandboxAddress, expiresAt: '2099-11-13T12:00:00.000Z' };
export function sandboxChallenge() {
  const now = Date.now(), issuedAt = new Date(now).toISOString(), expiresAt = new Date(now + 300000).toISOString(), nonce = 'a'.repeat(64), sessionContextHash = 'b'.repeat(64);
  const message = `wallet.mindblisspower.com wants you to verify control of this sandbox wallet:\n${sandboxAddress}\n\nMindbliss sandbox wallet ownership only. No transaction or transfer of funds.\nSession context: ${sessionContextHash}\n\nURI: https://wallet.mindblisspower.com/dashboard/wallet-administrative\nVersion: 1\nChain ID: 137\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expiresAt}\nRequest ID: ${sandboxReference}`;
  return { flow: 'sandbox_wallet', challengeId: sandboxReference, address: sandboxAddress, chainId: 137, nonce, sessionContextHash, issuedAt, expiresAt, message, method: 'personal_sign' };
}
export const sandboxFundingInput = { requestId: sandboxReference, country: 'US', sourceCurrencyCode: 'USD', amount: 50, paymentMethodType: 'CREDIT_DEBIT_CARD' };
export const sandboxDestination = { address: sandboxAddress, asset: 'USDT', network: 'polygon', chainId: 137 };
export const sandboxAck = { checkoutReference: sandboxReference, walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
  serviceProvider: 'TRANSAK', status: 'session_created', requestedAmount: 50, sourceCurrencyCode: 'USD', destinationCurrencyCode: 'USDT_POLYGON',
  destination: sandboxDestination, paymentMethodType: 'CREDIT_DEBIT_CARD', checkoutUrl: 'https://global-stg.transak.com/?apiKey=synthetic&sessionId=synthetic', createdAt: '2026-11-13T12:00:00.000Z' };
export const sandboxOptions = { walletKind: 'administrative', environment: 'sandbox', provider: 'meld', serviceProvider: 'TRANSAK', country: 'US',
  sourceCurrencyCode: 'USD', paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ serviceProvider: 'TRANSAK', paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 20, maximumAmount: 25000, minimumUsd: 20, maximumUsd: 25000 }] }] };
export const sandboxFundingStatus = { checkoutReference: sandboxReference, walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
  serviceProvider: 'TRANSAK', requestedAmount: 50, sourceCurrencyCode: 'USD', paymentMethodType: 'CREDIT_DEBIT_CARD', country: 'US', requestStatus: 'session_created',
  destination: sandboxDestination, confirmation: { state: 'unconfirmed', source: 'none', testMode: true } };
export const sandboxHistory = { walletKind: 'administrative', environment: 'sandbox', settlement: 'unconfirmed', records: [{ checkoutReference: sandboxReference,
  provider: 'meld', status: 'session_created', country: 'US', requestedAmount: 50, sourceCurrencyCode: 'USD', destination: sandboxDestination, paymentMethodType: 'CREDIT_DEBIT_CARD', createdAt: '2026-11-13T12:00:00.000Z' }] };
// Actual Native sandboxProofConfirmation DTOs intentionally omit serviceProvider.
// Ownership/provider identity comes from the immutable request and verified proof.
export const sandboxProofConfirmations = [
  { state: 'pending', source: 'meld_sandbox_api', testMode: true, transactionId: 'synthetic-test-transaction', providerStatus: 'SETTLING' },
  { state: 'confirmed', source: 'meld_sandbox_api', testMode: true, transactionId: 'synthetic-test-transaction', providerStatus: 'SETTLED', receivedAmount: '46.5', confirmedAt: '2026-11-13T12:00:00.000Z' },
  { state: 'failed', source: 'meld_sandbox_api', testMode: true, transactionId: 'synthetic-test-transaction', providerStatus: 'FAILED' },
];
