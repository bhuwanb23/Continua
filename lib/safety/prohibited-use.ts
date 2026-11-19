export interface ProhibitedUse {
  id: string;
  title: string;
  description: string;
  control: string;
}

export const PROHIBITED_USES: readonly ProhibitedUse[] = [
  { id: "PU-01", title: "Diagnosis", description: "Using Continua output to diagnose a patient.", control: "Output language guard plus intended-use contract." },
  { id: "PU-02", title: "Treatment selection", description: "Using output to select, start, stop, or dose medication.", control: "Prohibited-use contract and no action endpoints beyond workflow state." },
  { id: "PU-03", title: "Autonomous action", description: "Letting the system contact patients, schedule care, or order tests without human review.", control: "No autonomous action code paths." },
  { id: "PU-04", title: "Real PHI processing", description: "Loading real patient records into the demo or cache.", control: "Synthetic-only provenance gate and public upload disabled." },
  { id: "PU-05", title: "Benchmark leakage", description: "Exposing truth labels or expected answers through the product API or UI.", control: "Runtime import audit and leakage token scan." },
  { id: "PU-06", title: "Clinical risk scoring", description: "Presenting priority as clinical risk or patient risk.", control: "Priority labels and contextual safety labels." },
  { id: "PU-07", title: "Unverified gap display", description: "Showing candidate or unverified gaps to users.", control: "VerifiedGap-only data flow and cache validation." },
  { id: "PU-08", title: "Model self-justification", description: "Letting the model explain or justify a gap beyond source evidence.", control: "Evidence verification and output language guard." },
] as const;
