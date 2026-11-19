import Link from "next/link";
import { SyntheticDataBanner } from "@/components/layout/SyntheticDataBanner";

const nav = [
  { href: "/", label: "Today", hint: "Queue" },
  { href: "/demo", label: "Demo", hint: "Walkthrough" },
  { href: "/patients", label: "Patients", hint: "Directory" },
  { href: "/insights", label: "Insights", hint: "Impact" },
  { href: "/evaluation", label: "Evaluation", hint: "Benchmark" },
  { href: "/methodology", label: "Methodology", hint: "How it works" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <SyntheticDataBanner />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:block">
          <div className="sticky top-0 px-4 py-5">
            <Link href="/" className="text-lg font-semibold text-brand">
              Continua
            </Link>
            <p className="mt-1 text-xs text-slate-500">Continuity intelligence</p>
            <nav aria-label="Primary" className="mt-6 space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-slate-400">{item.hint}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400">
              Synthetic demo · v1
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white md:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-semibold text-brand">
                Continua
              </Link>
              <nav aria-label="Primary mobile" className="flex gap-3 text-sm">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className="text-slate-600 hover:text-ink">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
            Synthetic demonstration data · Coordinator decision support only
          </footer>
        </div>
      </div>
    </div>
  );
}
