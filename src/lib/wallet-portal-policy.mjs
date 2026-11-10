import { normalizedApplicationPath } from './domain-routing.js';

export const WALLET_PORTAL_ORIGIN = 'https://wallet.mindblisspower.com';

/** This branch exposes administrative funding only, including encoded paths. */
export function walletPortalRequestAllowed(url) {
  const path = normalizedApplicationPath(url.pathname);
  if (path === null) return false;
  if (/^\/dashboard\/wallet-personal(?:\/|$)/i.test(path)
    || /^\/api\/member\/(?:wallet-link|onramp)(?:\/|$)/i.test(path)
    || /^\/api\/member\/wallet-funding\/personal(?:\/|$)/i.test(path)) return false;
  if (/^\/api\/member\/wallet-funding\/history\/?$/i.test(path)) {
    return url.searchParams.getAll('walletKind').length === 1
      && url.searchParams.get('walletKind') === 'administrative'
      && [...url.searchParams.keys()].every(key => key === 'walletKind');
  }
  return true;
}

export const walletPortalNotFound = () => Response.json({ error: 'not_found' }, {
  status: 404, headers: { 'Cache-Control': 'private, no-store' },
});
