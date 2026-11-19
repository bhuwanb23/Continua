# Continua safety report (continua-safety-v1)

Generated: 2026-11-19T16:07:30.767Z
Commit: fec71b239e284b4bcad95b8b31a09583c79ed673

Synthetic-data-only MVP. No real PHI processed.

## Release gate

Status: **PASS**

| Gate | Control | Result | Detail |
| --- | --- | --- | --- |
| A | intended use frozen and displayed | PASS | 5 in-scope / 5 out-of-scope |
| B | prohibited uses frozen | PASS | 8 prohibited uses with controls |
| C | AI authority matrix enforced | PASS | 4 forbidden capabilities |
| D | synthetic-only boundary verified | PASS | 485/485 records synthetic |
| E | evidence coverage complete | PASS | 100% verified, 0 unsupported claims |
| F | output language guard clean | PASS | 76 strings, 0 issues |
| G | privacy and secret controls clean | PASS | 0 secret findings, 0 identifier findings |
| H | benchmark truth isolated | PASS | 0 runtime import violations |
| I | cache fails closed | PASS | tamper and uninitialized cache cases |
| J | human oversight and accessibility present | PASS | 0 issues |
| K | safety documentation and artifacts complete | PASS | 13 docs, 8 risks, 6 playbooks |

## Quantitative controls

| Metric | Value | Target |
| --- | --- | --- |
| Real PHI incidents | 0 | 0 |
| Benchmark leakage incidents | 0 | 0 |
| Unsupported evidence displayed | 0 | 0 |
| Forbidden action language | 0 | 0 |
| Autonomous actions | 0 | 0 |
| Secret findings | 0 | 0 |
| Wrong-patient incidents | 0 | 0 |
| Human verification coverage | 100% | 100% |
| Safety corpus failures | 0 | 0 |

## Adversarial corpus

40/40 cases passed across 20 families.

## Safety case

| Claim | Status | Evidence |
| --- | --- | --- |
| SC-01: Only verified gaps are displayed. | supported | cache cross-reference and 66 verified bundles |
| SC-02: Every displayed gap cites source evidence. | supported | 86 positive evidence items, 86 absence checks |
| SC-03: No real PHI is processed or stored. | supported | 485/485 cache records synthetic |
| SC-04: Model output cannot create or justify a gap. | supported | prompt constraints, strict extraction schema, deterministic detector and verifier |
| SC-05: Absence statements are scoped to available records. | supported | 86 absence checks with scoped copy |
| SC-06: Priority is workflow priority, not clinical risk. | supported | priority labels and contextual safety labels |
| SC-07: Benchmark truth is unreachable at runtime. | supported | 81 runtime files audited |
| SC-08: The cache fails closed on tampering. | supported | tamper and uninitialized cache cases |
| SC-09: Outbound copy never prescribes, diagnoses, or claims medical necessity. | supported | 76 strings audited |
| SC-10: No autonomous clinical action exists. | supported | workflow-only action enum and route audit |
| SC-11: A human coordinator remains in the loop. | supported | For coordinator verification |
| SC-12: The release is backed by a repeatable adversarial safety suite. | supported | 40/40 cases across 20 families |

## Residual risks

- RS-01: Synthetic data may not represent real-world diversity. (owner: research, review: Phase 16)
- RS-02: Small-corpus demographic invariance is not population-level fairness. (owner: research, review: Phase 16)
- RS-03: No real-environment usability study has been run. (owner: product, review: Phase 16)
- RS-04: Accessibility audit is static, not assistive-technology tested. (owner: engineering, review: Phase 16)
- RS-05: Incident response has not been rehearsed. (owner: operations, review: Phase 16)
- RS-06: No third-party security review has been performed. (owner: security, review: Phase 16)

## Interpretation limits

This report documents engineering controls on synthetic data. It is not a HIPAA compliance determination, not a clinical validation, and not evidence of real-world safety or effectiveness.
