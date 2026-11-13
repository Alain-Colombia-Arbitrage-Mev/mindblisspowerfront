import { validMemberProfile, memberProfileUpdateMatches, profileSubjectHeader, readMemberProfileJson } from '../../../lib/member-profile.mjs';
import { browserRequestDeadline } from '../../../lib/browser-request-deadline.mjs';

export function profileForm(data) {
  if (!validMemberProfile(data)) throw new Error('invalid_profile');
  const form = { name: [data.first_name, data.last_name].filter(Boolean).join(' ').trim(),
    phone: data.phone, country: data.country, payout_wallet_usdc: data.payout_wallet_usdc };
  for (const field of ['sponsor_name', 'sponsor_referral_code', 'referral_code']) if (Object.hasOwn(data, field)) form[field] = data[field];
  return form;
}

export function profileOwnerKey(session) {
  const email = typeof session?.email === 'string' ? session.email.trim().toLowerCase() : '';
  return email && profileSubjectHeader(session?.subject) ? JSON.stringify([session.subject, email]) : '';
}

export function normalizeProfilePhone(value) {
  if (typeof value !== 'string' || value.length > 40 || !/^[+\d ()-]*$/.test(value)) return '';
  const phone = value.trim().replace(/[ ()-]/g, '');
  return /^\+[1-9]\d{6,14}$/.test(phone) ? phone : '';
}

/** @param {'GET'|'POST'} method @param {Record<string, string>|undefined} body @param {{fetchImpl?: typeof fetch, signal?: AbortSignal, subject?: string}} options */
export async function requestProfile(method, body, { fetchImpl = fetch, signal, subject = undefined } = {}) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const subjectHeader = subject === undefined ? '' : profileSubjectHeader(subject);
  if (subject !== undefined && !subjectHeader) throw Error('profile_owner_required');
  const deadline = browserRequestDeadline(signal, 12000);
  try {
  const response = await fetchImpl('/api/member/profile', { method, credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline.signal,
    headers: { ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}), ...(subjectHeader ? { 'x-mindbliss-profile-subject': subjectHeader } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
  const data = await readMemberProfileJson(response.body, deadline.signal);
  if (!response.ok) throw Object.assign(new Error(data?.error === 'member_profile_owner_changed' ? 'member_profile_owner_changed' : 'profile_unavailable'), { status: response.status });
  if (method === 'GET' && validMemberProfile(data)) return profileForm(data);
  if (method === 'POST' && memberProfileUpdateMatches(data, body)) return profileForm(data.profile);
  throw new Error('profile_outcome_unconfirmed');
  } finally { deadline.dispose(); }
}
