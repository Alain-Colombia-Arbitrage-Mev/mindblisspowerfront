"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { createMemberSummaryResource } from "@/lib/member-summary-resource.mjs";

const SummaryContext = createContext(null);
const idle = { loading: true, error: "", data: null };
const idleSnapshot = () => idle;
const subscribeIdle = () => () => {};

function useSummaryResource({ fresh, enabled = true }) {
  const resource = useMemo(() => enabled ? createMemberSummaryResource({ fresh }) : null, [fresh, enabled]);
  const state = useSyncExternalStore(resource?.subscribe || subscribeIdle, resource?.getSnapshot || idleSnapshot, idleSnapshot);
  useEffect(() => {
    if (!resource) return;
    void resource.load();
    return () => resource.cancel();
  }, [resource]);
  return useMemo(() => ({ state, reload: resource?.refresh }), [state, resource]);
}

/** Share a single fresh read only with consumers inside this mounted page. */
export function MemberSummaryProvider({ children, fresh = false }) {
  const value = useSummaryResource({ fresh });
  return createElement(SummaryContext.Provider, { value }, children);
}

/** Bounded, validated reads. A refresh/unmount cancels its previous request. */
export function useMemberSummary({ fresh = false } = {}) {
  const shared = useContext(SummaryContext);
  const local = useSummaryResource({ fresh, enabled: shared === null });
  return shared || local;
}
