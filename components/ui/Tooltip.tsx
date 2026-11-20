export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
        {label}
      </span>
    </span>
  );
}
