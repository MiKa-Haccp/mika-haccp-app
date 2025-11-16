"use client";

import { useEffect, useState } from "react";

type SaveStatus = "idle" | "saving" | "ok" | "error";
type WareType = "ambient" | "chilled" | "frozen";

type WareneingangFormProps = {
  definitionId: string;      // z.B. FORM_METZ_WE_FLEISCH
  title: string;             // Seitentitel
  description?: string;      // Untertitel
  wareType: WareType;        // "ambient" | "chilled" | "frozen"
};

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
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

  // Markt aus localStorage holen (wie bei den anderen Formularen)
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

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
