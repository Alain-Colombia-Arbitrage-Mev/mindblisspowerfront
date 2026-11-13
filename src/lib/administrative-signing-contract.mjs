import { FUNDING_UUID } from './wallet-funding-contract.mjs';

export const ADMINISTRATIVE_SIGNING_PATH = '/api/member/administrative-wallet/signing';
export const ADMINISTRATIVE_TRANSFERS_PATH = '/api/member/administrative-wallet/transfers';
export const ADMINISTRATIVE_USDT_TOKEN = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f';
const address = /^0x[0-9a-f]{40}$/i, zero = `0x${'0'.repeat(40)}`;
const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key));
const uuid = value => typeof value === 'string' && value.length === 36 && FUNDING_UUID.test(value);
const instant = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
export const administrativeAddress = value => typeof value === 'string' && address.test(value) && value.toLowerCase() !== zero;

export function administrativeUsdtAmount(value) {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d{0,9})(?:\.\d{1,6})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.'), units = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
  if (units <= 0n || units > 1_000_000_000_000_000n) return null;
  const decimal = fraction.replace(/0+$/, '');
  return { amount: decimal ? `${whole}.${decimal}` : whole, amountUnits: String(units) };
}

export function administrativeSignerCapabilities(value) {
  if (!plain(value) || value.flow !== 'administrative_signing' || typeof value.configured !== 'boolean' || value.mode !== 'external'
    || value.environment !== 'sandbox' || value.chainId !== 137 || value.broadcastEnabled !== false || value.canBroadcast !== false || typeof value.canPrepareOfframp !== 'boolean') return null;
  return { flow: 'administrative_signing', configured: value.configured, mode: 'external', environment: 'sandbox', chainId: 137, broadcastEnabled: false, canBroadcast: false, canPrepareOfframp: value.canPrepareOfframp };
}

export function administrativeSignerStatus(value) {
  const capability = administrativeSignerCapabilities(value);
  if (!capability || !administrativeAddress(value.assignedAddress) || typeof value.verified !== 'boolean'
    || (value.verified && !instant(value.expiresAt))) return null;
  return { ...capability, assignedAddress: value.assignedAddress.toLowerCase(), verified: value.verified, ...(value.verified ? { expiresAt: value.expiresAt } : {}) };
}

export function administrativeSignerChallenge(value, expectedAddress = undefined) {
  if (!plain(value) || !uuid(value.challengeId) || !administrativeAddress(value.address) || value.chainId !== 137 || value.method !== 'personal_sign'
    || !instant(value.expiresAt) || typeof value.message !== 'string' || value.message.length < 80 || value.message.length > 4096
    || (expectedAddress !== undefined && value.address.toLowerCase() !== String(expectedAddress).toLowerCase())) return null;
  const prefix = `wallet.mindblisspower.com wants you to verify control of this administrative wallet:\n${value.address.toLowerCase()}\n\nMindbliss administrative wallet ownership only. No transaction or transfer of funds.\nSession context: `;
  const suffix = `\nExpiration Time: ${value.expiresAt}\nRequest ID: ${value.challengeId.toLowerCase()}`;
  const middle = value.message.startsWith(prefix) && value.message.endsWith(suffix) ? value.message.slice(prefix.length, -suffix.length) : '';
  if (!/^[0-9a-f]{64}\n\nURI: https:\/\/wallet\.mindblisspower\.com\/dashboard\/wallet-administrative\nVersion: 1\nChain ID: 137\nNonce: [0-9a-f]{64}\nIssued At: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(middle)) return null;
  return { challengeId: value.challengeId.toLowerCase(), address: value.address.toLowerCase(), chainId: 137, method: 'personal_sign', message: value.message, expiresAt: value.expiresAt };
}

export function administrativeSignerVerification(value) {
  return exact(value, ['challengeId', 'signature']) && uuid(value.challengeId) && typeof value.signature === 'string' && /^0x(?:[0-9a-f]{128}|[0-9a-f]{130})$/i.test(value.signature)
    ? { challengeId: value.challengeId.toLowerCase(), signature: value.signature } : null;
}

export function administrativeTransferInput(value) {
  const amount = administrativeUsdtAmount(value?.amount);
  return exact(value, ['requestId', 'recipient', 'amount']) && uuid(value.requestId) && administrativeAddress(value.recipient) && value.recipient.toLowerCase() !== ADMINISTRATIVE_USDT_TOKEN && amount
    ? { requestId: value.requestId.toLowerCase(), recipient: value.recipient.toLowerCase(), amount: amount.amount } : null;
}

export function administrativeTransferCalldata(recipient, amount) {
  const safe = administrativeUsdtAmount(amount);
  return administrativeAddress(recipient) && safe ? `0xa9059cbb${recipient.slice(2).toLowerCase().padStart(64, '0')}${BigInt(safe.amountUnits).toString(16).padStart(64, '0')}` : null;
}

export function administrativeTransferDraft(value) {
  const source = value?.source, tx = value?.transaction, safeAmount = administrativeUsdtAmount(value?.amount);
  if (!plain(value) || value.flow !== 'administrative_transfer' || value.status !== 'draft' || value.mode !== 'dry_run' || value.broadcastEnabled !== false || value.canBroadcast !== false
    || !uuid(value.draftReference) || !safeAmount || safeAmount.amount !== value.amount || !administrativeAddress(source?.address) || source.asset !== 'USDT'
    || source.network !== 'polygon' || source.chainId !== 137 || !administrativeAddress(value.recipient) || value.recipient.toLowerCase() === source.address.toLowerCase()
    || value.recipient.toLowerCase() === ADMINISTRATIVE_USDT_TOKEN || tx?.chainId !== 137
    || tx.from !== source.address.toLowerCase() || tx.to !== ADMINISTRATIVE_USDT_TOKEN || tx.value !== '0x0'
    || tx.data !== administrativeTransferCalldata(value.recipient, value.amount) || typeof value.preparationHash !== 'string' || !/^[0-9a-f]{64}$/.test(value.preparationHash)
    || !instant(value.createdAt) || !instant(value.expiresAt) || Date.parse(value.expiresAt) <= Date.parse(value.createdAt)) return null;
  return { flow: 'administrative_transfer', status: 'draft', mode: 'dry_run', broadcastEnabled: false, canBroadcast: false, draftReference: value.draftReference.toLowerCase(),
    source: { address: source.address.toLowerCase(), asset: 'USDT', network: 'polygon', chainId: 137 }, recipient: value.recipient.toLowerCase(), amount: safeAmount.amount,
    transaction: { chainId: 137, from: tx.from, to: ADMINISTRATIVE_USDT_TOKEN, data: tx.data, value: '0x0' }, preparationHash: value.preparationHash, createdAt: value.createdAt, expiresAt: value.expiresAt };
}

export function administrativeTransferSnapshot(value) {
  const safe = administrativeTransferDraft(value);
  return safe ? JSON.stringify({ version: 1, chainId: 137, from: safe.source.address, to: ADMINISTRATIVE_USDT_TOKEN, recipient: safe.recipient,
    amountUnits: administrativeUsdtAmount(safe.amount).amountUnits, data: safe.transaction.data, value: '0x0' }) : null;
}

export function administrativeTransferHistory(value) {
  if (!plain(value) || value.flow !== 'administrative_transfer' || value.mode !== 'dry_run' || value.broadcastEnabled !== false || value.canBroadcast !== false
    || !Array.isArray(value.records) || value.records.length > 50) return null;
  const records = value.records.map(administrativeTransferDraft);
  if (records.some(record => !record) || new Set(records.map(record => record.draftReference)).size !== records.length) return null;
  return { flow: 'administrative_transfer', mode: 'dry_run', broadcastEnabled: false, canBroadcast: false, records };
}
