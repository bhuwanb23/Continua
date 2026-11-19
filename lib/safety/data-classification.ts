export type DataClass =
  | "SYNTHETIC_DEMO"
  | "BENCHMARK"
  | "CLAIMS"
  | "SAFETY_CORPUS"
  | "CACHE_ARTIFACT"
  | "LOG"
  | "PUBLIC_COPY";

export const REAL_PHI_ALLOWED = false;

export const PHI_BOUNDARY = {
  real_phi_allowed: REAL_PHI_ALLOWED,
  statement: "Synthetic-data-only MVP. No real PHI processed.",
  allowed_inputs: ["synthetic_demo_records", "synthetic_benchmark_events"],
  prohibited_inputs: ["real_patient_records", "real_clinical_notes", "real_identifiers"],
} as const;

export const DATA_CLASSES: Record<DataClass, { description: string; contains_phi: boolean; retention: string }> = {
  SYNTHETIC_DEMO: { description: "Synthetic patient records generated for demonstration.", contains_phi: false, retention: "demo cache lifetime" },
  BENCHMARK: { description: "Synthetic benchmark evaluation artifacts.", contains_phi: false, retention: "release lifetime" },
  CLAIMS: { description: "Claim registry and proof artifacts.", contains_phi: false, retention: "release lifetime" },
  SAFETY_CORPUS: { description: "Adversarial safety test cases (no real data).", contains_phi: false, retention: "release lifetime" },
  CACHE_ARTIFACT: { description: "Frozen demo cache artifacts.", contains_phi: false, retention: "release lifetime" },
  LOG: { description: "Application logs with redacted content.", contains_phi: false, retention: "operator-defined" },
  PUBLIC_COPY: { description: "User-facing copy and UI text.", contains_phi: false, retention: "release lifetime" },
};

export function classifyDataset(name: string): DataClass {
  if (/benchmark/i.test(name)) return "BENCHMARK";
  if (/claim/i.test(name)) return "CLAIMS";
  if (/safety/i.test(name)) return "SAFETY_CORPUS";
  if (/cache/i.test(name)) return "CACHE_ARTIFACT";
  return "SYNTHETIC_DEMO";
}

export function assertNoRealPhi(input: unknown): void {
  if (REAL_PHI_ALLOWED) return;
  if (input && typeof input === "object" && (input as Record<string, unknown>).synthetic !== true) {
    throw new Error("Real PHI boundary violation: input is not marked synthetic.");
  }
}
