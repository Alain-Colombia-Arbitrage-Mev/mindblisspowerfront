import { handleAdministrativeWallet } from '@/lib/administrative-wallet-bff.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => handleAdministrativeWallet(request, 'status');
