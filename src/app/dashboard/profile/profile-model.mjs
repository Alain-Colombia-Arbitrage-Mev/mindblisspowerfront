import { validMemberProfile, validMemberProfileUpdate, readMemberProfileJson } from '../../../lib/member-profile.mjs';

export function profileForm(data) {
  if (!validMemberProfile(data)) throw new Error('invalid_profile');
  return { name: [data.first_name, data.last_name].filter(Boolean).join(' ').trim(),
    phone: data.phone, country: data.country, payout_wallet_usdc: data.payout_wallet_usdc };
}

/** @param {'GET'|'POST'} method @param {Record<string, string>|undefined} body @param {{fetchImpl?: typeof fetch, signal?: AbortSignal}} options */
export async function requestProfile(method, body, { fetchImpl = fetch, signal } = {}) {
  const deadline = signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000);
  const response = await fetchImpl('/api/member/profile', { method, credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline,
    ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = await readMemberProfileJson(response.body, deadline);
  if (!response.ok) throw new Error('profile_unavailable');
  if (method === 'GET' && validMemberProfile(data)) return profileForm(data);
  if (method === 'POST' && validMemberProfileUpdate(data)) return profileForm(data.profile);
  throw new Error('profile_outcome_unconfirmed');
}
