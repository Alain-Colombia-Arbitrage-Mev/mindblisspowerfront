import { handleWalletFunding } from '@/lib/wallet-funding-bff.mjs';

export const dynamic = 'force-dynamic';
export function GET(request) { return handleWalletFunding(request, 'personal-status'); }
