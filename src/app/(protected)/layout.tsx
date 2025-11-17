import AuthGuard from "@/components/AuthGuard";
import NavBar from "@/components/NavBar";
import MarketProvider from "@/components/MarketProvider";
import EnsureMarket from "@/components/EnsureMarket";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
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
