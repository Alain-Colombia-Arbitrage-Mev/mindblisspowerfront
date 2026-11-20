import { handleRechargePackage } from '@/lib/recharge-package-bff.mjs';

export const dynamic = 'force-dynamic';
export function GET(request) { return handleRechargePackage(request); }
