"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FormDef = {
  id: string;
  sectionKey: string | null;
  label: string;
  period: string | null;
};

const PERIOD_LABEL: Record<string, string> = {
  daily: "täglich",
  weekly: "wöchentlich",
  monthly: "monatlich",
  quarterly: "vierteljährlich",
  yearly: "jährlich",
};

export default function MetzgereiDokuIndexPage() {
  const [items, setItems] = useState<FormDef[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "empty" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMsg(null);

      try {
        const res = await fetch("/api/doku/metzgerei/defs", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const json = await res.json();
        const defs: FormDef[] = json?.items ?? [];

        if (!cancelled) {
          setItems(defs);
          setStatus(defs.length ? "ok" : "empty");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("load metzgerei defs error", err);
          setStatus("error");
          setErrorMsg("Konnte Formulare nicht laden.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold mb-1">
          Dokumentation · Metzgerei
        </h1>
        <p className="text-sm opacity-70">
          Übersicht aller Formular-Dokumentationen in der Metzgerei. Einträge
          kommen aus den jeweiligen Erfassungsseiten (täglich, wöchentlich,
          Wareneingang usw.).
        </p>
      </header>

      {status === "loading" && <p>Lade…</p>}
      {status === "error" && (
        <p className="text-sm text-red-600">
          {errorMsg ?? "Fehler beim Laden."}
        </p>
      )}
      {status === "empty" && (
        <p className="text-sm opacity-70">
          Noch keine Formulare definiert.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((def) => {
          const periodLabel =
            def.period && PERIOD_LABEL[def.period]
              ? PERIOD_LABEL[def.period]
              : null;

          // Slug für die URL:
          const slug = (def.sectionKey || def.id).trim();

          return (
            <li key={def.id}>
              <Link
                href={`/dokumentation/metzgerei/${slug}`}
                className="block rounded-2xl border p-4 hover:bg-gray-50"
              >
                <div className="font-semibold">{def.label}</div>
                <div className="text-xs opacity-70 mt-1">
                  ID: {def.id}
                  {periodLabel && ` · Zeitraum: ${periodLabel}`}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
