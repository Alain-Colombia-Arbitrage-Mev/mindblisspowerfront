import { handleWalletLink } from '@/lib/wallet-link-bff.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleWalletLink(request, 'challenge');
