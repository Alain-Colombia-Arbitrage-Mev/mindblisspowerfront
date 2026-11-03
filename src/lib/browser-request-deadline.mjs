// AbortController is supported by older mobile browsers that do not implement
// AbortSignal.any/timeout. Keep cancellation local; never patch browser globals.
// Dispose only after reading the response body, including error responses.
export function browserRequestDeadline(parent, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0 || timeoutMs > 2147483647) {
    throw new RangeError('invalid_request_deadline');
  }
  const controller = new AbortController();
  let timer;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (timer !== undefined) clearTimeout(timer);
    parent?.removeEventListener('abort', cancelled);
  };
  const cancelled = () => {
    // Older AbortSignal implementations may not expose .reason. Passing no
    // reason retains their native AbortError instead of depending on that API.
    if (parent?.reason === undefined) controller.abort();
    else controller.abort(parent.reason);
    dispose();
  };
  if (parent?.aborted) cancelled();
  else {
    parent?.addEventListener('abort', cancelled, { once: true });
    timer = setTimeout(() => {
      const error = new Error('Request timed out');
      error.name = 'TimeoutError';
      controller.abort(error);
      dispose();
    }, timeoutMs);
  }
  return { signal: controller.signal, dispose };
}
