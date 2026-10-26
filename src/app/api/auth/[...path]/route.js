import { proxyBetterAuth, proxyBetterAuthKeys } from "@/lib/better-auth-bridge.mjs";
import { proxyPhoneOptIn } from "@/lib/phone-opt-in-bff.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { path } = await params;
  if (path[0] === 'phone-number') return proxyPhoneOptIn(request, path.join('/'));
  return proxyBetterAuth(request, path.join("/"));
}

export async function GET(request, { params }) {
  const { path } = await params;
  if (path.join('/') === 'phone-number/opt-in') return proxyPhoneOptIn(request, path.join('/'));
  if (path.join('/') !== 'jwks') return Response.json({ error: 'not_found' }, { status: 404 });
  return proxyBetterAuthKeys(request);
}
