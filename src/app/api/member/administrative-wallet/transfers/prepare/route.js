import { handleAdministrativeSigning } from '@/lib/administrative-signing-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleAdministrativeSigning(request, 'prepare');
