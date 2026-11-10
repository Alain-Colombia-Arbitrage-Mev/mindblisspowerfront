import { handleWalletLink } from '@/lib/wallet-link-bff.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => handleWalletLink(request, 'status');
