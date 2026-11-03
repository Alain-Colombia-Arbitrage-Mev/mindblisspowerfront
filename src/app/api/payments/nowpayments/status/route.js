import { rawIdToken } from '@/lib/admin-bff';
import { verifyIdToken } from '@/lib/verify-id-token';
import { coreFetch, runtimeEnvironment } from '@/lib/cloudflare-runtime.mjs';
import { handleNOWPaymentsStatus } from '@/lib/nowpayments-status-bff.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleNOWPaymentsStatus(request, { env: runtimeEnvironment(), fetchImpl: coreFetch, identity: async () => {
    const token = await rawIdToken();
    return token ? { token, claims: await verifyIdToken(token) } : null;
  } });
}
