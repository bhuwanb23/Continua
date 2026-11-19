# Prohibited Uses and Controls

**Safety version:** `continua-safety-v1`

The following uses are prohibited. Each has an enforced control and a verification path. A prohibited use is a release blocker, not a documentation preference.

| # | Prohibited use | Enforced control | Verified by |
| --- | --- | --- | --- |
| 1 | Processing real PHI or production EHR data | `REAL_PHI_ALLOWED = false`; dataset provenance and cache boundary checks reject non-synthetic input | `tests/safety/synthetic-only.test.ts`, `scan-synthetic-data` |
| 2 | Diagnosing, treating, or triaging a patient | Output language guard rejects clinical action and necessity language; authority matrix marks diagnosis forbidden | `tests/safety/output-language.test.ts`, `audit-output-language` |
| 3 | Prescribing, ordering tests, or adjusting medication | Forbidden action verbs and authority matrix; no clinical write path exists | `tests/safety/authority.test.ts` |
| 4 | Contacting a patient or provider autonomously | No outbound integration; action records are workflow intent only | `tests/api/security.test.ts`, corpus `human_oversight` |
| 5 | Displaying a candidate, unverified, or suppressed gap | Only `VerifiedGap` crosses the API and UI boundary | cache cross-reference, `tests/safety/wrong-patient.test.ts` |
| 6 | Presenting priority as clinical risk | Labels are workflow-only; risk and urgency language is rejected | `tests/safety/output-language.test.ts` |
| 7 | Claiming medical necessity or denial support | Language guard forbids necessity and coverage claims | `audit-output-language` |
| 8 | Exposing benchmark ground truth or labels | Runtime import audit and leakage-token scan; no truth route | `tests/safety/benchmark-leakage.test.ts`, `audit-runtime-imports` |
| 9 | Serving a tampered, incomplete, or unvalidated cache | `DemoCacheStore` validates artifacts, hashes, cross-references, synthetic boundary, and copy before serving | `tests/safety/cache-fail-closed.test.ts` |
| 10 | Public arbitrary document upload or public live-LLM route | Upload and live extraction routes remain disabled in this phase | `tests/api/security.test.ts` |
| 11 | Autonomous suppression or override of a gap | Overrides require a recorded human actor, reason, and timestamp | `docs/safety/human-oversight.md` |
| 12 | Using the system as the sole basis for a clinical or coverage decision | Intended-use contract and persistent coordinator-review labels | `docs/safety/intended-use.md` |

## Escalation

If a prohibited use is observed in a build, deployment, or demonstration:

1. Stop the affected surface.
2. Record an incident using `docs/safety/incident-response.md`.
3. Treat the release gate as failed until the control is restored and re-verified.

## Non-negotiable statements

- Synthetic-data-only MVP. No real PHI processed.
- Not HIPAA compliant. Not HIPAA certified. Not "HIPAA-safe".
- No autonomous clinical action.
