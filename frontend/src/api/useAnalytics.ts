import { useEffect, useState } from "react";
import { getAnalytics } from "./client";
import type { Analytics } from "../types/api";

export function useAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    getAnalytics().then(result => {
      if (!cancelled) setData(result);
    }).catch(error => {
      if (!cancelled) setError(error instanceof Error ? error.message : "Unable to load analytics.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [attempt]);
  function refresh() {
    setLoading(true);
    setError(null);
    setAttempt(value => value + 1);
  }
  return { data, error, loading, refresh };
}
