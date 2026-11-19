# NIST AI RMF Mapping

**Safety version:** `continua-safety-v1`
**Framework:** NIST AI Risk Management Framework 1.0 (Govern, Map, Measure, Manage)

This is a voluntary alignment map for a synthetic-data prototype. It is not a certification, conformity assessment, or regulatory approval.

## GOVERN

| Function | Implementation | Evidence |
| --- | --- | --- |
| Roles and authority | AI authority matrix separates model, pipeline, and human decisions | `lib/safety/authority.ts`, `docs/safety/authority-matrix.md` |
| Policies | Intended and prohibited use contracts are frozen | `docs/safety/intended-use.md`, `docs/safety/prohibited-use.md` |
| Risk ownership | Eight risks and six residual risks have owners | `lib/safety/risk-register.ts` |
| Release accountability | Gates A–K require human sign-off | `artifacts/safety/release-gate.json` |
| Incident readiness | Six playbooks with containment and recovery | `lib/safety/incident.ts` |

## MAP

| Function | Implementation | Evidence |
| --- | --- | --- |
| Context and purpose | Coordinator decision support over synthetic data | `docs/safety/intended-use.md` |
| Data boundary | Real PHI prohibited; synthetic provenance frozen | `docs/safety/synthetic-data.md` |
| Stakeholders | Care coordinators, reviewers, engineering, security | intended-use, oversight docs |
| Threat landscape | Model, evidence, privacy, integrity, human factors | `docs/safety/threat-model.md` |
| Data flow | Boundaries and failure behavior documented | `docs/safety/data-flow.md` |

## MEASURE

| Function | Implementation | Evidence |
| --- | --- | --- |
| Adversarial testing | 40 cases across 20 families | `data/safety-cases/`, `artifacts/safety/safety-report.json` |
| Evidence integrity | Span, field, absence, policy, ownership checks | `tests/safety/wrong-patient.test.ts` |
| Benchmark isolation | Runtime import audit and token scan | `tests/safety/benchmark-leakage.test.ts` |
| Output safety | Static and runtime language guard | `audit-output-language`, `tests/safety/output-language.test.ts` |
| Privacy | Synthetic boundary, secret scan, redaction | `tests/safety/synthetic-only.test.ts`, `tests/safety/secret-leakage.test.ts` |
| Human factors | Oversight labels and accessibility audit | `tests/safety/accessibility-oversight.test.ts` |

## MANAGE

| Function | Implementation | Evidence |
| --- | --- | --- |
| Prioritize risks | Likelihood × impact register with control tests | risk register |
| Mitigate | Enforced controls at dataset, pipeline, cache, API, UI | safety case SC-01…SC-12 |
| Accept residual risk | Six residual risks accepted until Phase 16 | `artifacts/safety/risk-register.json` |
| Respond | Playbooks IP-01…IP-06 | `docs/safety/incident-response.md` |
| Monitor | Repeatable suite plus release gate | `npm run test:safety`, `npm run generate:safety-report` |
| Improve | Corpus grows with every incident or new threat | `docs/safety/audit-procedure.md` |

## Gaps against the framework

- No continuous production monitoring; this is a demo cache, not a deployed service.
- No independent audit or third-party assessment (`RS-06`).
- No user research or field evaluation (`RS-03`).
- No assistive-technology testing (`RS-04`).
- No rehearsed incident response (`RS-05`).

See `deployment-gaps.md` for the operational gap list.
