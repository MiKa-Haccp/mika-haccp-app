"use client";

import { useState } from "react";
import Brand from "@/components/Brand";
import LogoutButton from "@/components/LogoutButton";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b mika-border mika-bg-90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Brand size="text-xl" />
          {/* Desktop-Navigation */}
          <nav className="ml-auto hidden items-center gap-4 text-sm md:flex">
            <a className="mika-link" href="/">Start</a>
            <a className="mika-link" href="/frischetheke">Frischetheke</a>
            <a className="mika-link" href="/markt">Markt</a>
            <a className="mika-link" href="/dokumentation">Dokumentation</a>
            <span className="h-4 w-px mika-sep" />
            <LogoutButton />
          </nav>

          {/* Mobile-Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-auto inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm md:hidden"
            aria-expanded={open}
            aria-label="Menü umschalten"
          >
            ☰
          </button>
        </div>

        {/* Mobile-Dropdown */}
        {open && (
          <div className="mt-3 grid gap-2 text-sm md:hidden">
            <a className="mika-link py-2" href="/" onClick={()=>setOpen(false)}>Start</a>
            <a className="mika-link py-2" href="/frischetheke" onClick={()=>setOpen(false)}>Frischetheke</a>
            <a className="mika-link py-2" href="/markt" onClick={()=>setOpen(false)}>Markt</a>
            <a className="mika-link py-2" href="/dokumentation" onClick={()=>setOpen(false)}>Dokumentation</a>
            <span className="h-px mika-sep" />
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
