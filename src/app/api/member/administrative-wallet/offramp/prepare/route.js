import { handleAdministrativeOfframpSession } from '@/lib/administrative-offramp-session-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleAdministrativeOfframpSession(request, 'prepare');
