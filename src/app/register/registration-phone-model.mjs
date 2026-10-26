import { registrationEmail, registrationPhone, REGISTRATION_PHONE_LIFETIME_SECONDS } from './registration-model.mjs';
export { registrationPhone, REGISTRATION_PHONE_LIFETIME_SECONDS } from './registration-model.mjs';

export const REGISTRATION_PHONE_CONSENT = 'registration-phone-v1';
export const REGISTRATION_PHONE_RESEND_SECONDS = 60;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const flowIdValue = value => typeof value === 'string' && /^[A-Za-z0-9_-]{22,80}$/.test(value);

export function registrationPhoneRequest(action, input = {}) {
  const email = registrationEmail(input.email);
  const phoneNumber = registrationPhone(input.phoneNumber);
  if (!email || !phoneNumber) throw new Error('invalid_registration_contact');
  if (action === 'send') {
    if (input.consent !== true || input.consentVersion !== REGISTRATION_PHONE_CONSENT) throw new Error('registration_phone_consent_required');
    return { path: '/api/auth/register/phone/send', body: { email, phoneNumber, consent: true, consentVersion: REGISTRATION_PHONE_CONSENT } };
  }
  if (action !== 'verify' || !flowIdValue(input.flowId) || typeof input.code !== 'string' || !/^\d{6}$/.test(input.code)) throw new Error('invalid_registration_phone_code');
  return { path: '/api/auth/register/phone/verify', body: { email, phoneNumber, flowId: input.flowId, code: input.code } };
}

export function registrationPhoneAcknowledged(action, payload, input = {}) {
  if (!record(payload) || payload.error || payload.code || payload.ok !== true) return false;
  if (action === 'send') return flowIdValue(payload.flowId) && payload.resendAfter === REGISTRATION_PHONE_RESEND_SECONDS
    && payload.expiresIn === REGISTRATION_PHONE_LIFETIME_SECONDS;
  if (action !== 'verify') return false;
  return payload.verified === true && payload.purpose === 'registration'
    && payload.email === registrationEmail(input.email) && payload.phoneNumber === registrationPhone(input.phoneNumber)
    && Boolean(payload.email && payload.phoneNumber);
}

export function registrationPhoneRetrySeconds(response, payload = {}) {
  const raw = Number(response.headers?.get('retry-after') || payload.resendAfter || payload.retryAfter);
  return Number.isFinite(raw) && raw > 0 ? Math.max(REGISTRATION_PHONE_RESEND_SECONDS, Math.min(86400, Math.ceil(raw))) : REGISTRATION_PHONE_RESEND_SECONDS;
}

export function registrationPhoneFailure(status, action) {
  if (status === 429) return 'Has realizado varios intentos. Espera antes de solicitar o verificar otro código SMS.';
  if (status >= 500) return 'La validación del teléfono no está disponible. Intenta más tarde; no se creó una cuenta.';
  if (status === 403) return 'No pudimos autorizar la validación. Vuelve a los datos de registro y revisa tu correo y teléfono.';
  return action === 'verify' ? 'El código SMS no es válido o venció. Utiliza el código más reciente o solicita uno nuevo.'
    : 'No pudimos confirmar el envío del SMS. Revisa el número e intenta de nuevo cuando termine la espera.';
}

// Registration-only transport. The verification proof is a server-owned
// HttpOnly cookie: it is never read, returned, persisted or passed by this UI.
/** @param {string} action @param {Record<string, unknown>} input @param {{fetchImpl?: typeof fetch, signal?: AbortSignal}} options */
export async function requestRegistrationPhone(action, input = {}, { fetchImpl = fetch, signal } = {}) {
  const contract = registrationPhoneRequest(action, input);
  const deadline = signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000);
  if (deadline.aborted) throw new DOMException('Request cancelled', 'AbortError');
  const response = await fetchImpl(contract.path, {
    method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contract.body),
  });
  const reader = response.body?.getReader();
  if (!reader) throw new Error('invalid_registration_phone_response');
  const chunks = [];
  let total = 0;
  const aborted = () => { void reader.cancel().catch(() => {}); };
  deadline.addEventListener('abort', aborted, { once: true });
  try {
    if (deadline.aborted) { aborted(); throw new DOMException('Request cancelled', 'AbortError'); }
    while (true) {
      const { done, value } = await reader.read();
      if (deadline.aborted) throw new DOMException('Request cancelled', 'AbortError');
      if (done) break;
      total += value.byteLength;
      if (total > 8192) { await reader.cancel(); throw new Error('invalid_registration_phone_response'); }
      chunks.push(value);
    }
    const raw = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength; }
    const payload = JSON.parse(new TextDecoder().decode(raw));
    if (!record(payload)) throw new Error('invalid_registration_phone_response');
    return { response, payload };
  } finally { deadline.removeEventListener('abort', aborted); reader.releaseLock(); }
}
