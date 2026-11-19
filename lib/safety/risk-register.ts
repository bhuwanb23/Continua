export interface RiskEntry {
  id: string;
  title: string;
  category: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
  control_test: string;
  status: "mitigated" | "accepted" | "open";
}

export interface SafetyInvariant {
  id: string;
  statement: string;
  verification: string;
}

export interface ResidualRisk {
  id: string;
  description: string;
  owner: string;
  accepted_until: string;
}

export const RISK_REGISTER: readonly RiskEntry[] = [
  { id: "R1", title: "Prompt injection in synthetic records", category: "model", likelihood: "medium", impact: "high", mitigation: "Untrusted-data framing in prompt, strict schema, detector ignores free text", control_test: "tests/safety/prompt-injection.test.ts", status: "mitigated" },
  { id: "R2", title: "Hallucinated or unsupported evidence", category: "evidence", likelihood: "medium", impact: "high", mitigation: "Span verification and required claims", control_test: "tests/safety/wrong-patient.test.ts", status: "mitigated" },
  { id: "R3", title: "Benchmark truth leakage", category: "privacy", likelihood: "low", impact: "high", mitigation: "Runtime import audit and leakage token scan", control_test: "tests/safety/benchmark-leakage.test.ts", status: "mitigated" },
  { id: "R4", title: "Real PHI introduced", category: "privacy", likelihood: "low", impact: "high", mitigation: "Synthetic provenance gate", control_test: "tests/safety/synthetic-only.test.ts", status: "mitigated" },
  { id: "R5", title: "Clinical overreach in copy", category: "safety", likelihood: "medium", impact: "medium", mitigation: "Output language guard", control_test: "tests/safety/output-language.test.ts", status: "mitigated" },
  { id: "R6", title: "Wrong-patient attribution", category: "identity", likelihood: "low", impact: "high", mitigation: "Ownership verification on every evidence item", control_test: "tests/safety/wrong-patient.test.ts", status: "mitigated" },
  { id: "R7", title: "Cache or artifact tampering", category: "integrity", likelihood: "low", impact: "high", mitigation: "Hash validation and fail-closed store", control_test: "tests/safety/cache-fail-closed.test.ts", status: "mitigated" },
  { id: "R8", title: "Automation bias and oversight failure", category: "human", likelihood: "medium", impact: "medium", mitigation: "Contextual safety labels and evidence access", control_test: "tests/safety/accessibility-oversight.test.ts", status: "mitigated" },
] as const;

export const SAFETY_INVARIANTS: readonly SafetyInvariant[] = [
  { id: "SI-01", statement: "Only VerifiedGap reaches any user-facing surface.", verification: "cache cross-reference and data flow audit" },
  { id: "SI-02", statement: "Every displayed gap cites verified source evidence.", verification: "evidence bundle verification_status" },
  { id: "SI-03", statement: "No candidate or unverified gap is displayed.", verification: "UI and API review" },
  { id: "SI-04", statement: "No real PHI is processed or stored.", verification: "synthetic provenance gate" },
  { id: "SI-05", statement: "Priority is workflow priority, not clinical risk.", verification: "priority labels and contextual labels" },
  { id: "SI-06", statement: "Absence statements are scoped to available records.", verification: "output language guard" },
  { id: "SI-07", statement: "The model never decides gap existence.", verification: "prompt and schema constraints" },
  { id: "SI-08", statement: "Benchmark truth is unreachable at runtime.", verification: "runtime import audit" },
  { id: "SI-09", statement: "Cache serves only validated data or fails closed.", verification: "tampering tests" },
  { id: "SI-10", statement: "No autonomous clinical action is executed.", verification: "action service review" },
  { id: "SI-11", statement: "All user-facing copy passes the output language guard.", verification: "audit-output-language" },
  { id: "SI-12", statement: "Human coordinator review is required for every item.", verification: "UI and workflow design" },
] as const;

export const RESIDUAL_RISKS: readonly ResidualRisk[] = [
  { id: "RS-01", description: "Synthetic data may not represent real-world diversity.", owner: "research", accepted_until: "Phase 16" },
  { id: "RS-02", description: "Small-corpus demographic invariance is not population-level fairness.", owner: "research", accepted_until: "Phase 16" },
  { id: "RS-03", description: "No real-environment usability study has been run.", owner: "product", accepted_until: "Phase 16" },
  { id: "RS-04", description: "Accessibility audit is static, not assistive-technology tested.", owner: "engineering", accepted_until: "Phase 16" },
  { id: "RS-05", description: "Incident response has not been rehearsed.", owner: "operations", accepted_until: "Phase 16" },
  { id: "RS-06", description: "No third-party security review has been performed.", owner: "security", accepted_until: "Phase 16" },
] as const;
