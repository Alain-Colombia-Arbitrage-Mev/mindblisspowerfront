import { handleCompanyPayment } from '@/lib/company-payment-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleCompanyPayment(request, 'submit');
