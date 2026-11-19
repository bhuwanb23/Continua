import type { CandidateSeverity } from "@/lib/domain";
import type { ReferralStatus } from "@/lib/domain/event-types";
import { referralWindowFor } from "@/lib/policies/referral-windows";

export const FOLLOWUP_POLICY = {
  detector: "followup-v1",
  /** A referral in these states is still unresolved and eligible for evaluation. */
  unresolved_statuses: ["placed", "unknown"] as ReferralStatus[],
  /** A completed consult/follow-up is required; scheduled is deliberately absent. */
  completion_events: ["consult", "followup"] as const,
  accepted_completion_modes: ["in_person", "telehealth", "phone", "unknown"] as const,
  completion_statuses: ["completed"] as const,
  severity_specialties: ["oncology", "cardiology"] as const,
  due_soon_window_days: 7,
} as const;

export function referralWindowDays(referral: {
  specialty_normalized: string;
  expected_window_days: number;
  window_source: "document" | "benchmark_policy";
}): number {
  if (referral.window_source === "document" && referral.expected_window_days > 0) {
    return referral.expected_window_days;
  }
  return referralWindowFor(referral.specialty_normalized);
}

/** Workflow severity, not a clinical-risk statement. */
export function followupSeverity(specialty: string): CandidateSeverity {
  return (FOLLOWUP_POLICY.severity_specialties as readonly string[]).includes(specialty) ? "high" : "medium";
}
