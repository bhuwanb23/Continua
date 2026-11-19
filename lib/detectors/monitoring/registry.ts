export interface MonitoringRegistryEntry {
  drug: string;
  target: string;
  window_days: number;
  completion: "lab" | "oncology_consult";
  lab_codes: string[];
}

/**
 * Frozen benchmark-policy registry. These entries describe what this synthetic
 * benchmark checks; they are not exhaustive clinical guidelines.
 */
export const MONITORING_REGISTRY: readonly MonitoringRegistryEntry[] = [
  { drug: "metformin", target: "a1c_or_bmp", window_days: 90, completion: "lab", lab_codes: ["a1c", "bmp"] },
  { drug: "warfarin", target: "inr", window_days: 7, completion: "lab", lab_codes: ["inr"] },
  {
    drug: "tamoxifen",
    target: "annual_oncology_followup",
    window_days: 365,
    completion: "oncology_consult",
    lab_codes: [],
  },
  {
    drug: "anastrozole",
    target: "annual_oncology_followup",
    window_days: 365,
    completion: "oncology_consult",
    lab_codes: [],
  },
];

export function monitoringRegistryFor(drug: string): MonitoringRegistryEntry | null {
  return MONITORING_REGISTRY.find((entry) => entry.drug === drug) ?? null;
}
