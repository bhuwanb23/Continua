import { SYNTHETIC_BANNER } from "@/lib/domain/api";

export function SyntheticDataBanner() {
  return (
    <div
      role="note"
      aria-label="Synthetic data disclosure"
      className="w-full bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900"
    >
      {SYNTHETIC_BANNER}
    </div>
  );
}
