"use client";

import { useEffect, useState } from "react";

type SaveStatus = "idle" | "saving" | "ok" | "error";
type WareType = "ambient" | "chilled" | "frozen";

type WareneingangLastEntry = {
  date: string; // "YYYY-MM-DD"
  data: {
    wareType?: string;
    lieferant?: string;
    produkt?: string;
    menge?: string;
    temp?: string | number | null;
    bemerkung?: string | null;
  };
  signatureInitials?: string | null;
};

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // YYYY-MM-DD, lokal
}


export function WareneingangForm({
  definitionId,
  title,
  description,
  wareType,
}: WareneingangFormProps) {
  const [marketId, setMarketId] = useState<string | null>(null);

  const [date, setDate] = useState(todayISO());
  const [lieferant, setLieferant] = useState("");
  const [produkt, setProdukt] = useState("");
  const [menge, setMenge] = useState("");
  const [temp, setTemp] = useState<string>("");
  const [bemerkung, setBemerkung] = useState("");

  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

  const [status, setStatus] = useState<SaveStatus>("idle");
  const [msg, setMsg] = useState<string | null>(null);
  // Letzter gespeicherter Eintrag (für diesen Monat + Markt)
  const [lastEntry, setLastEntry] = useState<WareneingangLastEntry | null>(null);
  const [lastEntryLoading, setLastEntryLoading] = useState(false);
  const [lastEntryError, setLastEntryError] = useState<string | null>(null);

  // Markt aus localStorage holen (wie bei den anderen Formularen)
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

    // Letzten Eintrag für diesen Monat + Markt laden
  useEffect(() => {
    if (!marketId) return;

    const periodRef = date.slice(0, 7); // "YYYY-MM"
    setLastEntryLoading(true);
    setLastEntryError(null);

    const url = `/api/forms/entries/by-month?definitionId=${encodeURIComponent(
      definitionId
    )}&marketId=${encodeURIComponent(marketId)}&periodRef=${encodeURIComponent(
      periodRef
    )}`;

    fetch(url)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Fehler beim Laden der Einträge");
        }

        const entries = json.entries || [];
        if (!entries.length) {
          setLastEntry(null);
          return;
        }

        const last = entries[entries.length - 1] as {
          date: string;
          dataJson: any;
          signatureMeta?: { initials?: string | null } | null;
        };

        setLastEntry({
          date: (last.date || "").slice(0, 10),
          data: last.dataJson || {},
          signatureInitials: last.signatureMeta?.initials ?? null,
        });
      })
      .catch((err: any) => {
        console.error("Fehler lastEntry", err);
        setLastEntryError(
          typeof err?.message === "string"
            ? err.message
            : "Fehler beim Laden des letzten Eintrags"
        );
        setLastEntry(null);
      })
      .finally(() => {
        setLastEntryLoading(false);
      });
  }, [marketId, definitionId, date]);

  const tempRelevant = wareType === "chilled" || wareType === "frozen";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!marketId) {
      setMsg("Kein Markt gewählt (oben in der Navigation auswählen).");
      return;
    }
    if (!initials || !pin) {
      setMsg("Initialen und PIN eingeben.");
      return;
    }

    if (tempRelevant && !temp) {
      setMsg("Temperatur ist für gekühlte/tiefgekühlte Ware erforderlich.");
      return;
    }

    setStatus("saving");

    // periodRef = Monat, wie bei der täglichen Reinigung
    const periodRef = date.slice(0, 7); // "YYYY-MM"

    try {
      const res = await fetch("/api/forms/entries/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          definitionId,
          marketId,
          periodRef,
          date,
          data: {
            wareType,      // "ambient" | "chilled" | "frozen"
            lieferant,
            produkt,
            menge,
            temp: tempRelevant ? temp : null,
            bemerkung,
          },
          sign: {
            initials: initials.toUpperCase(),
            pin,
          },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setStatus("error");
        setMsg(json?.error ?? "Speichern fehlgeschlagen.");
        return;
      }

      setStatus("ok");
      setMsg("Wareneingang gespeichert ✔");

      // Formular zurücksetzen (PIN immer löschen)
      setPin("");
      setMenge("");
      setTemp("");
      setBemerkung("");
      // Lieferant/Produkt kannst du optional stehen lassen:
      // setLieferant("");
      // setProdukt("");
    } catch (err) {
      console.error("wareneingang save error", err);
      setStatus("error");
      setMsg("Serverfehler beim Speichern.");
    }
  }

  const wareTypeLabel =
    wareType === "chilled"
      ? "gekühlte Ware"
      : wareType === "frozen"
      ? "tiefgekühlte Ware"
      : "ungekühlte Ware";

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm opacity-70">
          {description ??
            "Erfassung des Wareneingangs. Einträge erscheinen später in der Dokumentation."}
        </p>
        <p className="text-xs mt-1 opacity-70">
          Typ: <span className="font-medium">{wareTypeLabel}</span>
        </p>
      </header>

      {/* Letzter Eintrag ausgegraut zur Ansicht */}
      <section className="max-w-xl rounded-2xl border bg-gray-100 text-gray-700 p-3 text-sm space-y-1">
        <h2 className="font-semibold text-xs uppercase tracking-wide opacity-70">
          Letzter Eintrag
        </h2>

        {lastEntryLoading && <p>Letzter Eintrag wird geladen…</p>}

        {lastEntryError && (
          <p className="text-red-600">
            {lastEntryError}
          </p>
        )}

        {!lastEntryLoading && !lastEntryError && !lastEntry && (
          <p>Noch kein Eintrag vorhanden.</p>
        )}

        {!lastEntryLoading && !lastEntryError && lastEntry && (
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            <div>
              <span className="font-medium">Datum:</span>{" "}
              {lastEntry.date}
            </div>
            <div>
              <span className="font-medium">Lieferant:</span>{" "}
              {lastEntry.data.lieferant || "–"}
            </div>
            <div>
              <span className="font-medium">Produkt:</span>{" "}
              {lastEntry.data.produkt || "–"}
            </div>
            <div>
              <span className="font-medium">Menge:</span>{" "}
              {lastEntry.data.menge || "–"}
            </div>
            <div>
              <span className="font-medium">Temperatur:</span>{" "}
              {lastEntry.data.temp ?? "–"}
            </div>
            <div>
              <span className="font-medium">Kürzel:</span>{" "}
              {lastEntry.signatureInitials || "–"}
            </div>
            {lastEntry.data.bemerkung && (
              <div className="sm:col-span-2">
                <span className="font-medium">Bemerkung:</span>{" "}
                {lastEntry.data.bemerkung}
              </div>
            )}
          </div>
        )}
      </section>

      {!marketId && (
        <p className="text-sm text-red-600">
          Bitte oben in der Navigation zuerst einen Markt auswählen.
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-3 rounded-2xl border p-4"
      >
        <label className="text-sm block">
          Lieferdatum
          <input
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm block">
            Lieferant
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={lieferant}
              onChange={(e) => setLieferant(e.target.value)}
              placeholder="z. B. Metzgerei XY"
              required
            />
          </label>
          <label className="text-sm block">
            Produkt / Artikel
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={produkt}
              onChange={(e) => setProdukt(e.target.value)}
              placeholder="z. B. Rinderhack"
              required
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm block">
            Menge / Charge
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={menge}
              onChange={(e) => setMenge(e.target.value)}
              placeholder="z. B. 10 kg / Charge 123"
            />
          </label>

          <label className="text-sm block">
            Temperatur bei Anlieferung (°C)
            <input
              type="number"
              step="0.1"
              className="mt-1 w-full rounded border px-3 py-2"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder={tempRelevant ? "z. B. 4.0" : "nicht erforderlich"}
              disabled={!tempRelevant}
              required={tempRelevant}
            />
            {!tempRelevant && (
              <span className="text-[11px] opacity-60">
                Für ungekühlte Ware ist keine Temperaturmessung erforderlich.
              </span>
            )}
          </label>
        </div>

        <label className="text-sm block">
          Bemerkungen
          <textarea
            className="mt-1 w-full rounded border px-3 py-2 min-h-[80px]"
            value={bemerkung}
            onChange={(e) => setBemerkung(e.target.value)}
            placeholder="z. B. Verpackung ok, MHD geprüft, Sensorik unauffällig ..."
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm block">
            Initialen
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              placeholder="z. B. MD"
              required
            />
          </label>
          <label className="text-sm block">
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={status === "saving" || !marketId}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {status === "saving" ? "Speichere…" : "Speichern"}
          </button>
          {msg && <span className="text-sm opacity-80">{msg}</span>}
        </div>
      </form>
    </main>
  );
}
