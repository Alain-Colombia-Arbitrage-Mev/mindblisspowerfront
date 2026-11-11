import { handlePersonalSolana } from '@/lib/solana-wallet-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handlePersonalSolana(request, 'payments', 'prepare');
