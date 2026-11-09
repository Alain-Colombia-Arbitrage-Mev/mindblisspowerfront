import {
  proxyBetterAuth,
  proxyBetterAuthKeys,
  proxyBetterAuthSocialCallback,
  proxyBetterAuthSocialStart,
} from "@/lib/better-auth-bridge.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { path } = await params;
  if (path[0] === 'phone-number') return Response.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  const target = path.join('/');
  if (target === 'sign-in/social') return proxyBetterAuthSocialStart(request);
  if (target === 'callback/google' || target === 'callback/apple') {
    return proxyBetterAuthSocialCallback(request, path[1]);
  }
  return proxyBetterAuth(request, target);
}

export async function GET(request, { params }) {
  const { path } = await params;
  const target = path.join('/');
  if (target === 'jwks') return proxyBetterAuthKeys(request);
  if (target === 'callback/google' || target === 'callback/apple') {
    return proxyBetterAuthSocialCallback(request, path[1]);
  }
  return Response.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
}
