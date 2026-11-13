import { handleWalletFunding } from '@/lib/wallet-funding-bff.mjs';
import { walletPortalNotFound, walletPortalRequestAllowed } from '@/lib/wallet-portal-policy.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => {
  const url = new URL(request.url);
  return url.searchParams.get('walletKind') === 'administrative' && walletPortalRequestAllowed(url)
    ? handleWalletFunding(request, 'history') : walletPortalNotFound();
};
