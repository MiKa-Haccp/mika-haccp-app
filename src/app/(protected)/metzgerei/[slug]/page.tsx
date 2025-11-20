"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type FormDef = {
  id: string;
  sectionKey: string | null;
  label: string;
  period: string | null;
};

type LoadStatus = "loading" | "noMarket" | "notfound" | "error" | "ok";

export default function MetzgereiDynamicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug || "").trim();

  const [marketId, setMarketId] = useState<string | null>(null);
  const [def, setDef] = useState<FormDef | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // einfache Eingabemaske
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  ); // YYYY-MM-DD
  const [done, setDone] = useState<boolean>(true);
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 1) aktiven Markt laden
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) {
        setMarketId(mk);
      } else {
        setStatus("noMarket");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Konnte Markt nicht ermitteln.");
    }
  }, []);

  // 2) passende FormDefinition über slug finden
  useEffect(() => {
    if (!slug) return;
    if (!marketId) return; // warten, bis Market da ist / oder noMarket

    let cancelled = false;

    async function loadDef() {
      setStatus("loading");
      setErrorMsg(null);

      try {
        const res = await fetch("/api/doku/metzgerei/defs", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const defs: FormDef[] = json?.items ?? [];

        const found =
          defs.find(
            (d) => (d.sectionKey || "").trim() === slug
          ) ||
          defs.find((d) => d.id === slug);

        if (cancelled) return;

        if (!found) {
          setStatus("notfound");
          setDef(null);
        } else {
          setDef(found);
          setStatus("ok");
        }
      } catch (e) {
        if (cancelled) return;
        console.error("load metzgerei def by slug error", e);
        setStatus("error");
        setErrorMsg("Formular konnte nicht geladen werden.");
      }
    }

    loadDef();
    return () => {
      cancelled = true;
    };
  }, [slug, marketId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!def || !marketId) return;

    setMsg(null);
    setSaving(true);

    try {
      if (!initials || !pin) {
        setMsg("Initialen und PIN sind erforderlich.");
        setSaving(false);
        return;
      }

      // periodRef = Jahr-Monat für dieses Datum
      const periodRef = date.slice(0, 7); // "YYYY-MM"

      const res = await fetch("/api/forms/entries/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          marketId,
          definitionId: def.id,
          periodRef,
          date,
          data: {
            done,
          },
          sign: {
            initials,
            pin,
          },
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.ok === false) {
        setMsg(
          json?.error ||
            `Speichern fehlgeschlagen (${res.status}).`
        );
      } else {
        setMsg("Eintrag gespeichert ✅");
      }
    } catch (err) {
      console.error("save metzgerei entry error", err);
      setMsg("Serverfehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  // --- Render-Logik ---

  if (status === "noMarket") {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold mb-2">Metzgerei · Formular</h1>
        <p className="text-sm text-red-600">
          Bitte oben in der Navigation zuerst einen Markt auswählen.
        </p>
      </main>
    );
  }

  if (status === "loading") {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold mb-2">Metzgerei · Formular</h1>
        <p className="text-sm">Lade Formular…</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold mb-2">Metzgerei · Formular</h1>
        <p className="text-sm text-red-600">
          {errorMsg ?? "Fehler beim Laden des Formulars."}
        </p>
      </main>
    );
  }

  if (status === "notfound" || !def) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold mb-2">Metzgerei · Formular</h1>
        <p className="text-sm text-red-600">
          Formular nicht bekannt (Slug: <code>{slug}</code>).
        </p>
        <p className="text-xs opacity-70 mt-2">
          Prüfe in der Admin-Ansicht unter{" "}
          <code>Dokumentation &gt; Admin &gt; Metzgerei-Formulare</code>, ob
          ein Eintrag mit passendem <code>sectionKey</code> existiert.
        </p>
      </main>
    );
  }

  // ab hier: Formular ist bekannt
  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold mb-1">
          Metzgerei · {def.label}
        </h1>
        <p className="text-sm opacity-70">
          Einfacher Eintrag für dieses Formular. Die gespeicherten Daten
          erscheinen in der Dokumentation unter{" "}
          <code>Dokumentation &gt; Metzgerei</code>.
        </p>
      </header>

      <section className="rounded-2xl border p-4 space-y-4">
        <form onSubmit={onSubmit} className="space-y-4 max-w-md">
          <label className="text-sm block">
            Datum
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label className="text-sm inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={done}
              onChange={(e) => setDone(e.target.checked)}
            />
            Vorgang erledigt / Formular für diesen Tag als erledigt markieren
          </label>

          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-semibold mb-2">
              Unterschrift (Initialen + PIN)
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Initialen
                <input
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                  maxLength={3}
                  required
                />
              </label>

              <label className="text-sm">
                PIN
                <input
                  type="password"
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Speichere…" : "Eintrag speichern"}
          </button>

          {msg && (
            <p className="mt-2 text-sm">
              {msg}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
