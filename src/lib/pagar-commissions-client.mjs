import { profileSubjectHeader } from './member-profile.mjs';
import { PAGAR_COMMISSIONS_PATH, pagarCommissionsSnapshot, pagarCommissionWeek } from './pagar-commissions-contract.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';

/** @param {string} subject
 * @param {{before?: string | null, signal?: AbortSignal, fetchImpl?: typeof fetch}} [options]
 */
export async function readPagarCommissions(subject, { before = null, signal, fetchImpl = fetch } = {}) {
  const owner = profileSubjectHeader(subject);
  if (!owner || (before !== null && !pagarCommissionWeek(before))) throw new Error('pagar_commissions_invalid_request');
  const query = before === null ? '' : `?before=${before}`;
  const response = await boundedServiceRequest(PAGAR_COMMISSIONS_PATH + query, {
    method: 'GET', credentials: 'same-origin', signal, headers: { 'x-mindbliss-profile-subject': owner },
  }, fetchImpl);
  if (!response.ok) throw Object.assign(new Error('pagar_commissions_unavailable'), { status: response.status });
  const projection = pagarCommissionsSnapshot(response.data, before);
  if (!projection) throw new Error('pagar_commissions_unavailable');
  return projection;
}
