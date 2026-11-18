import type { SpecialtyCode } from "@/lib/normalization";

export const REFERRAL_WINDOW_POLICY_VERSION = "referral-windows-v1" as const;

export const REFERRAL_WINDOWS_BY_SPECIALTY: Partial<Record<SpecialtyCode, number>> = {
  oncology: 45,
};

export function referralWindowFor(specialty: string): number {
  return REFERRAL_WINDOWS_BY_SPECIALTY[specialty as SpecialtyCode] ?? 30;
}
