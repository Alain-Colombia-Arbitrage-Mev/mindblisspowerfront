import { handleAdministrativeSigning } from '@/lib/administrative-signing-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => handleAdministrativeSigning(request, 'status');
