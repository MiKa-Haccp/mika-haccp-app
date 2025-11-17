// src/app/(protected)/metzgerei/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SimpleStatus = "ok" | "open";

type MetzStatus = {
  daily: SimpleStatus;
  weekly: SimpleStatus;
  monthly: SimpleStatus;
  quarterly: SimpleStatus;
  halfYear: SimpleStatus;
  yearly: SimpleStatus;
};

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        "inline-block h-3 w-3 rounded-full " +
        (ok ? "bg-green-500" : "bg-red-500")
      }
    />
  );
}

export default function MetzgereiPage() {
  const [marketId, setMarketId] = useState<string | null>(null);
  const [status, setStatus] = useState<MetzStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // aktiven Markt aus localStorage holen
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {
      // ignore
    }
  }, []);

  // Status laden, wenn Markt wechselt
  useEffect(() => {
    if (!marketId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const params = new URLSearchParams({ marketId });
        const res = await fetch(`/api/metzgerei/status?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Fehler beim Laden");
        }

        const json = await res.json();
        if (!json?.ok) {
          throw new Error(json?.error ?? "Fehler beim Laden");
        }

        setStatus({
          daily: json.daily ?? "open",
          weekly: json.weekly ?? "open",
          monthly: json.monthly ?? "open",
          quarterly: json.quarterly ?? "open",
          halfYear: json.halfYear ?? "open",
          yearly: json.yearly ?? "open",
        });
      } catch (err: any) {
        console.error("Metzgerei status load error", err);
        setErrorMsg(err?.message ?? "Fehler beim Laden des Status");
        setStatus(null);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [marketId]);

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold mb-1">Metzgerei</h1>
        <p className="text-sm opacity-70">
          Übersicht der Aufgaben in der Metzgerei (täglich, wöchentlich,
          monatlich, vierteljährlich, halbjährlich, jährlich).
        </p>
        {!marketId && (
          <p className="text-sm text-red-600 mt-2">
            Bitte oben in der Navigation zuerst einen Markt auswählen.
          </p>
        )}
      </header>

      {errorMsg && (
        <p className="text-sm text-red-600">
          Konnte Status für Metzgerei nicht laden.{" "}
          <span className="opacity-80">{errorMsg}</span>
        </p>
      )}

      {loading && (
        <p className="text-sm opacity-70">Lade Status …</p>
      )}

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {/* Tägliche Reinigung */}
        <Link
          href="/metzgerei/taegl-reinigung"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <Dot ok={status?.daily === "ok"} />
          <div>
            <div className="font-semibold">Tägliche Reinigung</div>
            <div className="text-xs opacity-70">
              Status: {status?.daily === "ok"
                ? "erledigt (diesen Monat)"
                : "offen"}
            </div>
          </div>
        </Link>

        {/* Wöchentliche Reinigung */}
        <Link
          href="/metzgerei/woech-reinigung"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <Dot ok={status?.weekly === "ok"} />
          <div>
            <div className="font-semibold">Wöchentliche Reinigung</div>
            <div className="text-xs opacity-70">
              Status: {status?.weekly === "ok"
                ? "erledigt (diese Woche)"
                : "offen"}
            </div>
          </div>
        </Link>

        {/* Monatliche Reinigung */}
        <Link
          href="/metzgerei/monat-reinigung"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <Dot ok={status?.monthly === "ok"} />
          <div>
            <div className="font-semibold">Monatliche Reinigung</div>
            <div className="text-xs opacity-70">
              Status: {status?.monthly === "ok"
                ? "erledigt (diesen Monat)"
                : "offen"}
            </div>
          </div>
        </Link>

        {/* Vierteljährliche Reinigung */}
        <Link
          href="/metzgerei/viertel-reinigung"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <Dot ok={status?.quarterly === "ok"} />
          <div>
            <div className="font-semibold">Vierteljährliche Reinigung</div>
            <div className="text-xs opacity-70">
              Status: {status?.quarterly === "ok"
                ? "erledigt (dieses Quartal)"
                : "offen"}
            </div>
          </div>
        </Link>

        {/* Halbjährliche Reinigung */}
        <Link
          href="/metzgerei/halbjahr-reinigung"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <Dot ok={status?.halfYear === "ok"} />
          <div>
            <div className="font-semibold">Halbjährliche Reinigung</div>
            <div className="text-xs opacity-70">
              Status: {status?.halfYear === "ok"
                ? "erledigt (dieses Halbjahr)"
                : "offen"}
            </div>
          </div>
        </Link>

        {/* Jährliche Reinigung */}
        <Link
          href="/metzgerei/jahr-reinigung"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <Dot ok={status?.yearly === "ok"} />
          <div>
            <div className="font-semibold">Jährliche Reinigung</div>
            <div className="text-xs opacity-70">
              Status: {status?.yearly === "ok"
                ? "erledigt (dieses Jahr)"
                : "offen"}
            </div>
          </div>
        </Link>

        {/* Wareneingang Fleisch */}
        <Link
          href="/metzgerei/we-fleisch"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div className="flex flex-col">
            <span className="font-semibold">Wareneingang Fleisch</span>
            <span className="text-xs opacity-70">
              Erfassung von Lieferungen (Temperatur, Freigabe, Bemerkung).
            </span>
          </div>
        </Link>

        {/* Wareneingang Obst */}
        <Link
          href="/metzgerei/we-obst"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div>
            <div className="font-semibold">Wareneingang Obst</div>
            <div className="text-xs opacity-70">
              Erfassung von Wareneingang Obst (nicht kühlpflichtig).
            </div>
          </div>
        </Link>

        {/* Salatöffnung – bewusst OHNE Punkt */}
        <Link
          href="/metzgerei/salat-oeffnung"
          className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div>
            <div className="font-semibold">Salatöffnung / geöffnete Salate</div>
            <div className="text-xs opacity-70">
              Liste der geöffneten Salate (MHD-Dokumentation).
            </div>
          </div>
        </Link>
      </section>
    </main>
  );
}
