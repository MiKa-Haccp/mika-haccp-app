import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "MiKa HACCP",
  description: "HACCP-Dokumentation für Lebensmittelmarkt",
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* kleine Navigationsleiste oben */}
      <nav className="flex gap-4 p-3 border-b bg-white text-sm">
        <a href="/">Start</a>
        <a href="/frischetheke">Frischetheke</a>
        <a href="/markt">Markt</a>
        <a href="/dokumentation">Dokumentation</a>
        <span className="ml-auto"><LogoutButton /></span>
      </nav>

      {children}
    </AuthGuard>
  );
}
