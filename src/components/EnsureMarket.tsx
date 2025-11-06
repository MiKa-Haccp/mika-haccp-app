"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/**
 * EnsureMarket
 * - Prüft, ob der angemeldete Nutzer zu mind. EINEM Markt gehört.
 * - Bevorzugt localStorage("activeMarketId"), validiert Mitgliedschaft.
 * - Setzt bei Bedarf automatisch eine gültige activeMarketId.
 * - Redirect zu /setup NUR für Routen, die wirklich Markt benötigen.
 * - /dokumentation (inkl. /dokumentation/admin) wird NIE umgeleitet.
 */
export default function EnsureMarket({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Routen, die KEINEN Redirect wollen (dürfen auch ohne Markt laufen)
  const allowWithoutMarket =
    pathname?.startsWith("/dokumentation");

  const [loading, setLoading] = useState(true);
  const [hasMarket, setHasMarket] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      // 1) User laden
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!user) {
        // AuthGuard sitzt über uns – falls doch kein User, einfach Inhalt rendern
        setHasMarket(false);
        setLoading(false);
        return;
      }

      // 2) Preferred aus localStorage prüfen
      let preferred: string | null = null;
      try {
        preferred = typeof window !== "undefined" ? localStorage.getItem("activeMarketId") : null;
      } catch {}

      if (preferred) {
        const { data: ok } = await supabase
          .from("market_members")
          .select("market_id")
          .eq("user_id", user.id)
          .eq("market_id", preferred)
          .limit(1)
          .maybeSingle();

        if (ok?.market_id) {
          if (!mounted) return;
          setHasMarket(true);
          setLoading(false);
          return;
        }
      }

      // 3) Irgendeine Mitgliedschaft holen (kein created_at notwendig)
      const { data: anyMm } = await supabase
        .from("market_members")
        .select("market_id")
        .eq("user_id", user.id)
        .limit(1);

      const first = (anyMm && anyMm[0]?.market_id) as string | undefined;

      if (first) {
        // gültigen Markt merken
        try {
          if (typeof window !== "undefined") localStorage.setItem("activeMarketId", first);
        } catch {}
        if (!mounted) return;
        setHasMarket(true);
        setLoading(false);
        return;
      }

      // 4) Keine Mitgliedschaft gefunden
      if (!mounted) return;
      setHasMarket(false);
      setLoading(false);

      // Nur redirecten, wenn die Route es verlangt
      if (!allowWithoutMarket) {
        router.replace("/setup");
      }
    })();

    return () => { mounted = false; };
  }, [pathname, router, allowWithoutMarket]);

  // Ladezustand (kurzes Skelett)
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="h-24 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  // Ohne Markt – aber Route ist erlaubt (z. B. /dokumentation): einfach rendern
  if (!hasMarket && allowWithoutMarket) {
    return <>{children}</>;
  }

  // Mit Markt oder Route verlangt keinen Markt: rendern
  if (hasMarket) {
    return <>{children}</>;
  }

  // Fallback: falls Redirect (oben) noch nicht gegriffen hat, neutrale leere Fläche
  return null;
}
