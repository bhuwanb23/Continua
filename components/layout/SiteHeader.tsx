import Link from "next/link";

const links = [
  { href: "/", label: "Overview" },
  { href: "/patients", label: "Patients" },
  { href: "/evaluation", label: "Evaluation" },
  { href: "/methodology", label: "Methodology" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-brand">
          Continua
        </Link>
        <nav aria-label="Primary" className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-600 transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
