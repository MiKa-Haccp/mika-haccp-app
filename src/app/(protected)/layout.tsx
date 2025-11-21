import AuthGuard from "@/components/AuthGuard";
import MarketProvider from "@/components/MarketProvider";
import NavBar from "@/components/NavBar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MarketProvider>
        <NavBar />
        <div className="pt-14">
          <div className="mx-auto max-w-6xl px-4">
            {children}
          </div>
        </div>
      </MarketProvider>
    </AuthGuard>
  );
}
