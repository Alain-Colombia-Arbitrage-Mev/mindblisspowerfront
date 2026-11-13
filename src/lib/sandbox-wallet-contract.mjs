import { FUNDING_UUID, administrativeSandboxOptions, fundingAcknowledgement, fundingHistory, fundingStatus, fundingSourceSupported, validFundingAmount } from './wallet-funding-contract.mjs';

export const SANDBOX_WALLET_PATH = '/api/member/sandbox-wallet';
export const SANDBOX_WALLET_ORIGIN = 'https://wallet.mindblisspower.com';
export const SANDBOX_WALLET_COUNTRIES = Object.freeze(['US', 'MX', 'CO']);
export function sandboxWalletSubjectHeader(subject) {
  // eslint-disable-next-line no-control-regex
  if (typeof subject !== 'string' || !subject || subject.length > 255 || /[\u0000-\u0020\u007f]/.test(subject)) return null;
  const value = encodeURIComponent(subject);
  return value.length <= 1536 ? value : null;
}
export const sandboxWalletAddress = value => typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value);
const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key));
const instant = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));

export function sandboxWalletCapabilities(value) {
  if (!plain(value) || value.flow !== 'sandbox_wallet' || typeof value.configured !== 'boolean' || value.environment !== 'sandbox'
    || value.asset !== 'USDT' || value.network !== 'polygon' || value.chainId !== 137 || value.serviceProvider !== 'TRANSAK' || value.canBroadcast !== false) return null;
  return { flow: 'sandbox_wallet', configured: value.configured, environment: 'sandbox', asset: 'USDT', network: 'polygon', chainId: 137, serviceProvider: 'TRANSAK', canBroadcast: false };
}
export function sandboxWalletStatus(value, now = Date.now()) {
  const capability = sandboxWalletCapabilities(value);
  if (!capability || !['linked', 'unlinked'].includes(value.status) || typeof value.verified !== 'boolean') return null;
  if (value.status === 'unlinked') return !value.verified && value.address === undefined && value.expiresAt === undefined
    ? { ...capability, status: 'unlinked', verified: false } : null;
  if (!sandboxWalletAddress(value.address) || (value.verified && (!instant(value.expiresAt) || Date.parse(value.expiresAt) <= now))
    || (!value.verified && value.expiresAt !== undefined)) return null;
  return { ...capability, status: 'linked', verified: value.verified, address: value.address.toLowerCase(), ...(value.verified ? { expiresAt: value.expiresAt } : {}) };
}
export function sandboxWalletChallengeInput(value) {
  return exact(value, ['address']) && sandboxWalletAddress(value.address) ? { address: value.address.toLowerCase() } : null;
}
export function sandboxWalletVerifyInput(value) {
  return exact(value, ['challengeId', 'signature']) && FUNDING_UUID.test(value.challengeId || '')
    && typeof value.signature === 'string' && /^0x(?:[0-9a-f]{128}|[0-9a-f]{130})$/i.test(value.signature)
    ? { challengeId: value.challengeId.toLowerCase(), signature: value.signature } : null;
}
export function sandboxWalletChallenge(value, expectedAddress = '', now = Date.now()) {
  if (!plain(value) || value.flow !== 'sandbox_wallet' || !FUNDING_UUID.test(value.challengeId || '') || !sandboxWalletAddress(value.address)
    || value.chainId !== 137 || value.method !== 'personal_sign' || !/^[0-9a-f]{64}$/.test(value.nonce || '')
    || !/^[0-9a-f]{64}$/.test(value.sessionContextHash || '') || !instant(value.issuedAt) || !instant(value.expiresAt)
    || Date.parse(value.issuedAt) > now + 30_000 || Date.parse(value.expiresAt) <= now
    || Date.parse(value.expiresAt) <= Date.parse(value.issuedAt) || Date.parse(value.expiresAt) - Date.parse(value.issuedAt) > 300_000
    || (expectedAddress && value.address.toLowerCase() !== expectedAddress.toLowerCase())) return null;
  const address = value.address.toLowerCase(), challengeId = value.challengeId.toLowerCase();
  const message = `wallet.mindblisspower.com wants you to verify control of this sandbox wallet:\n${address}\n\nMindbliss sandbox wallet ownership only. No transaction or transfer of funds.\nSession context: ${value.sessionContextHash}\n\nURI: ${SANDBOX_WALLET_ORIGIN}/dashboard/wallet-administrative\nVersion: 1\nChain ID: 137\nNonce: ${value.nonce}\nIssued At: ${value.issuedAt}\nExpiration Time: ${value.expiresAt}\nRequest ID: ${challengeId}`;
  if (value.message !== message) return null;
  return { flow: 'sandbox_wallet', challengeId, address, chainId: 137, nonce: value.nonce, issuedAt: value.issuedAt,
    expiresAt: value.expiresAt, sessionContextHash: value.sessionContextHash, message, method: 'personal_sign' };
}
export function sandboxWalletFundingInput(value) {
  if (!exact(value, ['requestId', 'country', 'sourceCurrencyCode', 'amount', 'paymentMethodType'])) return null;
  const amountValid = value.sourceCurrencyCode === 'USD' ? validFundingAmount(value.amount, 'administrative')
    : value.sourceCurrencyCode === 'MXN' && Number.isFinite(value.amount) && value.amount > 0 && value.amount <= 10_000_000
      && Math.abs(value.amount * 100 - Math.round(value.amount * 100)) < 0.000001;
  return FUNDING_UUID.test(value.requestId || '') && SANDBOX_WALLET_COUNTRIES.includes(value.country) && amountValid
    && ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(value.paymentMethodType)
    && fundingSourceSupported({ ...value, serviceProvider: 'TRANSAK' }, 'administrative')
    ? { requestId: value.requestId.toLowerCase(), country: value.country, sourceCurrencyCode: value.sourceCurrencyCode,
      amount: value.amount, paymentMethodType: value.paymentMethodType } : null;
}
export function sandboxWalletOptions(value) {
  const safe = administrativeSandboxOptions(value);
  return safe?.serviceProvider === 'TRANSAK' ? safe : null;
}
export function sandboxWalletAcknowledgement(value, input) {
  const safe = fundingAcknowledgement(value, 'administrative', input?.country || '', 'TRANSAK');
  if (!safe || value.serviceProvider !== 'TRANSAK' || value.destinationCurrencyCode !== 'USDT_POLYGON'
    || !sandboxWalletAddress(value.destination?.address) || value.destination?.asset !== 'USDT'
    || value.destination?.network !== 'polygon' || value.destination?.chainId !== 137
    || (input && (safe.checkoutReference.toLowerCase() !== input.requestId.toLowerCase() || safe.requestedAmount !== input.amount
      || safe.sourceCurrencyCode !== input.sourceCurrencyCode || value.paymentMethodType !== input.paymentMethodType))) return null;
  return { ...safe, serviceProvider: 'TRANSAK', destinationCurrencyCode: 'USDT_POLYGON', destination: { address: value.destination.address.toLowerCase(), asset: 'USDT', network: 'polygon', chainId: 137 }, paymentMethodType: value.paymentMethodType };
}
function transakSnapshot(value) {
  return SANDBOX_WALLET_COUNTRIES.includes(value?.country) && (value.sourceCurrencyCode === 'USD'
    || (value.country === 'MX' && value.sourceCurrencyCode === 'MXN'))
    && ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(value.paymentMethodType)
    && (value.serviceProvider === undefined || value.serviceProvider === 'TRANSAK')
    // The native confirmation DTO omits provider metadata after verifying the
    // pinned TRANSAK proof against its immutable sandbox attempt. A supplied
    // contradictory provider is still rejected; absence is not a failed proof.
    && (value.confirmation?.source !== 'meld_sandbox_api' || value.confirmation.serviceProvider === undefined || value.confirmation.serviceProvider === 'TRANSAK')
    && value.destination?.network === 'polygon' && value.destination?.chainId === 137;
}
export function sandboxWalletHistory(value) {
  const safe = fundingHistory(value, 'administrative');
  return safe && value.records.every(transakSnapshot) ? safe : null;
}
export function sandboxWalletFundingStatus(value) {
  const safe = fundingStatus(value, 'administrative');
  return safe && value.serviceProvider === 'TRANSAK' && transakSnapshot(value) ? { ...safe, serviceProvider: 'TRANSAK' } : null;
}
