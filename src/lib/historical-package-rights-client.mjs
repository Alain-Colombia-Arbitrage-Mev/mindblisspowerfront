import { profileSubjectHeader } from './member-profile.mjs';
import { historicalPackageRights } from './historical-package-rights-contract.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';

/** One owned read. Recognition never grants a wallet, payout or investment action.
 * @param {string} subject
 * @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options]
 */
export async function readHistoricalPackageRights(subject, { signal, fetchImpl = fetch } = {}) {
  const owner = profileSubjectHeader(subject);
  if (!owner) throw new Error('member_package_rights_forbidden');
  const response = await boundedServiceRequest('/api/member/package-rights', { method: 'GET', credentials: 'same-origin', signal,
    headers: { 'x-mindbliss-profile-subject': owner } }, fetchImpl);
  if (!response.ok) throw Object.assign(new Error(typeof response.data?.error === 'string' && /^member_package_rights_[a-z_]{1,48}$/.test(response.data.error)
    ? response.data.error : 'member_package_rights_unavailable'), { status: response.status });
  const safe = historicalPackageRights(response.data);
  if (!safe) throw new Error('member_package_rights_unavailable');
  return safe;
}
