"use client";

import { use, useEffect, useMemo, useState } from "react";

const DEF_MAP: Record<string, string> = {
  "taegl-reinigung": "FORM_METZ_TAEGL_REINIGUNG",
  // später: weitere Formulare wie "viertel-reinigung": "FORM_METZ_VIERTEL_REINIGUNG"
};

const TENANT = "T1";

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function periodRefFromDate(dateISO: string) {
  // Für tägliche Formulare reicht "YYYY-MM"
  return dateISO.slice(0, 7);
}

// Hilfsfunktion für Monatskalender-Gitter
function getMonthDays(dateISO: string) {
  const [yStr, mStr] = dateISO.split("-"); // "YYYY-MM-DD"
  const year = Number(yStr);
  const month = Number(mStr); // 1–12

  // Erster Tag des Monats
  const first = new Date(Date.UTC(year, month - 1, 1));
  // Letzter Tag: nächster Monat, Tag 0
  const last = new Date(Date.UTC(year, month, 0));
  const totalDays = last.getUTCDate();

  const days: { day: number; iso: string }[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    const iso = date.toISOString().slice(0, 10);
    days.push({ day: d, iso });
  }
  return days;
}

export default function MetzgereiFormPage({
  params,
}: {
  params: Promise<{ slug: string }>; // Next 16
}) {
  const { slug } = use(params);
  const definitionId = DEF_MAP[slug];

  // aktiver Markt aus localStorage (wie in deiner NavBar)
  const [marketId, setMarketId] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [temp, setTemp] = useState(""); // Beispiel-Feld
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Monatsstatus: welche Tage haben Eintrag?
  const [monthDaysDone, setMonthDaysDone] = useState<Record<string, boolean>>(
    {}
  );
  const periodRef = useMemo(() => periodRefFromDate(date), [date]);

  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

  // Monatsstatus laden, wenn Markt + Definition + periodRef da sind
  useEffect(() => {
    async function loadMonth() {
      if (!marketId || !definitionId) return;
      try {
        const res = await fetch(
          `/api/forms/entries/month?definitionId=${encodeURIComponent(
            definitionId
          )}&marketId=${encodeURIComponent(
            marketId
          )}&periodRef=${encodeURIComponent(periodRef)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!json?.ok) {
          console.warn("month load error", json?.error);
          setMonthDaysDone({});
          return;
        }
        const map: Record<string, boolean> = {};
        for (const e of json.entries as { date: string }[]) {
          map[e.date] = true;
        }
        setMonthDaysDone(map);
      } catch (e) {
        console.error(e);
        setMonthDaysDone({});
      }
    }
    loadMonth();
  }, [marketId, definitionId, periodRef]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!definitionId) {
      setMsg("Formular nicht bekannt (slug).");
      return;
    }
    if (!marketId) {
      setMsg("Kein Markt gewählt.");
      return;
    }
    if (!initials || !pin) {
      setMsg("Initialen und PIN eingeben.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        definitionId,
        marketId,
        periodRef,
        date,
        data: {
          // hier deine konkreten Felder
          temp,
          // später: checkboxes, text, usw.
        },
        sign: { initials, pin },
      };

      const res = await fetch("/api/forms/entries/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setMsg(json?.error ?? "Speichern fehlgeschlagen");
      } else {
        setMsg("Gespeichert ✔");
        setPin("");
        // aktuell ausgewählter Tag: als erledigt markieren
        setMonthDaysDone((old) => ({ ...old, [date]: true }));
      }
    } catch (err) {
      console.error(err);
      setMsg("Serverfehler");
    } finally {
      setSaving(false);
    }
  }

  // Monatstage für den Minikalender
  const monthDays = useMemo(() => getMonthDays(date), [date]);

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            Metzgerei ·{" "}
            {slug === "taegl-reinigung" ? "Tägliche Reinigung" : slug}
          </h1>
          <p className="text-sm opacity-70">
            Tägliches Formular mit PIN-Bestätigung.
          </p>
        </div>
        <div className="text-sm">
          <div>Markt: {marketId ?? "kein Markt gewählt"}</div>
          <div>Monat: {periodRef}</div>
        </div>
      </header>

      {/* Minikalender */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-2">Monatsübersicht</h2>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          <span>Mo</span>
          <span>Di</span>
          <span>Mi</span>
          <span>Do</span>
          <span>Fr</span>
          <span>Sa</span>
          <span>So</span>
        </div>
        {/* einfache Variante: nur Gitter nach Tagnummer, ohne echte Wochentags-Verschiebung */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          {monthDays.map((d) => {
            const done = monthDaysDone[d.iso];
            return (
              <button
                key={d.iso}
                type="button"
                className={`aspect-square rounded-full flex items-center justify-center border ${
                  d.iso === date
                    ? "border-black"
                    : "border-gray-200"
                } ${done ? "bg-green-200" : "bg-red-100"}`}
                onClick={() => setDate(d.iso)}
              >
                {d.day}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs opacity-70">
          Grün = erledigt, Rot = offen. Klick auf einen Tag, um ihn zu
          bearbeiten.
        </p>
      </section>

      {/* Formular für ausgewählten Tag */}
      <form
        onSubmit={onSave}
        className="max-w-xl space-y-3 rounded-2xl border p-4"
      >
        <div className="grid gap-2">
          <label className="text-sm">
            Datum
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className="text-sm">
            Temperatur (°C) – Beispiel-Feld
            <input
              type="number"
              step="0.1"
              className="mt-1 w-full rounded border px-3 py-2"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder="z. B. 4.0"
            />
          </label>

          {/* HIER kommen später deine echten Checkboxen etc. */}

          <div className="grid sm:grid-cols-2 gap-2">
            <label className="text-sm">
              Initialen
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={initials}
                onChange={(e) =>
                  setInitials(e.target.value.toUpperCase())
                }
                placeholder="z. B. MD"
                required
              />
            </label>

            <label className="text-sm">
              PIN
              <input
                type="password"
                className="mt-1 w-full rounded border px-3 py-2"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4–6-stellig"
                required
              />
            </label>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={saving || !marketId}
          >
            {saving ? "Speichere…" : "Speichern"}
          </button>
          {msg && <span className="text-sm opacity-80">{msg}</span>}
          {!marketId && (
            <span className="text-sm text-red-600">
              Bitte oben in der Navi einen Markt wählen.
            </span>
          )}
        </div>
      </form>
    </main>
  );
}
