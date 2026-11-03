import { hostedCheckoutURL, stripeCheckoutEnabled } from './checkout-policy.mjs';

const headers = { 'Cache-Control': 'private, no-store' };
const redirect = url => new Response(null, { status: 303, headers: { ...headers, Location: url.href } });

/** Public abandoned-cart bearer link. Resuming can create a new Stripe session. */
export async function handleStripeResume(request, { env, fetchImpl }) {
  if (request.method !== 'GET') return Response.json({ error: 'method_not_allowed' }, { status: 405, headers });
  const fallback = new URL('/dashboard/packages', request.url);
  // Do not consume a bearer link, contact payments or create a session while paused.
  if (!stripeCheckoutEnabled(env)) return redirect(fallback);
  const t = new URL(request.url).searchParams.get('t') || '';
  if (!t || !env.VP_PAYMENTS_URL || !env.PAYMENTS_SERVICE_TOKEN) return redirect(fallback);
  try {
    const response = await fetchImpl(`${env.VP_PAYMENTS_URL}/api/payments/resume?t=${encodeURIComponent(t)}`, {
      headers: { 'X-VP-Service-Token': env.PAYMENTS_SERVICE_TOKEN },
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
    });
    const data = await response.json().catch(() => null);
    const url = response.ok && hostedCheckoutURL(data?.url, 'stripe');
    if (url) return redirect(new URL(url));
  } catch { /* No retries or provider diagnostics. */ }
  return redirect(fallback);
}
