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

export function buildReferralLinks(value, origin = referralBrowserOrigin()) {
  const code = referralLinkCode(value);
  if (!code) return { left: '', right: '' };
  const base = referralPublicOrigin({ AUTH_PUBLIC_ORIGIN: origin });
  const link = side => {
    const url = new URL('/register', base);
    url.searchParams.set('ref', code);
    url.searchParams.set('side', side);
    return url.toString();
  };
  return { left: link('L'), right: link('R') };
}

// Old API links may have an obsolete host. The code is the opaque hint; never
// copy an arbitrary returned URL, credential, redirect, email or extra query.
export function referralLinksFrom(data, origin = referralBrowserOrigin()) {
  if (data?.positioned !== true) return { left: '', right: '' };
  return buildReferralLinks(data.code, origin);
}
