import { CLAIMS, BENCHMARK_RUN_ID } from "@/lib/claims/registry";
import type { Claim } from "@/lib/claims/types";

export interface ClaimValidationIssue {
  claim_id: string;
  message: string;
}

export interface ClaimValidationResult {
  ok: boolean;
  issues: ClaimValidationIssue[];
}

type EvaluationArtifact = Record<string, unknown>;

function at(root: unknown, ...path: string[]): unknown {
  let current: unknown = root;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const MEASURED_CHECKS: Record<string, (evaluation: EvaluationArtifact) => unknown> = {
  "benchmark-macro-f1": (e) => at(e, "end_to_end", "macro_f1") ?? at(e, "gaps", "extracted", "macro_f1"),
  "benchmark-micro-f1": (e) => at(e, "end_to_end", "micro_f1"),
  "detector-missed-followup-f1": (e) => at(e, "gaps", "extracted", "per_type", "missed_followup", "f1"),
  "detector-duplicate-test-f1": (e) => at(e, "gaps", "extracted", "per_type", "duplicate_test", "f1"),
  "detector-med-monitoring-f1": (e) => at(e, "gaps", "extracted", "per_type", "med_monitoring", "f1"),
  "hard-negative-pass-rate": (e) => at(e, "negatives", "verified", "pass_rate"),
  "displayed-gap-grounding": (e) => at(e, "evidence", "verified_grounding", "grounded_gap_rate"),
  "unsupported-displayed-claims": (e) => at(e, "evidence", "unsupported_displayed_claims"),
  "top5-verified": (e) => at(e, "scorecard", "top5_verified"),
  "top5-truth-precision": (e) => at(e, "scorecard", "top5_truth_precision"),
  "demographic-invariance-violations": (e) => at(e, "scorecard", "demographic_invariance_violations"),
  "cached-queue-latency-p50": (e) => at(e, "latency", "cached_queue_read_parse", "p50_ms"),
  "live-pipeline-latency-p50": (e) => at(e, "latency", "single_patient", "p50_ms"),
};

export function validateClaims(
  claims: Claim[] = CLAIMS,
  evaluation?: EvaluationArtifact,
): ClaimValidationResult {
  const issues: ClaimValidationIssue[] = [];

  for (const claim of claims) {
    if (!claim.claim_id) issues.push({ claim_id: claim.claim_id, message: "missing claim_id" });
    if (!claim.label) issues.push({ claim_id: claim.claim_id, message: "missing label" });
    if (claim.classification === "MODELED" && !claim.formula) {
      issues.push({ claim_id: claim.claim_id, message: "modeled claim missing formula" });
    }
    if (claim.classification === "EXTERNAL_RESEARCH" && !claim.external_source) {
      issues.push({ claim_id: claim.claim_id, message: "external claim missing source metadata" });
    }
    if (claim.classification === "MEASURED" && claim.benchmark_run_id !== BENCHMARK_RUN_ID) {
      issues.push({ claim_id: claim.claim_id, message: "measured claim missing/invalid benchmark_run_id" });
    }
    if (claim.state === "RETIRED") {
      issues.push({ claim_id: claim.claim_id, message: "retired claim must not be used" });
    }
  }

  if (evaluation) {
    for (const [id, getter] of Object.entries(MEASURED_CHECKS)) {
      const claim = claims.find((c) => c.claim_id === id);
      if (!claim) continue;
      const actual = getter(evaluation);
      if (actual === undefined || actual === null) {
        issues.push({ claim_id: id, message: "measured value not present in evaluation artifact" });
        continue;
      }
      const expected = typeof claim.value === "string" ? claim.value : Number(claim.value);
      const actualNum = typeof actual === "string" ? actual : Number(actual);
      if (String(expected) !== String(actualNum) && String(expected) !== String(actual)) {
        issues.push({
          claim_id: id,
          message: `measured value mismatch: claim=${claim.value} artifact=${actual}`,
        });
      }
    }
  }

  const ids = new Set<string>();
  for (const claim of claims) {
    if (ids.has(claim.claim_id)) issues.push({ claim_id: claim.claim_id, message: "duplicate claim_id" });
    ids.add(claim.claim_id);
  }

  return { ok: issues.length === 0, issues };
}
