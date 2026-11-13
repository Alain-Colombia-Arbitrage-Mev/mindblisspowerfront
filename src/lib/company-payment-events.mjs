import { companyAtomic } from './company-payment-contract.mjs';
import { personalCompanyPaymentPolicy } from './personal-company-payment-values.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';

export const COMPANY_PAYMENT_CLIENT_EVENTS = Object.freeze(['wallet_prompt_opened', 'wallet_rejected', 'wallet_failed',
  'broadcast_uncertain', 'broadcast_observed', 'recovery_detected', 'registration_failed', 'verification_requested', 'verification_failed']);
export const COMPANY_PAYMENT_EVENT_CODES = Object.freeze(['user_rejected', 'wallet_changed', 'network_changed',
  'rpc_unavailable', 'registration_unavailable', 'verification_unavailable', 'recovery_unavailable', 'unknown']);
const canonicalEvents = ['snapshot', 'prepared', 'submitted', 'confirmed', 'failed', 'abandoned'];
const hashEvents = ['broadcast_observed', 'recovery_detected', 'registration_failed', 'verification_requested', 'verification_failed'];
const uuid = value => typeof value === 'string' && value.length === 36 && FUNDING_UUID.test(value) && value === value.toLowerCase();
const hash = value => typeof value === 'string' && /^0x[0-9a-f]{64}$/.test(value);
const date = value => typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
const object = value => value && typeof value === 'object' && !Array.isArray(value);

export function companyPaymentEventInput(value) {
  if (!object(value) || Object.keys(value).some(key => !['eventId', 'paymentId', 'attemptId', 'event', 'transactionHash', 'code'].includes(key))
    || !uuid(value.eventId) || !uuid(value.paymentId) || !COMPANY_PAYMENT_CLIENT_EVENTS.includes(value.event)
    || (Object.hasOwn(value, 'attemptId') && !uuid(value.attemptId))
    || (Object.hasOwn(value, 'code') && !COMPANY_PAYMENT_EVENT_CODES.includes(value.code))
    || (Object.hasOwn(value, 'transactionHash') && (!hash(value.transactionHash) || !hashEvents.includes(value.event)))
    || (value.event === 'broadcast_observed' && !hash(value.transactionHash))) return null;
  return { eventId: value.eventId, paymentId: value.paymentId, ...(value.attemptId ? { attemptId: value.attemptId } : {}),
    event: value.event, ...(value.transactionHash ? { transactionHash: value.transactionHash } : {}), ...(value.code ? { code: value.code } : {}) };
}

export function companyPaymentEventAck(value, input) {
  if (!object(value) || !input || value.walletKind !== 'personal' || value.source !== 'client_reported'
    || value.eventId !== input.eventId || value.paymentId !== input.paymentId || value.attemptId !== (input.attemptId ?? null)
    || value.event !== input.event || !date(value.recordedAt)) return null;
  return { walletKind: 'personal', eventId: value.eventId, paymentId: value.paymentId, attemptId: value.attemptId,
    source: 'client_reported', event: value.event, recordedAt: value.recordedAt };
}

export function companyPaymentEventView(value) {
  const policy = personalCompanyPaymentPolicy(value?.chainId);
  if (!object(value) || !policy || !uuid(value.eventId) || !uuid(value.paymentId)
    || !(value.attemptId === null || uuid(value.attemptId)) || !['canonical', 'client_reported'].includes(value.source)
    || typeof value.walletAddress !== 'string' || !/^0x[0-9a-f]{40}$/.test(value.walletAddress)
    || value.walletAddress === policy.recipientAddress || Object.entries(policy).some(([key, expected]) => value[key] !== expected)
    || !companyAtomic(value.amountAtomic) || !(value.transactionHash === null || hash(value.transactionHash))
    || !(value.code === null || COMPANY_PAYMENT_EVENT_CODES.includes(value.code)) || !date(value.recordedAt)) return null;
  if (value.source === 'canonical') {
    if (!canonicalEvents.includes(value.event) || value.attemptId !== null || value.code !== null
      || !['prepared', 'submitted', 'confirmed', 'failed'].includes(value.canonicalStatus)
      || (value.event !== 'snapshot' && value.canonicalStatus !== (value.event === 'abandoned' ? 'prepared' : value.event))
      || (['submitted', 'confirmed', 'failed'].includes(value.canonicalStatus) && !hash(value.transactionHash))
      || (value.canonicalStatus === 'prepared' && value.transactionHash !== null)) return null;
  } else if (!COMPANY_PAYMENT_CLIENT_EVENTS.includes(value.event) || value.canonicalStatus !== null
    || (value.transactionHash !== null && !hashEvents.includes(value.event))
    || (value.event === 'broadcast_observed' && value.transactionHash === null)) return null;
  return { eventId: value.eventId, paymentId: value.paymentId, attemptId: value.attemptId, source: value.source, event: value.event,
    ...policy, walletAddress: value.walletAddress, amountAtomic: value.amountAtomic, transactionHash: value.transactionHash,
    code: value.code, canonicalStatus: value.canonicalStatus, recordedAt: value.recordedAt };
}

export function companyPaymentEventPage(value, { paymentId = undefined, limit = 20 } = {}) {
  if (!object(value) || value.walletKind !== 'personal' || !Array.isArray(value.events) || value.events.length > limit
    || !(value.nextCursor === null || uuid(value.nextCursor)) || (paymentId && value.paymentId !== paymentId)) return null;
  const events = value.events.map(companyPaymentEventView);
  if (events.some(entry => !entry || (paymentId && entry.paymentId !== paymentId))
    || new Set(events.map(entry => entry.eventId)).size !== events.length
    || new Set(events.map(entry => entry.walletAddress)).size > 1
    || (value.nextCursor !== null && (!events.length || value.nextCursor !== events.at(-1).eventId))) return null;
  return { walletKind: 'personal', ...(paymentId ? { paymentId } : {}), events, nextCursor: value.nextCursor };
}

/** No arbitrary selector, owner, address or encoded duplicate reaches private transport. */
export function companyPaymentEventQuery(search, action) {
  if (typeof search !== 'string' || !['events', 'activity'].includes(action)) return null;
  const params = new URLSearchParams(search), keys = [...params.keys()];
  if (new Set(keys).size !== keys.length || keys.some(key => !['limit', 'cursor', ...(action === 'events' ? ['paymentId'] : [])].includes(key))) return null;
  const paymentId = params.get('paymentId'), cursor = params.get('cursor'), rawLimit = params.get('limit');
  if ((action === 'events' && !uuid(paymentId)) || (cursor !== null && !uuid(cursor))
    || (rawLimit !== null && (!/^(?:[1-9]|[1-4][0-9]|50)$/.test(rawLimit)))) return null;
  const normalized = new URLSearchParams();
  if (paymentId) normalized.set('paymentId', paymentId);
  if (rawLimit !== null) normalized.set('limit', rawLimit);
  if (cursor) normalized.set('cursor', cursor);
  const query = normalized.size ? `?${normalized}` : '';
  if (search !== query) return null;
  return { query, paymentId: paymentId || undefined, limit: rawLimit === null ? 20 : Number(rawLimit) };
}
