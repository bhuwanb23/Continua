export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "verified" | "warning" }) {
  const classes =
    tone === "verified"
      ? "bg-green-50 text-green-800 border-green-200"
      : tone === "warning"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>{children}</span>;
}
