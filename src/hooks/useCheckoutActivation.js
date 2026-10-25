"use client";

import { useEffect, useState } from "react";
import { startCheckoutPolling } from "@/lib/checkout-read.mjs";
import { checkoutErrorStatus, checkoutResultStatus, initialCheckoutStatus } from "@/lib/checkout-status.mjs";

/** One request lifecycle shared by the modal and standalone confirmation page. */
export function useCheckoutActivation({ enabled, requestKey, maxAttempts = 20, maxDurationMs = 60_000 }) {
  const [snapshot, setSnapshot] = useState(() => ({ requestKey, enabled, status: initialCheckoutStatus(enabled) }));

  useEffect(() => {
    setSnapshot({ requestKey, enabled, status: initialCheckoutStatus(enabled) });
    if (!enabled) return undefined;

    return startCheckoutPolling({
      maxAttempts,
      maxDurationMs,
      onResult: (result, bounds) => {
        const status = checkoutResultStatus(result, bounds);
        setSnapshot({ requestKey, enabled, status });
        return status.done;
      },
      onError: (error, bounds) => {
        setSnapshot(current => ({ requestKey, enabled, status: checkoutErrorStatus(current.status, error, bounds) }));
      },
    });
  }, [enabled, requestKey, maxAttempts, maxDurationMs]);

  // A changed session/query must not render the previous checkout's success for
  // one frame before its effect starts. Cleanup also aborts its in-flight read.
  return snapshot.requestKey === requestKey && snapshot.enabled === enabled
    ? snapshot.status : initialCheckoutStatus(enabled);
}
