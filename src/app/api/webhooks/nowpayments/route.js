import { handleNOWPaymentsWebhook } from '@/lib/nowpayments-webhook.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  return handleNOWPaymentsWebhook(request);
}
