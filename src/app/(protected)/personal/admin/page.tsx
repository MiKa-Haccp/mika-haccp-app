"use client";

import { useEffect, useMemo, useState } from "react";
import { useMyMarkets } from "@/hooks/useMyMarkets";

type StaffRow = {
  id: string;
  initials: string;
  username: string | null;
  marketId: string | null;
  roles: { global?: string[]; market?: string[] };
};

export default function StaffAdminPage() {
  const { markets } = useMyMarkets();

  const [marketId, setMarketId] = useState<string | null>(null);
  const [list, setList] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Invite-Form
  const [invInitials, setInvInitials] = useState("");
  const [invUsername, setInvUsername] = useState("");
  const [invPin, setInvPin] = useState("");
  const [invRole, setInvRole] = useState<"STAFF" | "ADMIN" | "SUPERADMIN">("STAFF");

  // aktiven Markt aus localStorage holen (wie in der NavBar)
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

  const reload = async () => {
    if (!marketId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/staff/list?marketId=${encodeURIComponent(marketId)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.ok) {
        setList(json.staff);
      } else {
        setMsg(json?.error ?? "Konnte Liste nicht laden");
      }
    } catch (e) {
      setMsg("Fehler beim Laden der Mitarbeiter");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setList([]);
    setMsg(null);
    if (marketId) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId]);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!marketId) {
      setMsg("Bitte zuerst einen Markt auswählen");
      return;
    }
    if (!invInitials || !invPin) {
      setMsg("Initialen und PIN sind nötig");
      return;
    }

    try {
      const res = await fetch("/api/staff/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          marketId,
          initials: invInitials,
          username: invUsername || null,
          pin: invPin,
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setMsg(json?.error ?? "Fehler beim Anlegen");
        return;
      }

      // Rolle setzen, falls nicht STAFF
      if (invRole !== "STAFF") {
        await fetch("/api/staff/set-role", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            principalId: json.staff.id,
            role: invRole,
            marketId: invRole === "SUPERADMIN" ? null : marketId,
            enable: true,
          }),
        });
      }

      setInvInitials("");
      setInvUsername("");
      setInvPin("");
      setInvRole("STAFF");
      await reload();
      setMsg("Mitarbeiter angelegt ✔");
    } catch (e) {
      setMsg("Serverfehler beim Anlegen");
    }
  }

  async function onResetPinInline(id: string, initials: string, newPin: string) {
    if (!marketId) {
      setMsg("Kein Markt gewählt");
      return;
    }
    if (!newPin) return;

    setMsg(null);
    try {
      const res = await fetch("/api/staff/reset-pin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, initials, newPin }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setMsg(json?.error ?? "PIN-Reset fehlgeschlagen");
        return;
      }
      setMsg(`PIN für ${initials} zurückgesetzt ✔`);
    } catch (e) {
      setMsg("Serverfehler beim PIN-Reset");
    }
  }

  async function toggleRole(principalId: string, role: "ADMIN" | "SUPERADMIN", enable: boolean) {
    setMsg(null);
    try {
      const res = await fetch("/api/staff/set-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          principalId,
          role,
          marketId: role === "SUPERADMIN" ? null : marketId,
          enable,
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setMsg(json?.error ?? "Rolle konnte nicht geändert werden");
        return;
      }
      await reload();
    } catch (e) {
      setMsg("Serverfehler beim Ändern der Rolle");
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Personal &amp; PINs</h1>

      {/* Markt-Auswahl */}
      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <label className="text-sm">
          Markt
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={marketId ?? ""}
            onChange={(e) => {
              const value = e.target.value || null;
              setMarketId(value);
              try {
                if (value) {
                  localStorage.setItem("activeMarketId", value);
                } else {
                  localStorage.removeItem("activeMarketId");
                }
              } catch {}
              window.location.reload(); // wie in der Navbar
            }}
          >
            <option value="">– Markt wählen –</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.id}
              </option>
            ))}
          </select>
        </label>

        {msg && <div className="text-sm opacity-80">{msg}</div>}
      </div>

      {/* Einladung / Neu anlegen */}
      <form
        onSubmit={onInvite}
        className="rounded-2xl border p-4 grid sm:grid-cols-5 gap-3"
      >
        <div>
          <label className="text-sm block">Initialen</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={invInitials}
            onChange={(e) => setInvInitials(e.target.value.toUpperCase())}
            required
          />
        </div>
        <div>
          <label className="text-sm block">Benutzername (optional)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={invUsername}
            onChange={(e) => setInvUsername(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm block">PIN</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={invPin}
            onChange={(e) => setInvPin(e.target.value)}
            placeholder="4–6 Zeichen"
            required
          />
        </div>
        <div>
          <label className="text-sm block">Rolle</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={invRole}
            onChange={(e) => setInvRole(e.target.value as any)}
          >
            <option value="STAFF">Mitarbeiter</option>
            <option value="ADMIN">Admin (Markt)</option>
            <option value="SUPERADMIN">Superadmin (global)</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="rounded bg-black px-4 py-2 text-white w-full">
            Einladen / Anlegen
          </button>
        </div>
      </form>

      {/* Liste */}
      <div className="rounded-2xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Initialen</th>
              <th className="text-left px-4 py-2">Benutzername</th>
              <th className="text-left px-4 py-2">Rollen</th>
              <th className="text-left px-4 py-2">PIN neu</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-3" colSpan={5}>
                  Lade…
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td className="px-4 py-3" colSpan={5}>
                  Keine Einträge
                </td>
              </tr>
            )}
            {list.map((s) => (
              <StaffRowItem
                key={s.id}
                row={s}
                marketId={marketId}
                onResetPin={onResetPinInline}
                onToggleRole={toggleRole}
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

// ----- einzelne Tabellenzeile -----

function StaffRowItem({
  row,
  marketId,
  onResetPin,
  onToggleRole,
}: {
  row: StaffRow;
  marketId: string | null;
  onResetPin: (id: string, initials: string, newPin: string) => Promise<void>;
  onToggleRole: (principalId: string, role: "ADMIN" | "SUPERADMIN", enable: boolean) => Promise<void>;
}) {
  const [pinVal, setPinVal] = useState("");

  const hasAdmin = useMemo(() => {
    const mk = row.roles.market ?? [];
    const gl = row.roles.global ?? [];
    return mk.includes("ADMIN") || gl.includes("ADMIN");
  }, [row.roles]);

  const hasSuper = useMemo(() => {
    const gl = row.roles.global ?? [];
    return gl.includes("SUPERADMIN");
  }, [row.roles]);

  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{row.initials}</td>
      <td className="px-4 py-2">
        {row.username ?? <span className="opacity-60">–</span>}
      </td>
      <td className="px-4 py-2">
        <div className="flex flex-wrap gap-1 mb-1">
          {(row.roles.global ?? []).map((r) => (
            <span
              key={`g-${r}`}
              className="text-[11px] px-2 py-0.5 rounded-full border"
            >
              G:{r}
            </span>
          ))}
          {(row.roles.market ?? []).map((r) => (
            <span
              key={`m-${r}`}
              className="text-[11px] px-2 py-0.5 rounded-full border"
            >
              M:{r}
            </span>
          ))}
        </div>
        <div className="flex gap-3 text-xs">
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={hasAdmin}
              onChange={(e) => onToggleRole(row.id, "ADMIN", e.target.checked)}
              disabled={!marketId}
            />
            Admin (Markt)
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={hasSuper}
              onChange={(e) => onToggleRole(row.id, "SUPERADMIN", e.target.checked)}
            />
            Superadmin (global)
          </label>
        </div>
      </td>
      <td className="px-4 py-2">
        <input
          className="rounded border px-2 py-1 w-28"
          value={pinVal}
          onChange={(e) => setPinVal(e.target.value)}
          placeholder="neuer PIN"
        />
      </td>
      <td className="px-4 py-2">
        <button
          className="rounded border px-3 py-1 text-xs"
          onClick={() => onResetPin(row.id, row.initials, pinVal)}
          disabled={!pinVal}
        >
          Reset
        </button>
      </td>
    </tr>
  );
}

