import { profileSubjectHeader } from './member-profile.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { RECHARGE_PACKAGE_PATH, rechargePackageSnapshot } from './recharge-package-contract.mjs';

/** @param {string} subject
 * @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export async function readRechargePackage(subject, { signal, fetchImpl = fetch } = {}) {
  const owner = profileSubjectHeader(subject);
  if (!owner) throw new Error('recharge_package_forbidden');
  const response = await boundedServiceRequest(RECHARGE_PACKAGE_PATH, { method: 'GET', credentials: 'same-origin', signal,
    headers: { 'x-mindbliss-profile-subject': owner } }, fetchImpl);
  if (!response.ok) throw Object.assign(new Error('recharge_package_unavailable'), { status: response.status });
  const safe = rechargePackageSnapshot(response.data);
  if (!safe) throw new Error('recharge_package_unavailable');
  return safe;
}
