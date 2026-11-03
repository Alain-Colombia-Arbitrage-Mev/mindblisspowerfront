import { rawIdToken } from '@/lib/admin-bff';
import { verifyIdToken } from '@/lib/verify-id-token';
import { coreFetch, runtimeEnvironment } from '@/lib/cloudflare-runtime.mjs';
import { handleReferralAttribution } from '@/lib/referral-attribution-bff.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request) {
  return handleReferralAttribution(request, { env: runtimeEnvironment(), fetchImpl: coreFetch, identity: async () => {
    const token = await rawIdToken();
    return token ? { token, claims: await verifyIdToken(token) } : null;
  } });
}

export const GET = handle;
export const POST = handle;
