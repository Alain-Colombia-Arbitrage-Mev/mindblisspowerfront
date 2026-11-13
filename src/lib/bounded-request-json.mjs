import { browserRequestDeadline } from './browser-request-deadline.mjs';

const unavailable = () => new Error('request_body_unavailable');

/** Bound JSON ingestion even when a stream ignores cancellation. Never retries. */
export async function readBoundedRequestJson(request, { maxBytes, timeoutMs = 8000 }) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new RangeError('invalid_body_limit');
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d{1,10}$/.test(declared) || Number(declared) > maxBytes)) throw new RangeError('request_too_large');
  if (request.signal?.aborted) throw unavailable();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('invalid_json');
  const deadline = browserRequestDeadline(request.signal, timeoutMs);
  let cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    try { void Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* Cleanup must not delay the response. */ }
  };
  const read = () => new Promise((resolve, reject) => {
    let settled = false;
    const finish = (operation, value) => {
      if (settled) return;
      settled = true;
      deadline.signal.removeEventListener('abort', abort);
      operation(value);
    };
    const abort = () => finish(reject, unavailable());
    if (deadline.signal.aborted) { abort(); return; }
    deadline.signal.addEventListener('abort', abort, { once: true });
    Promise.resolve().then(() => {
      if (deadline.signal.aborted) throw unavailable();
      return reader.read();
    }).then(value => finish(resolve, value), error => finish(reject, error));
  });
  deadline.signal.addEventListener('abort', cancel, { once: true });
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, text = '';
  try {
    for (;;) {
      const part = await read();
      if (deadline.signal.aborted) throw unavailable();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) { cancel(); throw new RangeError('request_too_large'); }
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    cancel();
    throw error;
  } finally {
    deadline.signal.removeEventListener('abort', cancel);
    deadline.dispose();
    try { reader.releaseLock(); } catch { /* A broken pending reader cannot hold the request. */ }
  }
}
