export const SMS_CONSENT_VERSION = 'sms-auth-v1';
export const SMS_RESEND_SECONDS = 60;

export function optInPhone(value) {
  if (typeof value !== 'string' || value.length > 40 || !/^[+\d ()-]+$/.test(value)) return '';
  const phone = value.trim().replace(/[ ()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : '';
}

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function phoneOptInStatus(value) {
  if (!record(value) || value.error || typeof value.available !== 'boolean' || value.consentVersion !== SMS_CONSENT_VERSION
    || typeof value.optedIn !== 'boolean' || typeof value.phoneNumberVerified !== 'boolean'
    || !(value.phoneNumber === null || (typeof value.phoneNumber === 'string' && optInPhone(value.phoneNumber) === value.phoneNumber))
    || (value.phoneNumberVerified && value.phoneNumber === null)) throw new Error('invalid_phone_status');
  return {
    available: value.available, consentVersion: value.consentVersion, optedIn: value.optedIn,
    phoneNumber: value.phoneNumber, phoneNumberVerified: value.phoneNumberVerified,
  };
}

export function phoneOptInRequest(action, input = {}) {
  if (action === 'status') return { path: '/api/auth/phone-number/opt-in', method: 'GET' };
  if (action === 'revoke') return { path: '/api/auth/phone-number/revoke-consent', method: 'POST', body: {} };
  const phoneNumber = optInPhone(input.phoneNumber);
  if (!phoneNumber) throw new Error('invalid_phone');
  if (action === 'send') {
    if (input.consent !== true || input.consentVersion !== SMS_CONSENT_VERSION) throw new Error('consent_required');
    return { path: '/api/auth/phone-number/send-otp', method: 'POST',
      body: { phoneNumber, consent: true, consentVersion: SMS_CONSENT_VERSION } };
  }
  if (action === 'verify') {
    if (typeof input.code !== 'string' || !/^\d{6}$/.test(input.code)) throw new Error('invalid_code');
    return { path: '/api/auth/phone-number/verify', method: 'POST',
      body: { phoneNumber, code: input.code, updatePhoneNumber: true, disableSession: true } };
  }
  throw new Error('invalid_action');
}

export function phoneOptInAcknowledged(action, payload) {
  if (!record(payload) || payload.error || payload.ok !== true) return false;
  if (action === 'send') return Number.isSafeInteger(payload.resendAfter) && payload.resendAfter >= SMS_RESEND_SECONDS && payload.resendAfter <= 86400;
  if (action === 'verify') return payload.phoneNumberVerified === true && payload.optedIn === true;
  if (action === 'revoke') return payload.optedIn === false;
  return false;
}

export function phoneOptInRetrySeconds(response, payload = {}) {
  const raw = response.headers?.get('retry-after');
  const seconds = Number(raw || payload.resendAfter || payload.retryAfterSec);
  return Number.isFinite(seconds) && seconds > 0 ? Math.max(SMS_RESEND_SECONDS, Math.min(86400, Math.ceil(seconds))) : SMS_RESEND_SECONDS;
}

export function phoneOptInFailure(status, action = 'status') {
  if (status === 401) return 'Inicia sesión con tu correo verificado para gestionar la validación opcional por SMS.';
  if (status === 429) return 'Has realizado varios intentos. Espera antes de solicitar otro código.';
  if (status === 403) return 'No fue posible autorizar esta solicitud. Vuelve a entrar con tu correo y revisa tu acceso.';
  if (status >= 500 || action === 'status') return 'No pudimos consultar el servicio de validación SMS. Intenta más tarde; tu acceso por correo no cambia.';
  if (action === 'verify') return 'El código no es válido o ha vencido. Revisa los seis dígitos y utiliza el código más reciente.';
  return 'No pudimos confirmar la operación. Revisa el estado antes de volver a intentarla.';
}

// A bounded, same-origin transport. It never retries a mutation or stores OTPs,
// session cookies, phone numbers or provider responses in browser storage.
/** @param {string} action @param {Record<string, unknown>} input @param {{fetchImpl?: typeof fetch, signal?: AbortSignal}} options */
export async function requestPhoneOptIn(action, input = {}, { fetchImpl = fetch, signal } = {}) {
  const contract = phoneOptInRequest(action, input);
  const deadline = signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000);
  const response = await fetchImpl(contract.path, {
    method: contract.method, credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline,
    ...(contract.body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contract.body) } : {}),
  });
  const reader = response.body?.getReader();
  if (!reader) throw new Error('invalid_phone_response');
  const chunks = [];
  let bytes = 0;
  const aborted = () => { void reader.cancel().catch(() => {}); };
  deadline.addEventListener('abort', aborted, { once: true });
  try {
    if (deadline.aborted) { aborted(); throw new Error('phone_request_aborted'); }
    while (true) {
      const { done, value } = await reader.read();
      if (deadline.aborted) throw new Error('phone_request_aborted');
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) { await reader.cancel(); throw new Error('invalid_phone_response'); }
      chunks.push(value);
    }
    const raw = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength; }
    const payload = JSON.parse(new TextDecoder().decode(raw));
    if (!record(payload)) throw new Error('invalid_phone_response');
    return { response, payload };
  } finally {
    deadline.removeEventListener('abort', aborted);
    reader.releaseLock();
  }
}
