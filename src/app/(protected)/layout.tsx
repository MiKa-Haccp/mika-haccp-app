import AuthGuard from "@/components/AuthGuard";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "MiKa HACCP",
  description: "HACCP-Dokumentation",
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <NavBar />
      <div className="pt-20"> {/* Platz für fixe Leiste (mobil etwas höher) */}
        <div className="mx-auto max-w-6xl px-4">{children}</div>
      </div>
    </AuthGuard>
  );
}
