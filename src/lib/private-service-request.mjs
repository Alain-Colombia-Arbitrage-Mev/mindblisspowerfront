import { browserRequestDeadline } from './browser-request-deadline.mjs';

export const PRIVATE_SERVICE_TIMEOUT_MS = 20000;
export const PRIVATE_SERVICE_MAX_BYTES = 4 * 1024 * 1024;

// A service binding or a faulty reader may ignore its AbortSignal. The local
// wait must still end; late completions/rejections remain handled, never replayed.
function waitWithSignal(operation, signal, onLateValue = (_value) => {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener('abort', aborted);
    const aborted = () => {
      if (settled) return;
      settled = true; cleanup(); reject(new Error('service_request_cancelled'));
    };
    if (signal.aborted) { aborted(); return; }
    signal.addEventListener('abort', aborted, { once: true });
    Promise.resolve().then(() => {
      if (settled || signal.aborted) throw new Error('service_request_cancelled');
      return operation();
    }).then(value => {
      if (settled) { try { onLateValue(value); } catch { /* best effort disposal */ } return; }
      settled = true; cleanup(); resolve(value);
    }, error => {
      if (settled) return;
      settled = true; cleanup(); reject(error);
    });
  });
}

function cancelBody(body) {
  // Cancellation is cleanup, not another unbounded wait after the deadline.
  try { void Promise.resolve(body?.cancel()).catch(() => {}); } catch { /* best effort */ }
}

// A service can return a large tree/report, but never an unbounded JSON body.
// Keep the same deadline through body consumption, not just response headers.
async function boundedJson(response, signal) {
  const reader = response.body?.getReader();
  if (!reader) {
    if ([204, 205].includes(response.status)) return {};
    throw new Error('invalid_service_response');
  }
  const cancel = () => cancelBody(reader);
  signal.addEventListener('abort', cancel, { once: true });
  try {
    if (signal.aborted) throw new Error('service_request_cancelled');
    const chunks = []; let total = 0;
    while (true) {
      const { value, done } = await waitWithSignal(() => reader.read(), signal);
      if (signal.aborted) throw new Error('service_request_cancelled');
      if (done) break;
      total += value.byteLength;
      if (total > PRIVATE_SERVICE_MAX_BYTES) { cancel(); throw new Error('service_response_too_large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally {
    signal.removeEventListener('abort', cancel);
    try { reader.releaseLock(); } catch { /* A cancelled faulty reader cannot hold the caller. */ }
  }
}

/** Exactly one server-to-server request. Never retry a possibly committed write.
 * @param {string} url
 * @param {RequestInit} init
 * @param {typeof fetch} fetchImpl
 */
export async function boundedServiceRequest(url, init, fetchImpl) {
  const deadline = browserRequestDeadline(init.signal, PRIVATE_SERVICE_TIMEOUT_MS);
  try {
    if (deadline.signal.aborted) throw new Error('service_request_cancelled');
    const response = await waitWithSignal(() => fetchImpl(url, { ...init, signal: deadline.signal, redirect: 'manual', cache: 'no-store' }),
      deadline.signal, response => cancelBody(response?.body));
    const data = await boundedJson(response, deadline.signal);
    return { ok: response.ok, status: response.status, data };
  } finally { deadline.dispose(); }
}
