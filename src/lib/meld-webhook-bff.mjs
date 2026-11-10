import { betterAuthConfig } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';

export const MELD_WEBHOOK_PATH = '/api/webhooks/meld';
export const MELD_WEBHOOK_MAX_BYTES = 128 * 1024;
const responseHeaders = { 'Cache-Control': 'private, no-store' };
const reply = (body, status) => Response.json(body, { status, headers: responseHeaders });

async function rawBody(request) {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d{1,10}$/.test(declared) || Number(declared) > MELD_WEBHOOK_MAX_BYTES)) {
    throw new RangeError('request_too_large');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('missing_body');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MELD_WEBHOOK_MAX_BYTES) { void reader.cancel().catch(() => {}); throw new RangeError('request_too_large'); }
      chunks.push(value);
    }
  } finally { try { reader.releaseLock(); } catch { /* no-op */ } }
  if (!size) throw new SyntaxError('missing_body');
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function handleMeldWebhook(request, {
  env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest,
} = {}) {
  const url = new URL(request.url);
  if (url.pathname !== MELD_WEBHOOK_PATH || url.search || url.hash) return reply({ error: 'not_found' }, 404);
  if (url.protocol !== 'https:' || url.username || url.password || url.origin !== env.AUTH_PUBLIC_ORIGIN) {
    return reply({ error: 'invalid_host' }, 421);
  }
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  const signature = request.headers.get('meld-signature') || '';
  const timestamp = request.headers.get('meld-signature-timestamp') || '';
  if (request.headers.has('content-encoding')
    || !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return reply({ error: 'json_required' }, 415);
  if (!/^[A-Za-z0-9_-]{43}={0,1}$/.test(signature) || !timestamp || timestamp.length > 64) {
    return reply({ error: 'invalid_webhook_signature' }, 401);
  }
  let bytes;
  try { bytes = await rawBody(request); }
  catch (error) { return error instanceof RangeError ? reply({ error: 'request_too_large' }, 413) : reply({ error: 'invalid_webhook_request' }, 400); }
  try {
    const result = await serviceRequest(`${betterAuthConfig(env)}${MELD_WEBHOOK_PATH}`, {
      method: 'POST', signal: request.signal, body: bytes,
      headers: { 'content-type': 'application/json', 'meld-signature': signature, 'meld-signature-timestamp': timestamp },
    }, fetchImpl);
    if (result.ok && result.data?.received === true) return reply({ received: true }, 200);
    if (result.status === 401) return reply({ error: 'invalid_webhook_signature' }, 401);
    if ([400, 413, 415].includes(result.status)) return reply({ error: 'invalid_webhook_request' }, result.status);
    return reply({ error: 'webhook_unavailable' }, 503);
  } catch { return reply({ error: 'webhook_unavailable' }, 503); }
}
