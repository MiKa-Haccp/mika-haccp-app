"use client";

export function usePinCheck() {
  return async function verifyPin({
    tenantId,
    marketId,
    initials,
    username,
    ask = true,
  }: {
    tenantId: string;
    marketId: string;     // Pflicht!
    initials?: string;
    username?: string;
    ask?: boolean;
  }) {
    if (!marketId) return { ok: false, error: "no_market" } as const;

    let pin = "";
    if (ask) {
      const entered = window.prompt("Bitte PIN eingeben:");
      if (!entered) return { ok: false, error: "cancelled" } as const;
      pin = entered;
    }

    const res = await fetch("/api/staff/pin-check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantId, marketId, initials, username, pin }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) return { ok: false, error: json.error ?? "failed" } as const;
    return { ok: true, staff: json.staff } as const;
  };
}

