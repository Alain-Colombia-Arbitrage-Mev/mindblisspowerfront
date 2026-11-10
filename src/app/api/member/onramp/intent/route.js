import { handleMeldOnramp } from '@/lib/meld-onramp-bff.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleMeldOnramp(request, 'intent');
