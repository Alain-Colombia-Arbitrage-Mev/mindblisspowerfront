import { readMemberJson, validMemberSummary } from "./member-read.mjs";

const initialState = () => ({ loading: true, error: "", data: null });

/** One mounted view owns this reader. No TTL, persistence or shared-user cache. */
export function createMemberSummaryResource({ fresh = false, read = readMemberJson } = {}) {
  let state = initialState();
  let pending = null;
  const listeners = new Set();
  const publish = next => { state = next; for (const listener of listeners) listener(); };
  const cancel = () => {
    const previous = pending;
    pending = null;
    previous?.controller.abort();
  };
  const refresh = () => {
    cancel();
    const request = { controller: new AbortController(), promise: null };
    pending = request;
    request.promise = Promise.resolve().then(() => {
      if (pending !== request || request.controller.signal.aborted) return;
      return read(`/api/payments/me${fresh ? "?fresh=1" : ""}`, {
        signal: request.controller.signal, validate: validMemberSummary,
      });
    }).then(data => {
      if (pending === request && !request.controller.signal.aborted) publish({ loading: false, error: "", data });
    }).catch(error => {
      if (pending === request && !request.controller.signal.aborted) publish({ loading: false, error: error.message, data: null });
    }).finally(() => { if (pending === request) pending = null; });
    publish(initialState());
    return request.promise;
  };
  return {
    getSnapshot: () => state,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    // Multiple consumers can request the initial read, but start only one GET.
    load: () => pending?.promise || refresh(),
    // A confirmed mutation/retry must supersede an older read, not reuse it.
    refresh,
    cancel: () => { cancel(); state = initialState(); },
  };
}
