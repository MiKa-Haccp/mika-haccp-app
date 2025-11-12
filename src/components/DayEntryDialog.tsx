'use client';
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  day: number | null;
  definitionId: string;     // z. B. "DEF_ZUST_MON"
  periodRef: string;        // z. B. "2025-11"
};

export default function DayEntryDialog({
  open, onClose, onSaved, day, definitionId, periodRef
}: Props) {
  const [verantwortlich, setVerantwortlich] = useState("");
  const [kontrolle, setKontrolle] = useState(false);
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

  if (!open || !day) return null;

  const dateISO = new Date(`${periodRef}-01T12:00:00Z`);
  // auf richtigen Tag setzen
  dateISO.setUTCDate(day);

  const valid = initials.trim().length >= 2 && /^[0-9]{4}$/.test(pin);

  const submit = async () => {
    if (!valid) return;
    await fetch("/api/forms/entries/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        definitionId,
        periodRef,
        dateISO: dateISO.toISOString(),
        data: {
          verantwortlich,
          kontrolle,
          initials,
          // Hinweis: PIN wird NICHT gespeichert – nur Server-seitig prüfen/später hashen.
        },
      }),
    });
    onSaved();    // z. B. reload des Status in der Seite
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow">
        <div className="mb-3 text-lg font-semibold">Tages-Eintrag · {periodRef}-{String(day).padStart(2, "0")}</div>

        <div className="mb-3 space-y-2">
          <label className="block text-sm">
            Verantwortlich
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={verantwortlich}
              onChange={(e) => setVerantwortlich(e.target.value)}
              placeholder="Name/Kürzel"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={kontrolle} onChange={(e) => setKontrolle(e.target.checked)} />
            Kontrolle durchgeführt
          </label>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Initialen
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              placeholder="z. B. KM"
            />
          </label>

          <label className="block text-sm">
            PIN (4-stellig)
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-2 hover:bg-gray-50">Abbrechen</button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-black px-3 py-2 text-white disabled:opacity-40"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
