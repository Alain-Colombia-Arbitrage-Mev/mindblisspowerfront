import { handleAdministrativeOfframpOptions } from '@/lib/administrative-offramp-bff.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => handleAdministrativeOfframpOptions(request);
