"use client";

import { useCallback, useEffect, useState } from "react";
import { readMemberJson, validMemberSummary } from "@/lib/member-read.mjs";

/** Bounded, validated reads. A refresh/unmount cancels its previous request. */
export function useMemberSummary({ fresh = false } = {}) {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(current => current + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: "", data: null });
    readMemberJson(`/api/payments/me${fresh ? "?fresh=1" : ""}`, { signal: controller.signal, validate: validMemberSummary })
      .then(data => { if (!controller.signal.aborted) setState({ loading: false, error: "", data }); })
      .catch(error => { if (!controller.signal.aborted) setState({ loading: false, error: error.message, data: null }); });
    return () => controller.abort();
  }, [fresh, revision]);
  return { state, reload };
}
