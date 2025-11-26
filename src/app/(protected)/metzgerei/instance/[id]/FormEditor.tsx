// src/app/(protected)/metzgerei/instance/[id]/FormEditor.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Instance = {
  id: string;
  marketId: string | null;
  periodRef: string | null;
  status: string;
  updatedAt: string;
  definition: {
    id: string;
    label: string;
    marketId: string | null;
    period: string | null;
  };
};

type ApiGet = { ok: true; item: Instance } | { ok: false; error: string };
type ApiPost = { ok: true } | { ok: false; error: string };

// Kleiner, eigener Toast ohne Lib
function Toast({
  kind = "success",
  message,
  onClose,
}: {
  kind?: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "fixed right-4 top-4 z-50 rounded-xl px-4 py-3 shadow-lg text-sm",
        kind === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="font-semibold">
          {kind === "success" ? "Gespeichert" : "Fehler"}
        </span>
        <span className="opacity-90">{message}</span>
        <button
          type="button"
          className="ml-2 opacity-80 hover:opacity-100"
          onClick={onClose}
          aria-label="Toast schließen"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function FormEditor({ id }: { id: string }) {
  const router = useRouter();

  // Daten der Instanz
  const [inst, setInst] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);

  // einfache Formularfelder (Beispiel)
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    // YYYY-MM-DD
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
      .toISOString()
      .slice(0, 10);
  });

  // Signatur
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

  // Toast
  const [flash, setFlash] = useState<{ kind: "success" | "error"; msg: string } | null>(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metzgerei/instances/${id}`, { cache: "no-store" });
      const json: ApiGet = await res.json();
      if (!res.ok || !("ok" in json) || !json.ok) {
        throw new Error(("error" in json && json.error) || `HTTP ${res.status}`);
      }
      setInst(json.item);
    } catch (e: any) {
      setFlash({ kind: "error", msg: e?.message || "Instanz laden fehlgeschlagen" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // WICHTIG: kein <form action="..."> und keine submit-Buttons ohne preventDefault.
  async function handleSignAndSave(e?: React.FormEvent) {
    e?.preventDefault(); // falls du die Funktion doch mal an ein <form onSubmit> hängst

    if (!inst) {
      setFlash({ kind: "error", msg: "Keine Instanz geladen" });
      return;
    }
    if (!initials.trim() || !pin.trim()) {
      setFlash({ kind: "error", msg: "Kürzel und PIN erforderlich" });
      return;
    }

    try {
      const payload = {
        instanceId: inst.id,
        date, // YYYY-MM-DD
        data: {
          // Beispiel-Payload: passe das an deine Felder an
          notes,
        },
        initials: initials.trim().toUpperCase(),
        pin: pin.trim(),
      };

      const res = await fetch("/api/metzgerei/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: ApiPost = await res.json().catch(() => ({ ok: false, error: "Unbekannte Antwort" }));
      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || `HTTP ${res.status}`);
      }

      setFlash({ kind: "success", msg: "Die Eingabe wurde gespeichert." });
      setPin(""); // PIN-Feld nach Erfolg leeren
      // Optional: aktuelle Ansicht/Instanz neu laden
      await load();
      // Optional: router.refresh();
    } catch (e: any) {
      setFlash({ kind: "error", msg: e?.message || "Speichern fehlgeschlagen" });
    }
  }

  return (
    <div className="space-y-6">
      {flash && <Toast kind={flash.kind} message={flash.msg} onClose={() => setFlash(null)} />}

      <div className="rounded-2xl border p-4">
        <div className="text-sm opacity-70">
          {loading ? "Lade ..." : inst ? (
            <>
              <div>
                <span className="font-semibold">{inst.definition.label}</span>
              </div>
              <div>ID: {inst.id} · Zeitraum: {inst.periodRef ?? "–"} · Status: {inst.status}</div>
            </>
          ) : (
            "Instanz nicht gefunden"
          )}
        </div>
      </div>

      {/* Hier dein Formular – NICHT als echtes Submit-Form, oder mit preventDefault */}
      <form
        className="grid gap-4 rounded-2xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSignAndSave(e);
        }}
      >
        <div>
          <label className="block text-sm font-medium mb-1">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notizen (Beispiel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border px-3 py-2 min-h-[120px]"
            placeholder="Freitext …"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-1">Kürzel</label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="z. B. MD"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="••••"
            />
          </div>

          <div className="flex items-end">
            {/* Wichtig: type="button" verhindert Browser-Submit/Navigieren */}
            <button
              type="submit"
              className="w-full rounded-2xl bg-black text-white px-4 py-2"
              onClick={(e) => {
                // doppelt gemoppelt: onSubmit fängt auch ab – das hier ist „sicher“
                e.preventDefault();
                void handleSignAndSave(e);
              }}
              disabled={loading || !inst}
              title={loading ? "Lädt ..." : ""}
            >
              Speichern mit PIN
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
