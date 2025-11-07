// src/app/(protected)/layout.tsx

import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import NavBar from "@/components/NavBar";
import MarketProvider from "@/components/MarketProvider";
import EnsureMarket from "@/components/EnsureMarket";

// Next.js 16: viewport separat exportieren (nicht in metadata)
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// (optional) Grund-Metadaten – ohne viewport
export const metadata = {
  title: "MiKa HACCP",
  description: "Ihr digitaler Partner für Lebensmittelsicherheit",
};

export default function ProtectedLayout({ children }: { children: ReactNode }) {
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
