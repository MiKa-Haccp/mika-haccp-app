"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Period =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "halfyear"
  | "year"
  | string;

type DefItem = {
  id: string;
  sectionKey: string;
  label: string;
  period: Period;
};

type LoadState = "loading" | "ok" | "empty" | "error";

function periodLabel(p: Period): string {
  switch (p) {
    case "day":
      return "täglich";
    case "week":
      return "wöchentlich";
    case "month":
      return "monatlich";
    case "quarter":
      return "vierteljährlich";
    case "halfyear":
      return "halbjährlich";
    case "year":
      return "jährlich";
    default:
      return "";
  }
}

export default function DokuMetzgereiPage() {
  const [items, setItems] = useState<DefItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState("loading");
      setErrorMsg(null);

      try {
        const res = await fetch("/api/doku/metzgerei/defs", {
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

        const defs: DefItem[] = json.items ?? [];
        if (!defs.length) {
          setItems([]);
          setState("empty");
        } else {
          setItems(defs);
          setState("ok");
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          console.error("Doku Metzgerei load error", err);
          setErrorMsg(err?.message ?? "Fehler beim Laden");
          setState("error");
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold mb-1">
          Dokumentation · Metzgerei
        </h1>
        <p className="text-sm opacity-70">
          Übersicht aller Formular-Dokumentationen in der Metzgerei.
          Einträge kommen aus den jeweiligen Erfassungsseiten (täglich,
          wöchentlich, Wareneingang usw.).
        </p>
      </header>

      {state === "loading" && (
        <p className="text-sm opacity-70">Lade Dokumentationen …</p>
      )}

      {state === "error" && (
        <p className="text-sm text-red-600">
          Fehler beim Laden der Dokumentationen.{" "}
          <span className="opacity-80">{errorMsg}</span>
        </p>
      )}

      {state === "empty" && (
        <p className="text-sm opacity-70">
          Es sind noch keine Formulare für die Metzgerei definiert.
        </p>
      )}

      {state === "ok" && (
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <Link
              key={d.id}
              href={`/dokumentation/metzgerei/${d.sectionKey}`}
              className="rounded-2xl border p-4 hover:bg-gray-50 flex flex-col gap-1"
            >
              <span className="font-semibold">{d.label}</span>
              {periodLabel(d.period) && (
                <span className="text-xs opacity-70">
                  Zeitraum: {periodLabel(d.period)}
                </span>
              )}
              <span className="text-[11px] opacity-60">
                ID: {d.id}
              </span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}



