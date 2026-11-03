export function createExpiringResource(load, { ttlMs, now = Date.now }) {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0)
    throw new Error("ttlMs must be positive");
  let value;
  let expiresAt = 0;
  let pending = null;
  let generation = 0;

  function read({ force = false } = {}) {
    // A refresh supersedes a regular load, but concurrent explicit refreshes
    // share that newer load. Readers arriving during refresh also wait for it.
    if (pending && (!force || pending.forced))
      return pending.promise.then(structuredClone);
    if (!force && expiresAt > now())
      return Promise.resolve(structuredClone(value));
    if (force) {
      value = undefined;
      expiresAt = 0;
    }

    const current = ++generation;
    const request = { forced: force, promise: null };
    request.promise = Promise.resolve()
      .then(load)
      .then((result) => {
        if (current === generation) {
          value = structuredClone(result);
          expiresAt = now() + ttlMs;
        }
        return result;
      })
      .finally(() => {
        if (pending === request) pending = null;
      });
    pending = request;
    return request.promise.then(structuredClone);
  }

  function invalidate() {
    generation++;
    value = undefined;
    expiresAt = 0;
    pending = null;
  }

  return { read, invalidate };
}
