"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${
        ok ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
}

type MetzStatus = {
  daily: "ok" | "open";
  weekly: "ok" | "open";
  quarterly: "ok" | "open";
};

export default function MetzgereiPage() {
  const [marketId, setMarketId] = useState<string | null>(null);
  const [status, setStatus] = useState<MetzStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // aktiven Markt aus localStorage holen (wie auf den anderen Seiten)
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

  useEffect(() => {
    if (!marketId) return;
    setLoading(true);
    setMsg(null);
    fetch(`/api/metzgerei/status?marketId=${encodeURIComponent(marketId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Fehler beim Laden");
        }
        return res.json();
      })
      .then((data) => {
        setStatus(data);
      })
      .catch((err) => {
        console.error(err);
        setMsg("Konnte Status für Metzgerei nicht laden.");
      })
      .finally(() => setLoading(false));
  }, [marketId]);

  if (!marketId) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Metzgerei</h1>
        <p className="text-sm text-red-600">
          Bitte oben in der Navigation zuerst einen Markt auswählen.
        </p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Metzgerei</h1>

      {loading && <p className="text-sm opacity-70">Lade Status…</p>}
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <ul className="space-y-2">
        <li className="flex items-center gap-3">
          <Dot ok={status?.daily === "ok"} />
          <Link
            href="/metzgerei/taegl-reinigung"
            className="flex-1 rounded-xl border p-4 hover:bg-gray-50"
          >
            Tägliche Reinigung
          </Link>
        </li>

        <li className="flex items-center gap-3">
          <Dot ok={status?.weekly === "ok"} />
          <Link
            href="/metzgerei/woech-reinigung"
            className="flex-1 rounded-xl border p-4 hover:bg-gray-50"
          >
            Wöchentliche Reinigung
          </Link>
        </li>

        <li className="flex items-center gap-3">
          <Dot ok={status?.quarterly === "ok"} />
          <Link
            href="/metzgerei/viertel-reinigung"
            className="flex-1 rounded-xl border p-4 hover:bg-gray-50"
          >
            Vierteljährliche Reinigung
          </Link>
        </li>
      </ul>
    </main>
  );
}
