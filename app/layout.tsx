import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SyntheticDataBanner } from "@/components/layout/SyntheticDataBanner";

export const metadata: Metadata = {
  title: "Continua — Continuity intelligence for care coordinators",
  description:
    "Synthetic demonstration of continuity intelligence for care coordinators. No real patient information.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SyntheticDataBanner />
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          {children}
        </main>
        <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
          Phase 1 engineering foundation. Clinical intelligence not implemented
          yet.
        </footer>
      </body>
    </html>
  );
}
