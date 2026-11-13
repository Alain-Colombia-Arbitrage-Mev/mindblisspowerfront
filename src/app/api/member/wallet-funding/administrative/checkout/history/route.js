import { handleAdministrativeMeldCheckout } from '@/lib/administrative-meld-checkout-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => handleAdministrativeMeldCheckout(request, 'history');
