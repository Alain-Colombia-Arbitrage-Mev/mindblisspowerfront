// Temporary UI entry policy. It does not change an existing session or grant
// access; every backend endpoint continues to enforce its own authorization.
export const AUTH_ENTRY_PAUSED = false;

export function authEntryAllowed() {
  return !AUTH_ENTRY_PAUSED;
}

/** Return true when a handler must stop, including programmatic submissions. */
export function suppressAuthEntry(event) {
  if (!AUTH_ENTRY_PAUSED) return false;
  event?.preventDefault?.();
  event?.stopPropagation?.();
  return true;
}
