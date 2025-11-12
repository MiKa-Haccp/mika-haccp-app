'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMyMarkets } from "@/hooks/useMyMarkets";

const DEV_HEADERS = {
  "content-type": "application/json",
  "x-dev-user": "dev-root", // Superadmin (Dev)
};

type Section = {
  id: string;
  slug: string;
  label: string;
  marketId: string | null;
  order: number;
  active: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function DokuAdminPage() {
  const [tenantId] = useState("T1");
  const { markets, isLoading: marketsLoading } = useMyMarkets();
  const [marketId, setMarketId] = useState<string | null>(null); // null = global
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [label, setLabel] = useState("");
  const autoSlug = useMemo(() => slugify(label), [label]);
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState<number>(0);
  const effectiveSlug = slug.trim() || autoSlug;

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams({ tenantId });
    if (marketId) qs.set("marketId", marketId);
    const res = await fetch(`/api/doku/sections?${qs.toString()}`, { cache: "no-store" });
    const json = await res.json();
    setSections(json.sections ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, marketId]);

  // CREATE
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveSlug || !label.trim()) return;

    const res = await fetch("/api/doku/sections", {
      method: "POST",
      headers: DEV_HEADERS,
      body: JSON.stringify({
        tenantId,
        marketId, // null = global
        slug: effectiveSlug,
        label: label.trim(),
        order,
      }),
    });

    if (res.ok) {
      setLabel("");
      setSlug("");
      setOrder(0);
      await load();
    } else {
      const txt = await res.text().catch(() => "");
      alert(`Speichern fehlgeschlagen (${res.status}) ${txt}`);
    }
  }

  // UPDATE (label/order/active) per PATCH
  async function onUpdate(s: Section, patch: Partial<Section>) {
    const res = await fetch("/api/doku/sections", {
      method: "PATCH",
      headers: DEV_HEADERS,
      body: JSON.stringify({ id: s.id, ...patch }),
    });
    if (res.ok) {
      await load();
    } else {
      const txt = await res.text().catch(() => "");
      alert(`Update fehlgeschlagen (${res.status}) ${txt}`);
    }
  }

  // DELETE
  async function onDelete(id: string) {
    if (!confirm("Wirklich löschen?")) return;
    const res = await fetch(`/api/doku/sections?id=${id}`, {
      method: "DELETE",
      headers: DEV_HEADERS,
    });
    if (res.ok) {
      await load();
    } else {
      const txt = await res.text().catch(() => "");
      alert(`Löschen fehlgeschlagen (${res.status}) ${txt}`);
    }
  }

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Doku-Sektionen · Admin</h1>
        <Link href="/dokumentation" className="underline">← Zur Übersicht</Link>
      </div>

      {/* Markt-Filter */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm">Scope:</label>
        <select
          className="rounded border px-3 py-2"
          value={marketId ?? ""}
          onChange={(e) => setMarketId(e.target.value || null)}
          disabled={marketsLoading}
        >
          <option value="">Global</option>
          {markets?.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name ?? m.label ?? m.id}
            </option>
          ))}
        </select>
      </div>

      {/* Neu anlegen */}
      <form onSubmit={onCreate} className="mb-8 rounded-2xl border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Bezeichnung
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="z. B. Reinigungsplan"
              required
            />
          </label>

          <label className="text-sm">
            Slug (optional – wird sonst automatisch erzeugt)
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={autoSlug || "wird aus Bezeichnung erzeugt"}
            />
          </label>

          <label className="text-sm">
            Sortierung (Zahl, niedrig = oben)
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="rounded-lg bg-black px-4 py-2 text-white">
            Anlegen
          </button>
        </div>
      </form>

      {/* Liste */}
      <div className="rounded-2xl border">
        <div className="grid grid-cols-12 gap-2 border-b p-3 text-sm font-semibold">
          <div className="col-span-4">Label</div>
          <div className="col-span-3">Slug</div>
          <div className="col-span-2">Scope</div>
          <div className="col-span-1">Order</div>
          <div className="col-span-2 text-right">Aktionen</div>
        </div>

        {loading ? (
          <div className="p-4">Lade…</div>
        ) : sections.length === 0 ? (
          <div className="p-4 opacity-70">Keine Sektionen vorhanden.</div>
        ) : (
          sections.map((s) => (
            <div key={s.id} className="grid grid-cols-12 items-center gap-2 border-b p-3 text-sm">
              <div className="col-span-4">{s.label}</div>
              <div className="col-span-3">{s.slug}</div>
              <div className="col-span-2">{s.marketId ?? "Global"}</div>
              <div className="col-span-1">
                <input
                  type="number"
                  className="w-16 rounded border px-2 py-1"
                  defaultValue={s.order}
                  onBlur={(e) => onUpdate(s, { order: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => onUpdate(s, { active: !s.active })}
                  className="rounded border px-2 py-1"
                  title={s.active ? "Deaktivieren" : "Aktivieren"}
                >
                  {s.active ? "Deaktiv." : "Aktiv."}
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  className="rounded border px-2 py-1 text-red-600"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
