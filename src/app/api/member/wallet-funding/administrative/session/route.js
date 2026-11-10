import { handleWalletFunding } from '@/lib/wallet-funding-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleWalletFunding(request, 'administrative');
