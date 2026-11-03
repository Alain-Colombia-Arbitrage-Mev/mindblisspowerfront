import { handleResendWebhook } from '@/lib/resend-webhook.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  return handleResendWebhook(request);
}
