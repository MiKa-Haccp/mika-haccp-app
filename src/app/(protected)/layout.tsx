"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import NavBar from "@/components/NavBar";
import MarketProvider from "@/components/MarketProvider";
import EnsureMarket from "@/components/EnsureMarket";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Alle Doku-Seiten (inkl. /dokumentation/admin) ohne EnsureMarket laufen lassen
  const skipEnsure =
    pathname?.startsWith("/dokumentation");

  return (
    <AuthGuard>
      <MarketProvider>
        <NavBar />
        <div className="pt-20">
          <div className="mx-auto max-w-6xl px-4">
            <EnsureMarket>{children}</EnsureMarket>
          </div>
        </div>
      </MarketProvider>
    </AuthGuard>
  );
}
