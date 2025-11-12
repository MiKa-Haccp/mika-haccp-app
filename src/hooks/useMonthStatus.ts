'use client';
import { useEffect, useState } from "react";

export function useMonthStatus(definitionId: string, periodRef: string, days = 30) {
  const [done, setDone] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const qs = new URLSearchParams({ definitionId, periodRef, days: String(days) });
        const res = await fetch(`/api/forms/entries/status?${qs.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (alive) setDone(json.doneDays ?? []);
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [definitionId, periodRef, days]);

  return { done, loading };
}
