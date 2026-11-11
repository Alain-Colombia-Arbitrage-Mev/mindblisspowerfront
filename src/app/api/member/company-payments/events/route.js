import { handleCompanyPaymentJournal } from '@/lib/company-payment-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleCompanyPaymentJournal(request, 'recordEvent');
export const GET = request => handleCompanyPaymentJournal(request, 'eventHistory');
