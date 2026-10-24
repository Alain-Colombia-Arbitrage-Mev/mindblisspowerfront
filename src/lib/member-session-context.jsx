"use client";

import { createContext, useContext } from "react";

// Presentation state for this mounted dashboard, not an authorization decision.
export const MemberSessionContext = createContext(null);
export function useMemberSession() {
  return useContext(MemberSessionContext);
}
