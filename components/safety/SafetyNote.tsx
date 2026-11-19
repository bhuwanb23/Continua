import { ALLOWED_OUTPUT_LABELS } from "@/lib/safety/action-language";

export type SafetyNoteKind = keyof typeof ALLOWED_OUTPUT_LABELS;

export function SafetyNote({ kind, className }: { kind: SafetyNoteKind; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 ${className ?? ""}`}
    >
      {ALLOWED_OUTPUT_LABELS[kind]}
    </span>
  );
}
