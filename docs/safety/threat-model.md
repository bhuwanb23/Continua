# Threat Model and Risk Register

**Safety version:** `continua-safety-v1`
**Machine-readable register:** `lib/safety/risk-register.ts`, `artifacts/safety/risk-register.json`

## Scope and method

The threat model covers the synthetic demo pipeline: extraction, detection, evidence verification, cache, API, and UI. It assumes a curious or adversarial document author, a tampered artifact, and an operator under time pressure. It excludes real PHI, production EHR integration, and external network adversaries beyond the application boundary.

Likelihood and impact are qualitative. Every mitigated risk has an executable control test. Residual risks are accepted only until Phase 16 and are listed separately.

## Primary risks

| ID | Threat | Category | Likelihood | Impact | Control | Control test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Prompt injection in synthetic records | model | medium | high | Untrusted-data framing, closed schema, detector ignores free text | `tests/safety/prompt-injection.test.ts` | mitigated |
| R2 | Hallucinated or unsupported evidence | evidence | medium | high | Span verification, required claims, suppression | `tests/safety/wrong-patient.test.ts` | mitigated |
| R3 | Benchmark truth leakage | privacy | low | high | Runtime import audit, leakage-token scan, no truth route | `tests/safety/benchmark-leakage.test.ts` | mitigated |
| R4 | Real PHI introduced | privacy | low | high | Synthetic provenance gate at dataset, cache, and release | `tests/safety/synthetic-only.test.ts` | mitigated |
| R5 | Clinical overreach in copy | safety | medium | medium | Output language guard and static copy audit | `tests/safety/output-language.test.ts` | mitigated |
| R6 | Wrong-patient attribution | identity | low | high | Patient ownership check on every evidence item | `tests/safety/wrong-patient.test.ts` | mitigated |
| R7 | Cache or artifact tampering | integrity | low | high | Hash validation and fail-closed store | `tests/safety/cache-fail-closed.test.ts` | mitigated |
| R8 | Automation bias and oversight failure | human | medium | medium | Contextual labels and evidence access | `tests/safety/accessibility-oversight.test.ts` | mitigated |

## Safety invariants (SI)

| ID | Invariant | Verification |
| --- | --- | --- |
| SI-01 | Only `VerifiedGap` reaches any user-facing surface | Cache cross-reference and data-flow audit |
| SI-02 | Every displayed gap cites verified source evidence | Bundle `verification_status` |
| SI-03 | No candidate or unverified gap is displayed | UI and API review |
| SI-04 | No real PHI is processed or stored | Synthetic provenance gate |
| SI-05 | Priority is workflow priority, not clinical risk | Priority and contextual labels |
| SI-06 | Absence statements are scoped to available records | Output language guard |
| SI-07 | The model never decides gap existence | Prompt and schema constraints |
| SI-08 | Benchmark truth is unreachable at runtime | Runtime import audit |
| SI-09 | Cache serves only validated data or fails closed | Tampering tests |
| SI-10 | No autonomous clinical action is executed | Action service review |
| SI-11 | All user-facing copy passes the output language guard | `audit-output-language` |
| SI-12 | Human coordinator review is required for every item | UI and workflow design |

## Residual risks (accepted until Phase 16)

| ID | Residual risk | Owner |
| --- | --- | --- |
| RS-01 | Synthetic data may not represent real-world diversity | research |
| RS-02 | Small-corpus demographic invariance is not population-level fairness | research |
| RS-03 | No real-environment usability study has been run | product |
| RS-04 | Accessibility audit is static, not assistive-technology tested | engineering |
| RS-05 | Incident response has not been rehearsed | operations |
| RS-06 | No third-party security review has been performed | security |

## Out-of-model threats

- A compromised host or browser is outside the application-level controls.
- Model provider compromise is assumed away: the demo cache is frozen and no live extraction route is public.
- Social engineering of a coordinator is a human-process risk covered by oversight guidance, not code.
