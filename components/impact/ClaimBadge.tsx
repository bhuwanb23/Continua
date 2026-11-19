import { CLASSIFICATION_LABEL } from "@/lib/claims/classifications";

export function ClaimBadge({ classification }: { classification: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
      {CLASSIFICATION_LABEL[classification as keyof typeof CLASSIFICATION_LABEL] ?? classification}
    </span>
  );
}
