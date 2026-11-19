import type { z } from "zod";
import { QueueItemSchema } from "@/lib/api/dto";

export type QueueItem = z.infer<typeof QueueItemSchema>;

export function PriorityBadge({ band, label }: { band: QueueItem["priority_band"]; label: string }) {
  const tone =
    band === "P1"
      ? "bg-teal-100 text-teal-900"
      : band === "P2"
        ? "bg-amber-100 text-amber-900"
        : band === "P3"
          ? "bg-slate-100 text-slate-800"
          : "bg-slate-50 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {band} · {label}
    </span>
  );
}
