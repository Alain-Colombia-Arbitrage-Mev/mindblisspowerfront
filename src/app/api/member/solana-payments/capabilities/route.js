import { handlePersonalSolana } from '@/lib/solana-wallet-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => handlePersonalSolana(request, 'payments', 'capabilities');
