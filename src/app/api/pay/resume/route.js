import { coreFetch, runtimeEnvironment } from '@/lib/cloudflare-runtime.mjs';
import { handleStripeResume } from '@/lib/checkout-resume.mjs';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Link público de "reanudar pago" (desde el correo de carrito abandonado).
 * vp-payments valida el token HMAC, regenera la sesión de Stripe para ese
 * carrito y devuelve la URL; aquí redirigimos (303) al checkout. No requiere
 * login: la seguridad es el token infalsificable de la URL.
 */
export async function GET(request) {
  return handleStripeResume(request, { env: runtimeEnvironment(), fetchImpl: coreFetch });
}
