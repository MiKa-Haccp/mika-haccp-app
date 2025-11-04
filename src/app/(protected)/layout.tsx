import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";
import Brand from "@/components/Brand";

export const metadata = {
  title: "MiKa HACCP",
  description: "HACCP-Dokumentation",
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* Fix: dauerhaft oben anheften */}
      <header className="fixed inset-x-0 top-0 z-10 border-b mika-border mika-bg-90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Brand size="text-xl" />
          <nav className="ml-auto flex items-center gap-4 text-sm">
            <a className="mika-link" href="/">Start</a>
            <a className="mika-link" href="/frischetheke">Frischetheke</a>
            <a className="mika-link" href="/markt">Markt</a>
            <a className="mika-link" href="/dokumentation">Dokumentation</a>
            <span className="h-4 w-px mika-sep" />
            <LogoutButton />
          </nav>
        </div>
      </header>

      {/* Abstand oben für die fixe Leiste (ca. 60–64px) */}
      <div className="pt-16">
        <div className="mx-auto max-w-6xl px-4">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
