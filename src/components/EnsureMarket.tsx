"use client";

import { ReactNode } from "react";
import { useMarket } from "./MarketProvider";

export default function EnsureMarket({
  children,
  requireMarket = true,
}: {
  children: ReactNode;
  requireMarket?: boolean;
}) {
  const { selected } = useMarket();

  if (requireMarket && !selected) {
    return (
      <div className="rounded-2xl border p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Bitte Markt auswählen</h2>
        <p className="opacity-70">Oben im Umschalter kannst du einen Markt wählen.</p>
      </div>
    );
  }

  return <>{children}</>;
}
