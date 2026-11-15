import { handleHistoricalPackageRights } from '@/lib/historical-package-rights-bff.mjs';

export const dynamic = 'force-dynamic';
export function GET(request) { return handleHistoricalPackageRights(request); }
