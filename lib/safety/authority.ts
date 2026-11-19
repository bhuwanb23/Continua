export type AuthorityDecision = "allowed" | "forbidden" | "human_required";

export interface AuthorityEntry {
  capability: string;
  owner: "model" | "pipeline" | "human_coordinator";
  decision: AuthorityDecision;
  rationale: string;
}

export const AI_AUTHORITY_MATRIX: readonly AuthorityEntry[] = [
  { capability: "Extract clinical events from a document", owner: "model", decision: "allowed", rationale: "Extraction only; no inference of gaps or risk." },
  { capability: "Normalize and dedupe extracted events", owner: "pipeline", decision: "allowed", rationale: "Deterministic, reproducible transformation." },
  { capability: "Detect candidate care gaps", owner: "pipeline", decision: "allowed", rationale: "Rule-based detector over canonical events." },
  { capability: "Verify gap evidence", owner: "pipeline", decision: "allowed", rationale: "Deterministic evidence checks." },
  { capability: "Assign priority band", owner: "pipeline", decision: "allowed", rationale: "Formula over verified gaps only." },
  { capability: "Display a candidate or unverified gap", owner: "pipeline", decision: "forbidden", rationale: "Only VerifiedGap may reach users." },
  { capability: "Diagnose a patient", owner: "model", decision: "forbidden", rationale: "Out of intended use." },
  { capability: "Prescribe or adjust treatment", owner: "model", decision: "forbidden", rationale: "Out of intended use." },
  { capability: "Order tests or schedule care", owner: "pipeline", decision: "forbidden", rationale: "No autonomous action." },
  { capability: "Contact a patient or provider", owner: "human_coordinator", decision: "human_required", rationale: "Workflow action records intent only." },
  { capability: "Override a verified gap", owner: "human_coordinator", decision: "human_required", rationale: "Requires documented coordinator decision." },
  { capability: "Approve release", owner: "human_coordinator", decision: "human_required", rationale: "Safety gate and release sign-off." },
] as const;

export const HUMAN_OVERSIGHT = {
  requirement:
    "Every surfaced gap is reviewed by a human coordinator before any patient-facing, clinical, or scheduling action.",
  checkpoints: [
    "candidate review",
    "evidence inspection",
    "workflow action approval",
    "release sign-off",
  ],
  prohibited_actions: [
    "contact a patient or provider automatically",
    "order tests or prescribe treatment",
    "schedule care without coordinator approval",
    "suppress a verified gap without a recorded reason",
  ],
  override_policy: "Coordinator overrides require a recorded actor, reason, and timestamp.",
} as const;

export function isAllowed(capability: string): boolean {
  return AI_AUTHORITY_MATRIX.some((entry) => entry.capability === capability && entry.decision === "allowed");
}

export function requiresHuman(capability: string): boolean {
  return AI_AUTHORITY_MATRIX.some((entry) => entry.capability === capability && entry.decision === "human_required");
}
