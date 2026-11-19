import type {
  CandidateGap,
  CanonicalClinicalEvent,
  PolicyEvidence,
  PolicySource,
  ReferralEvent,
  VerificationFailure as EvidenceFailure,
} from "@/lib/domain";
import { referralWindowFor } from "@/lib/policies/referral-windows";
import { DUPLICATE_POLICY } from "@/lib/detectors/duplicate/policy";
import { monitoringRegistryFor } from "@/lib/detectors/monitoring/registry";

export interface ExpectedPolicy {
  policy_id: string;
  policy_version: string;
  rule: string;
  source: PolicySource;
}

function eventById(events: CanonicalClinicalEvent[], id: string): CanonicalClinicalEvent | undefined {
  return events.find((event) => event.event_id === id);
}

export function expectedPolicyFor(candidate: CandidateGap, events: CanonicalClinicalEvent[]): ExpectedPolicy {
  if (candidate.gap_type === "missed_followup") {
    const event = eventById(events, candidate.metadata.referral_event_id) as ReferralEvent | undefined;
    const source: PolicySource = event?.typed.window_source === "document"
      ? "document_extracted"
      : "benchmark_policy";
    return {
      policy_id: "referral-window",
      policy_version: candidate.policy_version,
      rule: `followup_window_days=${candidate.window_days ?? 0}`,
      source,
    };
  }
  if (candidate.gap_type === "duplicate_test") {
    return {
      policy_id: "duplicate-window",
      policy_version: candidate.policy_version,
      rule: `duplicate_window_days=${DUPLICATE_POLICY.window_days}`,
      source: "benchmark_policy",
    };
  }
  const entry = monitoringRegistryFor(candidate.metadata.medication);
  return {
    policy_id: "monitoring-registry",
    policy_version: candidate.policy_version,
    rule: `monitoring_target=${candidate.metadata.monitoring_target};window_days=${entry?.window_days ?? 0}`,
    source: "benchmark_policy",
  };
}

export function policyValueFailure(
  candidate: CandidateGap,
  events: CanonicalClinicalEvent[],
): EvidenceFailure | null {
  if (candidate.gap_type === "missed_followup") {
    const event = eventById(events, candidate.metadata.referral_event_id) as ReferralEvent | undefined;
    if (!event || event.event_type !== "referral") {
      return {
        code: "EV-003",
        stage: "policy",
        message: "Referral event for the follow-up window is missing.",
        event_id: candidate.metadata.referral_event_id,
      };
    }
    const expected =
      event.typed.window_source === "document"
        ? event.typed.expected_window_days
        : referralWindowFor(event.typed.specialty_normalized);
    if (candidate.window_days !== expected || candidate.metadata.expected_window_days !== expected) {
      return {
        code: "EV-007",
        stage: "policy",
        message: "Follow-up window does not match the frozen document or benchmark policy.",
        event_id: event.event_id,
      };
    }
    return null;
  }

  if (candidate.gap_type === "duplicate_test") {
    if (candidate.window_days !== DUPLICATE_POLICY.window_days) {
      return {
        code: "EV-007",
        stage: "policy",
        message: "Duplicate-test window does not match the frozen benchmark policy.",
      };
    }
    return null;
  }

  const entry = monitoringRegistryFor(candidate.metadata.medication);
  if (!entry) {
    return {
      code: "EV-006",
      stage: "policy",
      message: "Medication has no frozen monitoring registry entry.",
    };
  }
  if (
    candidate.metadata.monitoring_target !== entry.target ||
    candidate.metadata.monitoring_window_days !== entry.window_days ||
    candidate.window_days !== entry.window_days
  ) {
    return {
      code: "EV-007",
      stage: "policy",
      message: "Monitoring target or window does not match the frozen benchmark registry.",
    };
  }
  return null;
}

export interface PolicyVerification {
  ok: boolean;
  failures: EvidenceFailure[];
}

export function verifyPolicyEvidence(
  candidate: CandidateGap,
  policyEvidence: PolicyEvidence[],
  events: CanonicalClinicalEvent[],
): PolicyVerification {
  const expected = expectedPolicyFor(candidate, events);
  const valueFailure = policyValueFailure(candidate, events);
  if (valueFailure) return { ok: false, failures: [valueFailure] };

  const matching = policyEvidence.filter((item) => item.policy_id === expected.policy_id);
  if (matching.length === 0) {
    return {
      ok: false,
      failures: [
        {
          code: "EV-006",
          stage: "policy",
          message: `Required policy ${expected.policy_id} is missing from the evidence bundle.`,
        },
      ],
    };
  }

  const failures: EvidenceFailure[] = [];
  for (const item of matching) {
    if (item.policy_version !== expected.policy_version) {
      failures.push({
        code: "EV-007",
        stage: "policy",
        message: `Policy ${expected.policy_id} version does not match the verification contract.`,
        evidence_id: item.evidence_id,
      });
      continue;
    }
    if (item.rule !== expected.rule || item.source !== expected.source) {
      failures.push({
        code: "EV-007",
        stage: "policy",
        message: `Policy ${expected.policy_id} rule or provenance class does not match the frozen policy.`,
        evidence_id: item.evidence_id,
      });
      continue;
    }
    item.verified = true;
  }
  return { ok: failures.length === 0, failures };
}
