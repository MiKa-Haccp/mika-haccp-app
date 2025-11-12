'use client';
import { useEffect, useState } from "react";
import { getMarketId } from "@/lib/currentContext"; // liest bei dir ebenfalls aus storage/server

type Section = { id: string; slug: string; label: string; status?: "ok"|"open"; marketId?: string|null };

export function useDokuSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const qs = new URLSearchParams({ tenantId: "T1" });

        // 1) bevorzugt: aus deinem helper
        let mkId: string | null = null;
        try { mkId = await getMarketId(); } catch {}

        // 2) fallback: keys aus localStorage
        if (!mkId && typeof window !== "undefined") {
          mkId = localStorage.getItem("activeMarketId")
             || localStorage.getItem("currentMarketId")
             || null;
        }

        if (mkId) qs.set("marketId", mkId);

        const url = `/api/doku/sections?${qs.toString()}`;
        console.log("[useDokuSections] fetch", { mkId, url });

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (alive) setSections(json.sections ?? []);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    // reagieren, wenn in einem anderen Tab der Markt gewechselt wird
    function onStorage(e: StorageEvent) {
      if (e.key === "activeMarketId" || e.key === "currentMarketId") {
        load();
      }
    }
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

    return () => {
      alive = false;
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { sections, isLoading, error };
}


