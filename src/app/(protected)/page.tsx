"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldIcon } from "@/components/Brand";
import { isAdmin } from "@/lib/currentContext";
import { CheckSquare, FileText, Users } from "lucide-react";

// Next 16: viewport separat exportieren
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

function CTA(props: { href: string; label: string; solid?: boolean; icon?: React.ComponentType<any> }) {
  const { href, label, solid = false, icon: Icon = CheckSquare } = props;

  const box = solid
    ? "flex items-center gap-3 rounded-2xl px-5 py-4 mika-btn shadow hover:shadow-lg transition"
    : "flex items-center gap-3 rounded-2xl px-5 py-4 mika-card shadow hover:shadow-lg transition";

  const iconColor = solid ? "text-white" : "mika-brand";
  const textColor = solid ? "text-white font-semibold" : "mika-brand font-semibold";

  return (
    <Link href={href} className={box}>
      <Icon className={`${iconColor} w-5 h-5`} />
      <span className={textColor}>{label}</span>
    </Link>
  );
}

export default function ProtectedHomePage() {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    (async () => setAdmin(await isAdmin()))();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <section className="mika-frame mb-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="mika-brand">
            <ShieldIcon className="h-16 w-16" />
          </div>
          <div className="mika-brand">
            <h1 className="text-4xl font-extrabold leading-tight">MiKa HACCP</h1>
            <p className="mt-2 opacity-70 mika-ink">
              Ihr digitaler Partner für Lebensmittelsicherheit
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:max-w-md">
          {/* Hauptbereiche */}
          <CTA href="/metzgerei" label="Metzgerei ToDo's" solid icon={CheckSquare} />
          <CTA href="/markt" label="Markt ToDo's" icon={CheckSquare} />
          <CTA href="/dokumentation" label="Dokumentation" icon={FileText} />

          {/* Admin-Bereich nur anzeigen, wenn Admin */}
          {admin && (
            <>
              <div className="h-px bg-gray-200 my-2" />
              <CTA href="/dokumentation/admin" label="Dokumentation – Admin" icon={FileText} />
              <CTA href="/admin/invite" label="Benutzer einladen" icon={Users} />
              {/* Falls du die Einladungsseite für Markt-Links nutzt: */}
              {/* <CTA href="/markt/einladen" label="Einladungslinks (Markt)" icon={Users} /> */}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

