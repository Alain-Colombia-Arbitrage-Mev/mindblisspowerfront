import { handlePagarCommissions } from '@/lib/pagar-commissions-bff.mjs';

export const dynamic = 'force-dynamic';
export function GET(request) { return handlePagarCommissions(request); }
