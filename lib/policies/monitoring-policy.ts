export const MONITORING_POLICY_VERSION = "monitoring-policy-v1" as const;

export interface MonitoringPolicy {
  drug: string;
  targets: string[];
  window_days: number;
}

export const MONITORING_POLICIES: readonly MonitoringPolicy[] = [
  { drug: "metformin", targets: ["a1c", "bmp"], window_days: 90 },
  { drug: "warfarin", targets: ["inr"], window_days: 7 },
  { drug: "tamoxifen", targets: ["annual_oncology_followup"], window_days: 365 },
  { drug: "anastrozole", targets: ["annual_oncology_followup"], window_days: 365 },
];

export function monitoringPolicyFor(drug: string): MonitoringPolicy | null {
  return MONITORING_POLICIES.find((policy) => policy.drug === drug) ?? null;
}
