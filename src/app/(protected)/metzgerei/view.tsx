"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useStartForm() {
  const router = useRouter();

  return useCallback(async (definitionId: string, marketId: string | null, periodRef?: string) => {
    try {
      const res = await fetch("/api/forms/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ definitionId, marketId, periodRef }),
      });

      // Verschiedene mögliche Payloads abfangen
      const json: any = await res.json().catch(() => ({}));
      const id = json?.id ?? json?.item?.id;

      if (!res.ok || !id) {
        const msg = json?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      // WICHTIG: singular
      router.push(`/metzgerei/instance/${id}`);
    } catch (err: any) {
      console.error("Start error:", err);
      alert(`Fehler beim Erzeugen: ${err?.message || err}`);
    }
  }, [router]);
}
