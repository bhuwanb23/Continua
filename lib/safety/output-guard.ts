import type { VerifiedGap } from "@/lib/domain";
import { absenceDescription, gapDisplayTitle, gapSummary } from "@/lib/api/display";
import { checkOutputLanguage, isSafeOutput, ALLOWED_OUTPUT_LABELS } from "./action-language";

export interface CopyAuditIssue {
  gap_id: string;
  field: string;
  code: string;
  term: string;
}

export interface GapCopyAudit {
  checked: number;
  issues: CopyAuditIssue[];
  passed: boolean;
}

export function guardText(text: string, kind: "action" | "absence" | "summary" | "general" = "general"): string[] {
  return checkOutputLanguage(text, { kind }).map((issue) => issue.code);
}

export function guardAbsenceCopy(text: string): string[] {
  return checkOutputLanguage(text, { kind: "absence" }).map((issue) => issue.code);
}

export function auditGapCopy(gaps: VerifiedGap[]): GapCopyAudit {
  const issues: CopyAuditIssue[] = [];
  let checked = 0;

  for (const gap of gaps) {
    checked += 1;
    const fields: Array<[string, string, "action" | "summary" | "general"]> = [
      ["title_display", gapDisplayTitle(gap.gap_type, gap.title), "general"],
      ["summary", gapSummary(gap), "summary"],
      ["recommended_coordinator_action", gap.recommended_coordinator_action, "action"],
    ];

    for (const [field, value, kind] of fields) {
      for (const issue of checkOutputLanguage(value, { kind })) {
        issues.push({ gap_id: gap.gap_id, field, code: issue.code, term: issue.term });
      }
    }

    const deepDive = gap.evidence_deep_dive;
    if (deepDive && Array.isArray(deepDive.absence_checks)) {
      for (const check of deepDive.absence_checks) {
        const text = absenceDescription(check);
        for (const issue of checkOutputLanguage(text, { kind: "absence" })) {
          issues.push({ gap_id: gap.gap_id, field: "absence_description", code: issue.code, term: issue.term });
        }
      }
    }
  }

  return { checked, issues, passed: issues.length === 0 };
}

export function assertSafeGapCopy(gaps: VerifiedGap[]): void {
  const audit = auditGapCopy(gaps);
  if (!audit.passed) {
    const first = audit.issues[0];
    throw new Error(`Unsafe gap copy detected (${first?.code}): ${first?.term}`);
  }
}

export { ALLOWED_OUTPUT_LABELS };
export { isSafeOutput };
