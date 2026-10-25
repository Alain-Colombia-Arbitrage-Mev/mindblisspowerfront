import { proxyBetterAuth, proxyBetterAuthKeys } from "@/lib/better-auth-bridge.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { path } = await params;
  return proxyBetterAuth(request, path.join("/"));
}

export async function GET(request, { params }) {
  const { path } = await params;
  if (path.join('/') !== 'jwks') return Response.json({ error: 'not_found' }, { status: 404 });
  return proxyBetterAuthKeys(request);
}
