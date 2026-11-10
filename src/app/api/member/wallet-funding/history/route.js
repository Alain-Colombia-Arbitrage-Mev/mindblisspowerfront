import { handleWalletFunding } from '@/lib/wallet-funding-bff.mjs';
import { walletPortalNotFound, walletPortalRequestAllowed } from '@/lib/wallet-portal-policy.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => walletPortalRequestAllowed(new URL(request.url))
  ? handleWalletFunding(request, 'history') : walletPortalNotFound();
