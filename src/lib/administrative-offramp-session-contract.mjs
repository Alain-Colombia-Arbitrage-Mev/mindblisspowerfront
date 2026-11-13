import { administrativeOfframpSelection } from './administrative-offramp-contract.mjs';

export const ADMINISTRATIVE_OFFRAMP_PATH = '/api/member/administrative-wallet/offramp';
export const ADMINISTRATIVE_OFFRAMP_ORIGIN = 'https://wallet.mindblisspower.com';
const reference = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
export const administrativeOfframpReference = reference;
const code = value => typeof value === 'string' && /^[A-Z0-9_]{2,64}$/.test(value);
const opaque = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(value) && !['.', '..'].includes(value);
const instant = value => typeof value === 'string' && value.length <= 64 && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const address = value => typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value);
export function administrativeOfframpUnits(value) {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d{0,9})(?:\.\d{1,6})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.'), units = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
  return units > 0n && units <= 1_000_000_000_000_000n ? units : null;
}
export function administrativeOfframpPrepareInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 6
    || Object.keys(value).some(key => !['requestId', 'country', 'destinationCurrencyCode', 'amount', 'serviceProvider', 'paymentMethodType'].includes(key))
    || !reference(value.requestId) || !administrativeOfframpSelection(value.country, value.destinationCurrencyCode)
    || !administrativeOfframpUnits(value.amount) || !code(value.serviceProvider) || !code(value.paymentMethodType)) return null;
  return { requestId: value.requestId.toLowerCase(), country: value.country, destinationCurrencyCode: value.destinationCurrencyCode,
    amount: value.amount, serviceProvider: value.serviceProvider, paymentMethodType: value.paymentMethodType };
}
export function administrativeOfframpSource(value) {
  return value && address(value.address) && value.asset === 'USDT' && value.network === 'polygon' && value.chainId === 137
    ? { address: value.address.toLowerCase(), asset: 'USDT', network: 'polygon', chainId: 137 } : null;
}
function execution(value) {
  return value?.canBroadcast === false && value?.canFund === false && value?.mode === 'sandbox_no_funds'
    ? { canBroadcast: false, canFund: false, mode: 'sandbox_no_funds' } : null;
}
export function administrativeOfframpSessionUrl(value) {
  // Reject control characters in the unparsed bearer URL.
  // eslint-disable-next-line no-control-regex
  if (typeof value !== 'string' || value.length > 8192 || /[\\%#\u0000-\u0020\u007f]/.test(value)
    || !/^https:\/\/sb\.meldcrypto\.com\/?\?/.test(value)) return null; // Reject alternate/encoded hosts before URL normalization.
  try { const url = new URL(value), token = url.searchParams.get('token');
    return url.origin === 'https://sb.meldcrypto.com' && url.pathname === '/' && !url.username && !url.password && !url.hash
      && token && token.length <= 7000 && /^[A-Za-z0-9_.~-]+$/.test(token) && url.search === `?token=${token}` ? url.href : null;
  } catch { return null; }
}
function base(value) {
  const source = administrativeOfframpSource(value?.source), mode = execution(value?.execution);
  if (!value || value.flow !== 'administrative_offramp' || value.walletKind !== 'administrative' || value.environment !== 'sandbox'
    || !reference(value.reference) || !source || !mode || !administrativeOfframpUnits(value.sourceAmount)
    || !administrativeOfframpSelection(value.country, value.destinationCurrencyCode) || !code(value.serviceProvider) || !code(value.paymentMethodType)
    || !instant(value.createdAt) || (value.quotedDestinationAmount !== null && (typeof value.quotedDestinationAmount !== 'number'
      || !Number.isFinite(value.quotedDestinationAmount) || value.quotedDestinationAmount <= 0 || value.quotedDestinationAmount > 1_000_000_000))) return null;
  return { flow: 'administrative_offramp', walletKind: 'administrative', environment: 'sandbox', reference: value.reference.toLowerCase(),
    source, sourceAmount: value.sourceAmount, country: value.country, destinationCurrencyCode: value.destinationCurrencyCode,
    serviceProvider: value.serviceProvider, paymentMethodType: value.paymentMethodType,
    quotedDestinationAmount: value.quotedDestinationAmount, createdAt: value.createdAt, execution: mode };
}
export function administrativeOfframpAcknowledgement(value) {
  const common = base(value), checkoutUrl = administrativeOfframpSessionUrl(value?.checkoutUrl);
  return common && value.status === 'session_created' && checkoutUrl ? { ...common, status: 'session_created', checkoutUrl } : null;
}
export function administrativeOfframpStatus(value) {
  const common = base(value), proof = value?.confirmation;
  if (!common || !['initiated', 'session_created', 'unavailable'].includes(value.requestStatus) || proof?.testMode !== true) return null;
  let confirmation;
  if (proof.source === 'none' && proof.state === 'unconfirmed') confirmation = { state: 'unconfirmed', source: 'none', testMode: true };
  else if (proof.source === 'meld_sandbox_api' && ['pending', 'confirmed', 'failed'].includes(proof.state)
    && opaque(proof.transactionId) && code(proof.providerStatus) && instant(proof.updatedAt)) {
    const allowed = { confirmed: ['SETTLED'], failed: ['FAILED', 'DECLINED', 'CANCELLED', 'REFUNDED', 'VOIDED', 'AUTHORIZATION_EXPIRED'],
      pending: ['PENDING_CREATED', 'PENDING', 'PROCESSING', 'AUTHORIZED', 'ACCEPTED', 'PARTIALLY_SETTLED', 'SETTLING', 'TWO_FA_REQUIRED', 'TWO_FA_PROVIDED', 'ERROR'] };
    if (!allowed[proof.state].includes(proof.providerStatus) || (proof.state === 'confirmed' && !administrativeOfframpUnits(proof.destinationAmount))) return null;
    confirmation = { state: proof.state, source: 'meld_sandbox_api', testMode: true, transactionId: proof.transactionId,
      providerStatus: proof.providerStatus, updatedAt: proof.updatedAt, ...(proof.state === 'confirmed' ? { destinationAmount: proof.destinationAmount } : {}) };
  } else return null;
  return { ...common, requestStatus: value.requestStatus, confirmation };
}
export function administrativeOfframpHistory(value) {
  if (!value || value.flow !== 'administrative_offramp' || value.walletKind !== 'administrative' || value.environment !== 'sandbox'
    || !Array.isArray(value.records) || value.records.length > 50) return null;
  const records = value.records.map(administrativeOfframpStatus);
  return records.some(item => !item) || new Set(records.map(item => item.reference)).size !== records.length ? null
    : { flow: 'administrative_offramp', walletKind: 'administrative', environment: 'sandbox', records };
}
export function administrativeOfframpReturn(search) {
  if (typeof search !== 'string' || search.length > 2048) return null;
  const values = new URLSearchParams(search).getAll('offrampReference');
  return values.length === 1 && reference(values[0]) ? values[0].toLowerCase() : null;
}
