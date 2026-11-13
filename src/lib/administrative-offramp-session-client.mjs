import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { ADMINISTRATIVE_OFFRAMP_PATH as path, administrativeOfframpPrepareInput, administrativeOfframpAcknowledgement,
  administrativeOfframpSource, administrativeOfframpStatus, administrativeOfframpHistory, administrativeOfframpReference, administrativeOfframpUnits } from './administrative-offramp-session-contract.mjs';

async function request(target, { signal = undefined, body = undefined } = {}) {
  const deadline = browserRequestDeadline(signal, 25_000);
  try { if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const response = await fetch(target, { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline.signal,
      ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const text = await response.text(); if (text.length > 131_072) throw Error('administrative_offramp_unavailable');
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    let data; try { data = JSON.parse(text); } catch { throw Error('administrative_offramp_unavailable'); }
    if (!response.ok) throw Object.assign(Error(typeof data?.error === 'string' && /^\w{1,80}$/.test(data.error) ? data.error : 'administrative_offramp_unavailable'), { status: response.status });
    return data;
  } finally { deadline.dispose(); }
}
const address = value => administrativeOfframpSource({ address: value, asset: 'USDT', network: 'polygon', chainId: 137 })?.address;
export async function prepareAdministrativeOfframpSession(input, expectedAddress, { signal = undefined } = {}) {
  const body = administrativeOfframpPrepareInput(input), source = address(expectedAddress);
  if (!body || !source) throw Error('invalid_request');
  const safe = administrativeOfframpAcknowledgement(await request(`${path}/prepare`, { body, signal }));
  if (!safe || safe.reference !== body.requestId || safe.source.address !== source || safe.country !== body.country
    || safe.destinationCurrencyCode !== body.destinationCurrencyCode || safe.serviceProvider !== body.serviceProvider || safe.paymentMethodType !== body.paymentMethodType
    || administrativeOfframpUnits(safe.sourceAmount) !== administrativeOfframpUnits(body.amount)) throw Error('administrative_offramp_unavailable');
  return safe;
}
export async function readAdministrativeOfframpSession(reference, expectedAddress, { signal = undefined } = {}) {
  const source = address(expectedAddress);
  if (!administrativeOfframpReference(reference) || !source) throw Error('invalid_request');
  const safeRef = reference.toLowerCase();
  const result = administrativeOfframpStatus(await request(`${path}/status?reference=${safeRef}`, { signal }));
  if (!result || result.reference !== safeRef || result.source.address !== source) throw Error('administrative_offramp_unavailable');
  return result;
}
export async function readAdministrativeOfframpSessionHistory(expectedAddress, { signal = undefined } = {}) {
  const source = address(expectedAddress); if (!source) throw Error('invalid_request');
  const result = administrativeOfframpHistory(await request(`${path}/history`, { signal }));
  if (!result || result.records.some(item => item.source.address !== source)) throw Error('administrative_offramp_unavailable');
  return result;
}
