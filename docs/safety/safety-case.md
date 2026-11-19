# Safety Case

**Safety version:** `continua-safety-v1`
**Claim structure:** SC-01…SC-12, generated into `artifacts/safety/safety-report.json`.

The safety case argues that the prototype is safe **for its intended use**: coordinator decision support over synthetic data, with human review before any action. Claims are supported by executable checks, not narrative alone. Status is generated from the actual run; it is not hand-edited.

## Context

- **System:** Continua care-gap coordination prototype.
- **Intended use:** surface verified gaps for human coordinator review.
- **Data:** synthetic only (`continua-synth-v1`); real PHI prohibited.
- **Out of scope:** diagnosis, prescribing, ordering, autonomous contact, real PHI.

## Claims

| ID | Claim | Evidence | Status source |
| --- | --- | --- | --- |
| SC-01 | Only verified gaps are displayed. | Cache cross-reference and every verified bundle | generated |
| SC-02 | Every displayed gap cites source evidence. | Positive evidence items and absence checks | generated |
| SC-03 | No real PHI is processed or stored. | All cache records synthetic; provenance gate | generated |
| SC-04 | Model output cannot create or justify a gap. | Prompt constraints, closed schema, deterministic detector and verifier | generated |
| SC-05 | Absence statements are scoped to available records. | Absence checks with scoped copy and language guard | generated |
| SC-06 | Priority is workflow priority, not clinical risk. | Priority labels and contextual safety labels | generated |
| SC-07 | Benchmark truth is unreachable at runtime. | Runtime import audit | generated |
| SC-08 | The cache fails closed on tampering. | Tamper and uninitialized cache cases | generated |
| SC-09 | Outbound copy never prescribes, diagnoses, or claims medical necessity. | Static copy audit | generated |
| SC-10 | No autonomous clinical action exists. | Workflow-only action enum and route audit | generated |
| SC-11 | A human coordinator remains in the loop. | Contextual gap-card label and oversight contract | generated |
| SC-12 | The release is backed by a repeatable adversarial safety suite. | 40 cases across 20 families | generated |

## Argument

1. **Data boundary (SC-03).** Only synthetic records enter the pipeline. The dataset is frozen, hashed, and verified; the cache rejects any non-synthetic panel or record; release scans flag identifiers and PHI claims.
2. **Decision boundary (SC-01, SC-04, SC-07).** The model extracts facts under a closed schema and untrusted-data framing. Detectors and verifiers are deterministic. Candidate gaps are suppressed unless evidence passes span, field, absence, policy, and ownership checks. Benchmark truth is not importable at runtime.
3. **Communication boundary (SC-05, SC-06, SC-09).** Display copy is guarded for clinical action, necessity, risk, and autonomy language. Absence copy is scoped to available records. Priority is labeled workflow-only.
4. **Integrity boundary (SC-08).** The store validates artifacts, hashes, cross-references, synthetic provenance, and display copy before serving; any failure makes reads throw and the API return 503.
5. **Human boundary (SC-10, SC-11).** No clinical endpoint exists. The only mutations are coordinator workflow records. Every gap carries "For coordinator verification".
6. **Assurance boundary (SC-02, SC-12).** The 40-case adversarial corpus, static audits, and unit/integration tests run in `npm run test:safety`; any blocker fails the release gate.

## Defeaters and limitations

The case would be defeated by: real PHI entering the pipeline, a candidate gap reaching a user, benchmark truth reaching a response, the cache serving invalid data, or an autonomous clinical action. Each has a named control and test.

The case does **not** establish clinical effectiveness, population fairness, HIPAA compliance, or production readiness. See `deployment-gaps.md` and residual risks `RS-01`…`RS-06`.

## Maintenance

Any change to a control requires re-running the suite and regenerating the report. A failed claim blocks the release; it is never marked supported by editing prose. See `audit-procedure.md`.
