// src/app/layout.tsx
import "./globals.css"; // ← DAS ist der fehlende Import!

export const metadata = { title: "MiKa HACCP" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen mika-bg mika-ink antialiased">
        {children}
      </body>
    </html>
  );
}
