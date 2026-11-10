export const REFERRAL_PUBLIC_ORIGIN = 'https://mindblisspower.com';

// Configuration, not Host/X-Forwarded-Host or an inbound redirect parameter,
// selects the public destination. Keep this request-local on Workers.
/** @param {{AUTH_PUBLIC_ORIGIN?: string, REFERRAL_BASE_URL?: string}} [env] */
export function referralPublicOrigin(env = {}) {
  const configured = env.AUTH_PUBLIC_ORIGIN || env.REFERRAL_BASE_URL || REFERRAL_PUBLIC_ORIGIN;
  const url = new URL(configured);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('invalid_referral_origin');
  }
  return url.origin;
}

export function referralLinkCode(value) {
  if (typeof value !== 'string') return '';
  const code = value.trim();
  return code && code.length <= 64 && !/[\u0000-\u0020\u007f]/.test(code) ? code : '';
}

export function referralBrowserOrigin() {
  try {
    return referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: globalThis.window?.location?.origin });
  } catch { return REFERRAL_PUBLIC_ORIGIN; }
}

export function buildReferralLink(value, origin = referralBrowserOrigin()) {
  const code = referralLinkCode(value);
  if (!code) return '';
  const base = referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: origin });
  const url = new URL('/register', base);
  url.searchParams.set('ref', code);
  return url.toString();
}

// Old API links may have an obsolete host or a client-selected side. The code
// is the only opaque hint we retain: binary placement is selected atomically by
// the backend when the paid membership is activated.
export function referralLinkFrom(data, origin = referralBrowserOrigin()) {
  if (data?.positioned !== true) return '';
  return buildReferralLink(data.code, origin);
}
