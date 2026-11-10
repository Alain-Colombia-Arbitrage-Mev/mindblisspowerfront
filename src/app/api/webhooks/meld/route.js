import { handleMeldWebhook } from '@/lib/meld-webhook-bff.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleMeldWebhook(request);
