import { discoverReownWebhook } from '@/lib/reown-webhook-discovery.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => discoverReownWebhook(request);
