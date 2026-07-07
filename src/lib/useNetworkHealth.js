"use client";

import { useEffect, useState } from "react";

/**
 * Fetches the network health analysis from the BFF proxy.
 * Returns { loading, data, error }.
 * data shape: { analysis: { health_score, risk_level, weak_leg, summary, findings, actions, warnings }, metrics, rank_exposure }
 */
export function useNetworkHealth() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/admin/network/health", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((body) => {
            throw new Error(body?.error || `HTTP ${res.status}`);
          });
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Error desconocido");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { loading, data, error };
}
