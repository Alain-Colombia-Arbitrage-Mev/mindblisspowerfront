import { handleWalletFunding } from '@/lib/wallet-funding-bff.mjs';
import { retiredWalletRoute } from '@/lib/retired-wallet-route.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => new URL(request.url).searchParams.getAll('walletKind').includes('administrative')
  ? retiredWalletRoute() : handleWalletFunding(request, 'history');
