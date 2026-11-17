# Phase 0 — Specification Freeze & Contradiction Elimination

> Depends on: all prior research + architecture + build-readiness work
> Unblocks: **everything.** Phase 1 may not begin until this gate passes.
> Gate: **zero unresolved P0 contradictions + `CONTINUA SPECIFICATION v1.0: FROZEN`**

## Mission

Phase 0 is a release gate for the specification, not a feature phase. No application code is written here. The object is to make sure that when Phase 1 starts, two developers reading two different documents cannot build two different versions of Continua.

The six review corrections already applied in `research/build-readiness/` are **carry-in, not completion**. They were applied to research documents that have no version identifiers, no contradiction register, and no machine-readable golden case. During the audit for this phase, five further contradictions were found (C-021 – C-025), all of them in examples that downstream code would have copied verbatim.

**Deliverable of this phase:** `docs/spec/` + `data/spec/`, versioned, internally consistent, and sufficient for a developer who has never read any prior conversation.

## Input

| Artifact | Location | State |
|---|---|---|
| Clinical event schema | `research/build-readiness/clinical-event-schema.md` | corrected (series_status), field names not frozen |
| Gap rules | `research/build-readiness/gap-rules.md` | corrected, still uses a runtime clock |
| Priority engine | `research/build-readiness/priority-engine.md` | frozen formula + worked example |
| Evaluation spec | `research/build-readiness/evaluation-spec.md` | 40/40/70, results table empty |
| API contracts | `research/build-readiness/api-contracts.md` | corrected but examples still contain stale values |
| Acceptance tests | `research/build-readiness/acceptance-tests.md` | ~70 Given/When/Then, not re-read against frozen contracts |
| Maria seed case | `research/build-readiness/demo-seed-case.md` | v2, metformin gap, 70/74 |
| Synthetic data spec | `research/build-readiness/synthetic-data-spec.md` | 80 patients, planted manifest |
| PRD / UX / MVP | `research/architecture/*` | locked |

## Output

```
docs/spec/
├── SPEC-v1.0.md
├── contradiction-register.md
├── terminology.md
├── temporal-semantics.md
├── clinical-event-schema.md
├── gap-contracts.md
├── gap-rules.md
├── evidence-contract.md
├── priority-engine.md
├── api-contract-v1.md
├── evaluation-spec.md
├── safety-contract.md
├── acceptance-tests.md
├── audit-report.md
└── CHANGELOG.md

data/spec/
├── maria-golden-case.json
├── benchmark-manifest.json
└── versions.json
```

After Phase 0, implementation may depend on these contracts **without reinterpretation**. `docs/spec/` is canonical; `research/build-readiness/` becomes historical input.

---

## 0.0 Phase Acceptance Gate

All sixteen must be true, each with evidence recorded in `SPEC-v1.0.md` § Acceptance.

| # | Condition | Evidence required | Status |
|---|---|---|---|
| 1 | Zero known contradictions across specs | register: 0 rows in OPEN/PROPOSED | ☐ |
| 2 | Maria's ground truth is temporally possible | every date arithmetic re-derived | ☐ |
| 3 | Every field referenced by rules exists in the schema | field-reference matrix | ☐ |
| 4 | Every API property has one unambiguous meaning | glossary ↔ contract diff | ☐ |
| 5 | Patient priority and gap priority are distinct | two field names, one scope each | ☐ |
| 6 | No unvalidated risk terminology remains | grep audit | ☐ |
| 7 | "Today" is deterministic for the benchmark | `evaluation_as_of_date` constant | ☐ |
| 8 | Ground truth is independent of detector output | authored from planted manifest | ☐ |
| 9 | Benchmark positives and negatives are intentionally designed | 10 hard-negative families | ☐ |
| 10 | Every surfaced gap requires verifiable evidence | `grounded=true` invariant | ☐ |
| 11 | No clinical decision can be created solely by the LLM | safety contract + schema | ☐ |
| 12 | Operational-impact claims are measured/modeled/sourced/scenario | claim classification | ☐ |
| 13 | Acceptance tests agree with the frozen specification | AT reconciliation table | ☐ |
| 14 | P0 contracts carry version identifiers | `versions.json` | ☐ |
| 15 | Specification changelog exists | `CHANGELOG.md` | ☐ |
| 16 | Specs tagged Continua Spec v1.0 | stamp in `SPEC-v1.0.md` | ☐ |

**Gate rule:** one unresolved P0 contradiction means Phase 0 fails. Partial credit does not exist here.

---

## 0.1 Build the Contradiction Register

→ writes `docs/spec/contradiction-register.md`

This is the working file for the whole phase. Everything else is downstream of it.

### States

```
OPEN → PROPOSED → RESOLVED → VERIFIED → FROZEN
```

| State | Means | Exit requirement |
|---|---|---|
| OPEN | Contradiction confirmed, no agreed resolution | Propose in the owning sub-phase |
| PROPOSED | Resolution designed, not written into a contract | Write it into `docs/spec/` |
| RESOLVED | Written in the canonical contract | Re-read the affected docs for knock-on effects |
| VERIFIED | Re-read: no residual reference, no second occurrence | Add a mechanical check (grep/test) |
| FROZEN | Check is automated or the term is impossible to reintroduce | Included in `SPEC-v1.0.md` |

Every row carries: ID, severity, contradiction, required resolution, current state, owning file.

### Register

Severity: **BLOCKER** = do not build on it. **HIGH** = produces wrong output or a false claim. **MED** = inconsistency or ambiguity.

| ID | Sev | Contradiction | Required resolution | State |
|---|---|---|---|---|
| C-001 | BLOCKER | Maria's tamoxifen monitoring window is 365 days; only 44 days elapsed by 2026-06-05 | Removed as a detected gap; tamoxifen is context only; Rule 3 gets a hard "not-yet-elapsed = not a gap" clause | VERIFIED |
| C-002 | BLOCKER | Maria's ground truth claimed 3 gaps while one was not temporally a gap | Third gap rebuilt as an overdue metformin→A1c/BMP window; ground truth re-derived from dates | VERIFIED |
| C-003 | HIGH | API exposed `risk_level` despite the decision not to claim clinical risk | Deleted from model, API, UI, tests (AT-7.5) | VERIFIED |
| C-004 | HIGH | `priority_score` could mean gap score 84 or patient score 89 | Split into `gap_priority_score` and `patient_priority_score` | VERIFIED |
| C-005 | HIGH | API examples showed Maria `priority_score: 84` while the seed case computed 89 | All examples regenerated; canon is 70 / 74 | VERIFIED |
| C-006 | BLOCKER | Duplicate detector used `intentional_series`, undefined in the schema | Replaced with evidence-backed `series_status: explicit_series \| explicit_one_off \| unknown` | VERIFIED |
| C-007 | HIGH | "12 min → 8 sec" reads as measured but mixes a scenario baseline with system latency | Four claim classes; `counted` / `baseline` / `measured` / `modeled` never merged | VERIFIED |
| C-008 | HIGH | ~80 gaps on ~20 positive patients = unrealistic concentration | Rebalanced to 40 positive / 40 negative / 70 gaps | VERIFIED |
| C-009 | HIGH | `today_or_latest_record_date` makes temporal results implementation-dependent | Freeze `evaluation_as_of_date = 2026-06-05`; ban the runtime clock in gap logic | **OPEN** |
| C-010 | HIGH | Maria's follow-up was described as "45 days overdue" while the arithmetic gave a different number | Root cause: the imaging date (2026-04-18) was mistaken for the referral date. Referral is R4 = 2026-03-25 → due 2026-05-09 → **27 days overdue** on 2026-06-05. Wording fixed everywhere | VERIFIED |
| C-011 | HIGH | Duplicate rule expects `test_name_normalized` for imaging, but imaging has modality/body region | Separate duplicate keys: lab `test_name_normalized`; imaging `modality_normalized + body_region_normalized` | **OPEN** |
| C-012 | MED | Gap shape carries `overdue_days` for duplicates, where "overdue" is meaningless | Type-specific metadata; duplicates use `days_between`, never `overdue_days` | PROPOSED |
| C-013 | HIGH | Grounding is described as "verbatim" in one place and fuzzy ≥0.85 in another | Two verification levels (A exact / B fuzzy) with `verification_method` exposed | **OPEN** |
| C-014 | MED | `source_span ≤ 300 chars` may truncate evidence the UI must show | Extract `source_span` (≤300) + `source_excerpt` (≤500) with separate rules | **OPEN** |
| C-015 | HIGH | Action verb list includes "schedule", but the product never schedules | Replace with "coordinate scheduling" — a coordinator action, not a system action | **OPEN** |
| C-016 | MED | `estimated_cost_avoided_usd: 45` has no frozen source or calculation | Remove, or classify as `modeled` with a visible formula | **OPEN** |
| C-017 | HIGH | `/api/eval` returns `ground_truth_gaps: 80` while the eval spec says 70 | Manifest is canonical; all examples generated from it | **OPEN** |
| C-018 | MED | Contracts say UUID ids; fixtures and acceptance tests use `P-001-maria`, `R4` | Machine ids UUID; fixtures use stable `display_id` + doc keys (`R1…R8`) | PROPOSED |
| C-019 | HIGH | Extraction output allows free-text `notes` despite "no free text" | Rename to `extractor_note`; schema states no downstream rule may read it | **OPEN** |
| C-020 | HIGH | Drug→lab monitoring windows are hardcoded clinical assumptions presented as fact | Label them `synthetic_demo_policy_v1`; not a clinical guideline; versioned | PROPOSED |
| C-021 | HIGH | **New.** Panel/metrics examples report 67 gaps and 39 flagged patients; the benchmark is 70 gaps / 40 positives | Examples marked illustrative and regenerated from the manifest; no unlabeled count survives | **OPEN** |
| C-022 | HIGH | **New.** Field names drift: `type` vs `gap_type`, `recommended_action` vs `recommended_coordinator_action`, `detector: referral_engine_v1` vs `detector_version: gaps-v1` | One name per concept, frozen in `gap-contracts.md` | **OPEN** |
| C-023 | HIGH | **New.** `date` vs `event_date`, `confidence` vs `extraction_confidence` across schema, API, and priority engine | Frozen to the schema names in 0.5 | **OPEN** |
| C-024 | MED | **New.** Two different confidences are both called "confidence": LLM extraction (0.96) and span verification (1.0) | `extraction_confidence` and `verification_score` kept distinct; `evidence_confidence = extraction × verification` stated once | PROPOSED |
| C-025 | HIGH | **New.** Maria's `last_contact_date` is 2026-04-20 in the patient list and 2026-04-28 on the detail endpoint | Canon is 2026-04-28 (R8). Both endpoints read one field | **OPEN** |

**Counts:** 25 rows total — 9 VERIFIED (carry-in), 12 OPEN, 4 PROPOSED, 0 FROZEN.

**Carry-in:** C-001 – C-008 and C-010 were corrected in research documents but have no version stamp, so they are VERIFIED, not FROZEN. **Remaining to close: 16 rows** — C-009, C-011, C-012, C-013, C-014, C-015, C-016, C-017, C-018, C-019, C-020, C-021, C-022, C-023, C-024, C-025. Every row must reach FROZEN before the gate; a VERIFIED row needs only the consolidated contract plus its mechanical check.

**Rule for new discoveries:** any contradiction found later is appended here with the next free ID. It is never fixed silently.

---

## 0.2 Canonical Vocabulary

→ writes `docs/spec/terminology.md`

Freeze language before fixing files, or the same concept reappears under three names.

### Allowed

Care Coordinator · Continuity Gap · Intervention Priority · Gap Priority · Patient Priority · Evidence Confidence · Extraction Confidence · Recommended Coordinator Action · Grounded · Verified Evidence · Priority Band

### Prohibited (until the capability genuinely exists)

Clinical Risk Score · Patient Risk Score · AI Diagnosis · AI Treatment · "AI knows" · "AI decided" · Clinically Validated · Epic-connected · HIPAA-compliant (as a deployment claim)

### Priority names (frozen)

| Field | Scope |
|---|---|
| `gap_priority_score` | one gap, only inside a gap object or `top_gap` |
| `patient_priority_score` | the patient's queue rank |
| `priority_band` | CRITICAL / HIGH / MEDIUM / LOW |
| `priority_breakdown` | the visible factor arithmetic |

`priority_score` unlabeled is **forbidden** — it is the exact bug that produced 84 vs 89.

### Grep gate

```bash
grep -rn "risk_level\|risk score\|priority_score" docs/spec data/spec | grep -v "forbidden\|prohibited\|MUST NOT\|historical"
```

Expected: zero output. Any hit must be an explicit prohibition or a changelog entry.

---

## 0.3 Freeze Temporal Semantics

→ writes `docs/spec/temporal-semantics.md`

Healthcare gap detection is temporal. One clock, defined once.

### 0.3.1 Canonical benchmark date

```
evaluation_as_of_date = 2026-06-05      # continua-eval-v1
```

- Never `new Date()`, `Date.now()`, or "latest record date" inside benchmark gap logic. A test that passes today must pass in 2028.
- The runtime clock may stamp `generated_at` and `measured_at`. It may never feed a gap decision.
- Every benchmark artifact records `evaluation_as_of_date`.

### 0.3.2 Formal definitions

| Quantity | Definition |
|---|---|
| `due_date` (referral) | `referral_date + expected_window_days` |
| `due_date` (monitoring) | `medication_start_date + monitoring_window_days` |
| `overdue_days` | `max(0, as_of_date − due_date)` |
| `days_remaining` | `max(0, due_date − as_of_date)` |
| `days_between` (duplicate) | `later_date − earlier_date` |

Maria's arithmetic, re-derived (this is the check that C-010 failed):

| Event | Date | Window | Due | As of | Overdue |
|---|---|---|---|---|---|
| Oncology referral (R4) | 2026-03-25 | 45 d | 2026-05-09 | 2026-06-05 | **27 d** |
| Metformin start (R1) | 2026-02-10 | 90 d | 2026-05-11 | 2026-06-05 | **25 d** |
| Tamoxifen start (R7) | 2026-04-22 | 365 d | 2027-04-22 | 2026-06-05 | 0 — **321 d remaining** |
| CBC pair (R6, R8) | 2026-04-20 → 2026-04-28 | 14 d | n/a | 2026-06-05 | n/a — `days_between = 8` |

The string "45 days overdue" must not appear anywhere. 45 is the **window**, 27 is the **overdue**. Conflating them was a blocker-level defect in an earlier draft.

### 0.3.3 Temporal states

```
OPEN · DUE_SOON · OVERDUE · RESOLVED
```

| State | Condition | Emits a gap? |
|---|---|---|
| RESOLVED | matching event inside the window | No |
| DUE_SOON | as-of before `due_date`, `days_remaining ≤ 7` | No — `pending_monitoring` / early-warning note only |
| OPEN | as-of before `due_date`, more than 7 days remaining | No |
| OVERDUE | `overdue_days > 0` and no matching event | **Yes** |

This is the mechanism that makes "not yet elapsed" structurally impossible to report as a gap — not a convention, a state machine.

### 0.3.4 Required test-case shape

Every temporal detector case (unit test, adversarial table, acceptance test) must specify all seven:

```json
{
  "trigger_date": "2026-03-25",
  "window_days": 45,
  "due_date": "2026-05-09",
  "as_of_date": "2026-06-05",
  "state": "OVERDUE",
  "overdue_days": 27,
  "expected": "gap"
}
```

A case missing `as_of_date` is not a valid test.

---

## 0.4 Repair Maria, the Golden Demo Case

→ writes `data/spec/maria-golden-case.json` (+ § Maria in `SPEC-v1.0.md`)

Maria is too important to stay internally inconsistent. She must satisfy the frozen rules, not be arranged around them.

### 0.4.1 Preserve

Oncology storyline · imaging · referral · unresolved oncology follow-up · duplicate CBC · tamoxifen as clinical context (R7).

### 0.4.2 Remove

"Tamoxifen started 2026-04-22 → missed annual follow-up" as a **currently overdue** gap. It has not matured. It is retained as:

```
state: OPEN · days_remaining: 321 · reported_as: pending_monitoring · counted_in_ground_truth: false
```

### 0.4.3 Replace the third detector case

Maria still needs to exercise `med_monitoring`, and the case must genuinely satisfy the rule:

```
Medication start (metformin 2026-02-10)
  → explicit demo monitoring policy (A1c + BMP, 90 days)
  → window expires 2026-05-11
  → no A1c/BMP in [start, due]
  → 25 days overdue on as-of date  →  GAP
```

The medication→monitoring mapping is labeled a **synthetic benchmark policy** (`synthetic_demo_policy_v1`), not an authoritative clinical guideline. Using it as a medical guideline would require separate clinical-source validation, which this project does not have and does not claim.

### 0.4.4 Golden-case assertions

| Gap | Type | Trigger | Due | Overdue | Severity | Score | Band |
|---|---|---|---|---|---|---|---|
| G1 | `missed_followup` | referral R4, 2026-03-25 | 2026-05-09 | 27 | high | **70** | CRITICAL |
| G2 | `duplicate_test` | CBC R6/R8, 8 d apart, 2 providers | n/a | n/a (`days_between = 8`) | low | **11** | LOW |
| G3 | `med_monitoring` | metformin R1, 2026-02-10 | 2026-05-11 | 25 | med | **37** | MEDIUM |

Patient: `patient_priority_score = 74` → CRITICAL. Three gaps, no tamoxifen gap, no fourth gap.

Full arithmetic is checked in 0.8; the JSON file must carry the factor breakdown, not just the totals.

### 0.4.5 Golden Gate

A human reading Maria's eight documents, **without access to detector output**, must independently derive all three labels: no oncology consult after the referral, two CBCs eight days apart with no documented series intent, and no A1c/BMP in the metformin window.

Test: hand the eight documents to someone who has not read the rules. If they produce a fourth gap or miss one, either the documents or the labels are wrong. Fix the case, never the rules.

---

## 0.5 Unify the Clinical Event Schema

→ writes `docs/spec/clinical-event-schema.md`

The schema is the boundary between probabilistic extraction and deterministic logic. One shape, one set of names.

### 0.5.1 Base structure (final)

```json
{
  "event_id": "uuid (deterministic, seeded)",
  "patient_id": "uuid",
  "display_id": "P-001-maria",
  "event_date": "YYYY-MM-DD",
  "date_precision": "day | month | year",
  "event_type": "surgery | imaging | consult | lab_result | medication_start | medication_stop | referral | followup",
  "provider": "Dr. A. Patel — Primary Care",
  "provider_type": "pcp | specialist | lab | imaging | pharmacy | other",
  "source_doc_id": "uuid (required, must exist)",
  "source_span": "≤300 chars, extracted verbatim span",
  "source_excerpt": "≤500 chars, display context around the span",
  "extraction_confidence": 0.0,
  "phase": "Surgery | Radiology | Oncology | Labs | Medications | Follow-up",
  "typed": { }
}
```

### 0.5.2 Rename table (closes C-022, C-023, C-019)

| Old | New | Why |
|---|---|---|
| `date` | `event_date` | disambiguates from due/trigger dates |
| `confidence` | `extraction_confidence` | distinct from `verification_score` (C-024) |
| `notes` (extraction output) | `extractor_note` | no downstream rule may read it (C-019) |
| `type` (gap) | `gap_type` | matches `gap_priority_score` naming |
| `recommended_action` | `recommended_coordinator_action` | names the actor |
| `detector: "referral_engine_v1"` | `detector_version: "gaps-v1"` | one version constant (0.15) |

### 0.5.3 Repeated-test intent

Do **not** ask the model whether a repeat was medically necessary. Extract only explicit language:

| `series_status` | Set only when | Example |
|---|---|---|
| `explicit_series` | the document states an ongoing/repeating schedule | "Weekly CBC for 6 weeks" |
| `explicit_one_off` | the document states a single occurrence | "One-time CBC today" |
| `unknown` | **default** — nothing addresses repetition | "CBC with differential: WBC 5.8…" |

Only `explicit_series` suppresses a duplicate candidate. `unknown` does **not** exempt: a safety tool surfaces the repeat for human review. Never infer.

### 0.5.4 Duplicate identifiers (closes C-011)

| Test class | Key |
|---|---|
| Lab | `test_name_normalized` (alias map, deterministic) |
| Imaging | `modality_normalized` + `body_region_normalized` |

```
MRI-brain  ≠  MRI-spine          # same modality, different region → not a duplicate
CT-chest   =  CT-chest           # same modality + region → duplicate candidate
```

`test_name_normalized` on an imaging event is an error, not an empty string.

### 0.5.5 Validation rules

- `source_doc_id` exists for that patient; otherwise the event is dropped.
- `source_span` matches the source document (see 0.7 levels).
- `event_date` valid; within [1900-01-01, as_of + 1 day].
- `extraction_confidence` ∈ [0,1]; `event_type` ∈ enum; `series_status` ∈ enum, anything else coerced to `unknown`.
- Invalid events are dropped and logged; never partially accepted.

---

## 0.6 Freeze Gap Contracts

→ writes `docs/spec/gap-contracts.md`

Do not force three fundamentally different detectors into identical properties. `overdue_days` on a duplicate test is a category error.

### Shared fields

```json
{
  "gap_id": "uuid",
  "patient_id": "uuid",
  "gap_type": "missed_followup | duplicate_test | med_monitoring",
  "severity": "high | med | low",
  "title": "string",
  "why": "one factual sentence, dates included, no clinical judgment",
  "evidence": [ { "doc_id": "uuid", "event_id": "uuid", "quoted_span": "string", "verification_method": "exact | fuzzy", "verification_score": 1.0 } ],
  "recommended_coordinator_action": "Verify | Contact | Review | Coordinate | Confirm | Reconcile … for coordinator verification.",
  "gap_priority_score": 70,
  "priority_band": "CRITICAL",
  "priority_breakdown": { },
  "grounded": true,
  "detector_version": "gaps-v1"
}
```

### Type-specific metadata

**Missed follow-up**

```json
{ "specialty": "oncology", "referral_date": "2026-03-25", "expected_window_days": 45,
  "due_date": "2026-05-09", "overdue_days": 27, "state": "OVERDUE" }
```

**Duplicate diagnostic test**

```json
{ "normalized_test": "cbc", "test_class": "lab", "first_date": "2026-04-20",
  "second_date": "2026-04-28", "days_between": 8, "repeat_count": 2,
  "series_status": "unknown" }
```

**Medication monitoring**

```json
{ "medication": "metformin", "start_date": "2026-02-10", "monitoring_item": ["a1c", "bmp"],
  "monitoring_window_days": 90, "due_date": "2026-05-11", "overdue_days": 25,
  "state": "OVERDUE", "policy_version": "synthetic_demo_policy_v1" }
```

**Rule:** a field appears only in the block where it has meaning. `overdue_days` may not appear on a duplicate gap; `days_between` may not appear on a follow-up gap.

---

## 0.7 Freeze Evidence Semantics

→ writes `docs/spec/evidence-contract.md`

"Verbatim" and "fuzzy ≥0.85" are two different claims. Separate them.

### Verification levels

| Level | Name | Condition | `verification_score` |
|---|---|---|---|
| A | `exact` | normalized quoted span appears in normalized source | `1.0` |
| B | `fuzzy` | similarity ≥ 0.85 after whitespace/OCR/date-format normalization | the measured similarity |
| — | UNGROUNDED | similarity < 0.85, or doc id missing | n/a — gap suppressed |

```
grounded = (verification_method == "exact") or (verification_method == "fuzzy" and verification_score >= 0.85)
```

- Expose `verification_method` internally and in `/api/evidence`.
- Suppression is silent to the user and loud in logs: an ungrounded candidate is dropped and counted as a miss in the benchmark, never shown with a warning badge.
- **Absence evidence** (no consult found in window) is stated as an explicit absence assertion with the searched interval — never rendered as a fabricated citation.

### Span vs excerpt (closes C-014)

| Field | Limit | Purpose |
|---|---|---|
| `source_span` | ≤ 300 chars | the minimal citation that supports the event |
| `source_excerpt` | ≤ 500 chars | surrounding context for the evidence drawer |

The UI shows the span as the citation and the excerpt as context. If the span would need > 300 chars to be meaningful, the extraction is wrong — split the event.

### Confidence relationship (closes C-024)

```
evidence_confidence = extraction_confidence × verification_score
```

- `extraction_confidence` — mean confidence of the events the rule used.
- `verification_score` — grounding score from this contract (1.0 exact, similarity if fuzzy).
- Both are stored; only their product enters priority.

### P0 trust gate

Every displayed gap has `grounded = true`. There is no UI state that renders a gap whose evidence failed verification.

---

## 0.8 Freeze Intervention Priority

→ writes `docs/spec/priority-engine.md`

Intentionally boring and inspectable. No hidden terms.

### Gap priority (v1, locked)

```
gap_raw = severity_weight × overdue_factor × evidence_confidence × actionability_weight × gap_type_weight
display  = round(100 × gap_raw / 2.0)
```

| Factor | Range | Exact calculation | Rationale | Version |
|---|---|---|---|---|
| `severity_weight` | 0.30–1.00 | high 1.00 · med 0.60 · low 0.30 | how consequential the gap type is, per the rule's own severity | priority-v1 |
| `overdue_factor` | 1.00–2.00 | `1 + min(overdue_days / 60, 1)`; duplicates use `days_between` as proxy | urgency grows with days open, capped so an ancient gap cannot dominate forever | priority-v1 |
| `evidence_confidence` | 0.00–1.00 | `extraction_confidence × verification_score` | weak evidence should not top the queue | priority-v1 |
| `actionability_weight` | 0.75–1.00 | follow-up 1.00 · monitoring 0.95 · duplicate 0.75 | can the coordinator resolve this with one action today | priority-v1 |
| `gap_type_weight` | 0.90–1.00 | follow-up 1.00 · monitoring 0.97 · duplicate 0.90 | tie-breaker only | priority-v1 |

### Patient priority (locked)

```
patient_raw = max(gap_raw) + 0.10 × min(sum(other gap_raw), 0.5)
display     = round(100 × patient_raw / 2.0)
```

Bands: CRITICAL ≥ 70 · HIGH 50–69 · MEDIUM 30–49 · LOW < 30. If `evidence_confidence < 0.60`, cap the band at MEDIUM regardless of score.

### Worked example — must reproduce exactly

| Gap | Substitution | Raw | Display | Band |
|---|---|---|---|---|
| G1 follow-up | `1.00 × 1.45 × 0.96 × 1.00 × 1.00` | 1.3920 | **70** | CRITICAL |
| G2 duplicate | `0.30 × 1.1333 × 0.94 × 0.75 × 0.90` | 0.2157 | **11** | LOW |
| G3 monitoring | `0.60 × 1.4167 × 0.95 × 0.95 × 0.97` | 0.7441 | **37** | MEDIUM |
| Patient | `1.3920 + 0.10 × (0.7441 + 0.2157)` | 1.4880 | **74** | CRITICAL |

These four numbers are a contract. A code change that alters any of them fails Phase 8 and is a spec revision, not a tuning tweak.

### No hidden bonus

There is no oncology bonus, no demo bonus, no "Maria must be #1" term. If Maria does not rank first after the frozen rules run on the frozen dataset, the honest responses are, in order: (1) the dataset has a bug, fix Phase 2; (2) the rules have a bug, fix Phase 6 with a version bump; (3) the story changes. Weight manipulation is not on the list.

### Determinism

- Pure function `computePriority(gap, as_of_date)` — no clock, no LLM, no randomness.
- Constants live in one config module with the tables above as defaults.
- No score may be displayed without its breakdown reachable in one interaction.

---

## 0.9 Benchmark Distribution Design

→ writes `data/spec/benchmark-manifest.json` (+ § Benchmark in `evaluation-spec.md`)

### Composition

| Property | Target | Tolerance | Canonical source |
|---|---|---|---|
| Patients | 80 | fixed | manifest |
| Patients with ≥1 gap | 40 | 35–45 | manifest |
| Gap-free patients | 40 | 35–45 | manifest |
| Total gaps | 70 | 60–80 | manifest |
| — missed follow-up | 28 | — | manifest |
| — duplicate test | 22 | — | manifest |
| — medication monitoring | 20 | — | manifest |

**The generated manifest is canonical.** If generation yields 68 gaps, the spec, API examples, and AT-12 assertions all say 68. Symmetry is not a reason to plant a gap; a round number is not evidence. (C-017 and C-021 both came from freezing an aspirational count.)

### Ten mandatory hard-negative families

Each family needs ≥3 cases and a manifest tag. "Exists in eval-spec v1" is checked against the current document.

| # | Family | v1 coverage | Action |
|---|---|---|---|
| 1 | Completed specialist referral (consult inside window) | ✅ 10 cases | keep |
| 2 | Referral satisfied, but a *different*-specialty consult sits nearby | ⚠️ only the positive trap exists | add ≥3 negatives |
| 3 | Referral still inside its window | ❌ | add ≥3 |
| 4 | Repeated lab explicitly `explicit_series` | ✅ 8 | keep |
| 5 | Same-day duplicate representation (same order, two docs) | ❌ | add ≥3 |
| 6 | Imaging same modality, different body region | ❌ | add ≥3 |
| 7 | Medication stopped before the monitoring due date | ✅ 6 | keep |
| 8 | Monitoring completed under an alias ("HbA1c" → `a1c`) | ⚠️ aliases exist only on the positive side | add ≥3 |
| 9 | Monitoring result exactly on the boundary (day `due_date − 1` and `due_date`) | ❌ | add ≥4 |
| 10 | Malformed / untraceable extracted event | ❌ | add ≥3 |

Gate: 10/10 families present, each with a named manifest id. A family without a case is an untested claim.

### Label independence

Ground truth is authored from the generator's **planted-gap manifest**, never from pipeline output, and never by reading detector code. Write it before the first pipeline run; after that the data and labels are frozen (`continua-synth-v1` / `continua-eval-v1`).

---

## 0.10 Freeze Evaluation Semantics

→ writes `docs/spec/evaluation-spec.md`

Evaluation answers two separate questions. Merging them lets a good extractor hide a bad detector, or vice versa.

### A. Extraction evaluation

Did the LLM reconstruct facts correctly? Measured on a hand-labeled subset (~10 patients):

| Dimension | Definition |
|---|---|
| Event type accuracy | correct `event_type` per matched event |
| Date accuracy | exact date match; month-precision counted separately |
| Entity accuracy | correct normalized test / drug / specialty |
| Source linkage | `source_doc_id` correct |
| Span validity | `verification_method` not UNGROUNDED |

### B. Gap evaluation

Did the deterministic rules identify the correct gaps? Per type: precision, recall, F1; plus macro F1, micro F1, grounding accuracy, unsupported-claim rate, latency.

### Matching rule (v2 — closes the "too forgiving" gap)

A reported gap matches a ground-truth gap only if:

1. `patient_id` equal, **and**
2. `gap_type` equal, **and**
3. **trigger identity** equal — referral specialty + referral date for follow-up; normalized test + first/second date for duplicates; medication + monitoring item + due date for monitoring, **and**
4. evidence overlap: ≥1 cited `source_doc_id` in the ground truth's `source_doc_ids`.

Matching is one-to-one, greedy, best overlap first. This prevents a patient with two same-type gaps from getting incidental credit.

### Clock rule

The runner passes `evaluation_as_of_date` explicitly. Nothing in the matching or detection path calls the system clock.

### Results discipline

The results table stays empty until the pipeline runs. Zeros are not results; `status: "not_run"` is.

---

## 0.11 Claim Classification

→ writes § Claims in `SPEC-v1.0.md` + `docs/CLAIMS.md`

Four classes, never visually identical:

| Class | Example | Rule |
|---|---|---|
| `measured` | macro F1, grounding %, p50 latency | from a run; never typed by hand |
| `modeled` | coordinator hours redirected | arithmetic shown; labeled modeled |
| `scenario_assumption` | 12-minute manual review baseline | `baseline_type: "scenario_assumption"`, source noted |
| `external_statistic` | industry cost of coordination failure | citation required; not our measurement |

```json
{
  "processing_latency": { "value_sec": 8.2, "classification": "measured" },
  "manual_review_baseline": { "value_min": 12, "classification": "scenario_assumption" },
  "modeled_time_saved_hours": { "value": 14.9, "classification": "modeled",
    "formula": "(baseline_review_time_min − measured_summary_latency_sec/60) × patients_reviewed / 60" }
}
```

Any number without a class is a defect. `modeled` is `null` with `status: "not_measured"` when `measured` is absent.

---

## 0.12 API Contract Freeze

→ writes `docs/spec/api-contract-v1.md`

After 0.2–0.11 are frozen, regenerate **every** example. Do not hand-patch examples; generate them from `maria-golden-case.json` and `benchmark-manifest.json` where possible.

| Change | Detail |
|---|---|
| DELETE `risk_level` | everywhere (C-003) |
| DELETE bare `priority_score` | replaced by the two scoped fields (C-004) |
| DELETE `estimated_cost_avoided_usd` | or re-add as `modeled` with formula (C-016) |
| ADD `patient_priority_score` / `gap_priority_score` | scoped per 0.2 |
| ADD `evaluation_as_of_date` | every clinical response |
| ADD `verification_method` | in `/api/evidence` items (0.7) |
| ADD `classification` | every metric value (0.11) |
| ADD `versions` block | dataset / eval / extractor / detector / priority |
| FIX `ground_truth_gaps` | value from the manifest — currently 80, must be 70 (C-017) |
| FIX panel `gap_counts` + `flagged_patient_count` | generated from the manifest, or marked illustrative (C-021) |
| FIX Maria `last_contact_date` | 2026-04-28 in **both** endpoints (C-025) |
| RENAME fields | per 0.5.2 / 0.6 |
| PRESERVE `disclaimer` | every response with clinical content |
| PRESERVE `grounded`, `detector_version` | evidence trust surface |

**Version:** `API Contract v1`. No response-shape change during implementation without a contract revision and a changelog entry.

---

## 0.13 Acceptance-Test Reconciliation

→ writes `docs/spec/acceptance-tests.md`

Re-read every AT against every frozen contract. Do not merely edit failing expectations — for each mismatch decide:

```
TEST_WRONG      the test encoded a stale contract  → change the test
IMPL_RISK       the test is right, code would drift → keep, add fixture
KEEP            test already matches the frozen spec
```

| AT | Issue | Decision |
|---|---|---|
| AT-5.5 | `series_status` semantics | KEEP; add `explicit_one_off` case |
| AT-5.6 | asserts the removed tamoxifen gap | **TEST_WRONG** → rewrite for metformin (due 2026-05-11, 25 d) |
| AT-5.6b | not-yet-elapsed must not flag | KEEP; pin `as_of_date` explicitly |
| duplicate/imaging AT *(id to confirm on re-read)* | assumes a single lab-style key for imaging | KEEP intent; rewrite the key as `modality_normalized + body_region_normalized` (C-011) |
| AT-7.5 | no `risk_level` | KEEP |
| AT-7.6 | gap vs patient score separation | KEEP; assert both names in one response |
| AT-7.7 | *(new)* every displayed gap is `grounded=true` with a `verification_method` | ADD |
| AT-8.x | Maria's rank | **IMPL_RISK** → assert derivation from frozen manifest; no hardcoded rank |
| AT-11.1–11.3 | measured vs modeled separation | KEEP; add `classification` assertions |
| AT-12.5 / 12.6 | benchmark composition | **TEST_WRONG if it asserts 80** → assert manifest values |
| AT-E2E | end-to-end path | KEEP; point at the corrected Maria case |

Deliverable of this sub-phase: every AT maps to a requirement ID in `SPEC-v1.0.md` (target 100% of P0 tests) and every safety requirement in 0.14 has at least one test.

---

## 0.14 Safety Contract

→ writes `docs/spec/safety-contract.md`

### Continua MAY

Extract · normalize · identify rule matches · prioritize coordinator workflow · surface evidence · suggest coordinator workflow actions · explain a computed priority.

### Continua MUST NOT

Diagnose · prescribe · discontinue medication · determine treatment · autonomously order testing · claim clinical validation · imply real EHR connectivity · process real PHI in the MVP · schedule anything on its own.

### Human gate

Every recommendation semantically resolves to **review / verify / coordinate**. The coordinator is the decision-maker; the system orders attention, nothing else.

### Enforcement points (frozen here, built later)

| Point | Phase |
|---|---|
| Action-language allowlist in generated text | 15 |
| Static copy lint | 15 |
| API `disclaimer` on clinical responses | 11 |
| "For coordinator verification" on every gap | 12 |
| Safety regression suite mapping each MUST NOT to a test | 15 |

---

## 0.15 Versioning & Change Control

→ writes `data/spec/versions.json`

```json
{
  "spec_version": "1.0",
  "dataset_version": "continua-synth-v1",
  "eval_version": "continua-eval-v1",
  "extractor_version": "extractor-v1",
  "detector_version": "gaps-v1",
  "priority_version": "priority-v1",
  "api_version": "v1",
  "evaluation_as_of_date": "2026-06-05"
}
```

Every benchmark run records this block verbatim. A metric without its version stamp is not evidence.

Change control:

- Rule, threshold, or formula change → bump the relevant version, add a changelog entry, re-run the benchmark.
- Contract shape change → bump `api_version`, regenerate examples.
- Silent edits to frozen contracts are forbidden; the register is the only place a contradiction may be closed.

---

## 0.16 Final Cross-Document Audit

→ writes `docs/spec/audit-report.md`

Mechanical, not attentional. Every hit classified: **VALID** · **STALE** · **CONTRADICTORY** · **HISTORICAL**. No unexplained hit survives.

The audit runs as a shell block during this phase (the repo does not exist yet); Phase 1 installs the same commands as `scripts/spec-audit.sh` and wires it into CI.

```bash
grep -rn "risk_level\|risk score\|priority_score\|45 days overdue\|tamoxifen\|365\|intentional_series\|today_or_latest\|test_name_normalized\|epic\|fhir\|clinical validation\|12 minutes\|8 seconds\|80 gaps" docs/spec data/spec research
```

| Term | Allowed only as | Must never be |
|---|---|---|
| `risk_level` | prohibition / changelog | a field |
| `priority_score` | prohibition / changelog (as part of the two scoped names) | a bare field |
| `45 days overdue` | HISTORICAL (the C-010 defect) | current copy |
| `tamoxifen` | context, `pending_monitoring`, 321 days remaining | a detected gap |
| `365` | the tamoxifen window | an overdue window |
| `intentional_series` | HISTORICAL (C-006) | a field |
| `today_or_latest` | HISTORICAL (C-009) | logic |
| `epic` / `fhir` | roadmap, explicitly not implemented | integration claim |
| `clinical validation` | only in "not clinically validated" | a claim |
| `12 minutes` | `scenario_assumption` | measured |
| `8 seconds` | measured only, pulled from data | hardcoded copy |
| `80 gaps` | HISTORICAL (pre-Fix 4) | benchmark count |

For each hit: line, class, and the register ID that authorises it. Any CONTRADICTORY hit blocks the gate.

---

## 0.17 Phase 0 Benchmark

Phase 0 is not scored on AI accuracy. It is scored on specification consistency.

| Metric | Gate | Actual |
|---|---|---|
| Known unresolved contradictions | 0 | — |
| Undefined rule-referenced fields | 0 | — |
| Ambiguous shared-field semantics | 0 | — |
| Invalid golden-case labels | 0 | — |
| API / test expectation conflicts | 0 | — |
| Unclassified performance claims | 0 | — |
| Missing source linkage in the golden case | 0 | — |
| P0 acceptance tests mapped to requirements | 100% | — |
| Hard-negative families specified | 10 / 10 | — |
| Safety requirements represented in tests | 100% | — |

Fill the "Actual" column during execution; it is evidence, not decoration.

---

## 0.18 Package v1.0

Deliverable tree (see Output). Then:

```md
CONTINUA SPECIFICATION v1.0: FROZEN
Date: <date>
Register: 0 OPEN · 0 PROPOSED · all rows FROZEN
Versions: dataset continua-synth-v1 · eval continua-eval-v1 · extractor-v1 · detector gaps-v1 · priority-v1 · API v1
As-of date: 2026-06-05
```

### Definition of done

A developer who has never read any prior conversation can answer, from `SPEC-v1.0.md` plus its machine-readable contracts:

1. What data exists.
2. What the LLM may extract.
3. What it may not decide.
4. How each gap is detected.
5. How evidence is verified.
6. How priority is calculated.
7. What the API returns.
8. How correctness is measured.
9. What claims may be made.
10. What safety boundary applies.
11. Exactly what must pass.

If any answer requires "well, it depends who you ask", the spec is not frozen.

---

## 0.19 Execution Order

The dependency order matters. Fixing API examples before Maria, temporal semantics, gap contracts, and priority are frozen means rewriting them repeatedly.

```
0.1  contradiction register
  ↓
0.2  vocabulary
  ↓
0.3  temporal semantics
  ↓
0.4  Maria golden case
  ↓
0.5  clinical-event schema
  ↓
0.6  gap contracts
  ↓
0.7  evidence contract
  ↓
0.8  priority engine
  ↓
0.9  benchmark distribution
  ↓
0.10 evaluation semantics
  ↓
0.11 claim classification
  ↓
0.12 API contract
  ↓
0.13 acceptance tests
  ↓
0.14 safety contract
  ↓
0.15 versioning
  ↓
0.16 cross-document audit
  ↓
0.17 phase-0 benchmark
  ↓
0.18 package v1.0
```

### Working protocol (one sub-phase at a time)

1. Pick the next sub-phase. Do not skip ahead: 0.12 depends on 0.2–0.11.
2. Write its output file.
3. Move the affected register rows forward one state and record the evidence.
4. Run the mechanical check for that sub-phase (grep, arithmetic, JSON parse).
5. Commit: `spec(0.N): <what froze>`.
6. Move on. Do not batch sub-phases — a batch hides which one broke.

---

## Deliverables

| Artifact | Purpose |
|---|---|
| `docs/spec/contradiction-register.md` | 25 rows, all FROZEN |
| `docs/spec/terminology.md` | allowed / prohibited / priority naming |
| `docs/spec/temporal-semantics.md` | as-of date, state machine, case shape |
| `data/spec/maria-golden-case.json` | machine-readable golden case + breakdown |
| `docs/spec/clinical-event-schema.md` | one schema, one naming |
| `docs/spec/gap-contracts.md` | shared + per-type metadata |
| `docs/spec/gap-rules.md` | the three detectors, windows, temporal states, false-positive protections |
| `docs/spec/evidence-contract.md` | Level A / B, suppression, span/excerpt |
| `docs/spec/priority-engine.md` | formula, factors, versions |
| `data/spec/benchmark-manifest.json` | canonical composition + 10 families |
| `docs/spec/evaluation-spec.md` | extraction vs gap eval, matching v2 |
| `docs/spec/api-contract-v1.md` | regenerated examples |
| `docs/spec/acceptance-tests.md` | reconciled ATs |
| `docs/spec/safety-contract.md` | MAY / MUST NOT / human gate |
| `data/spec/versions.json` | every version constant |
| `docs/spec/audit-report.md` | classified hits, zero unexplained |
| `docs/spec/SPEC-v1.0.md` | the frozen entry point |
| `docs/spec/CHANGELOG.md` | state transitions + decisions |

## Gate — exit criteria

- [ ] Register: 0 OPEN, 0 PROPOSED; every row FROZEN with evidence.
- [ ] `docs/spec/` contains all 15 files; `data/spec/` all 3; every JSON parses.
- [ ] Maria: 3 gaps, 70/11/37, patient 74, 27 d overdue, no tamoxifen gap (arithmetic re-derived by script).
- [ ] `scripts/spec-audit.sh` runs clean: no `risk_level`, no bare `priority_score`, no "45 days overdue", no `today_or_latest`, no `intentional_series` outside HISTORICAL.
- [ ] `evaluation_as_of_date` is a constant in every temporal test fixture; no clock read in the detection path.
- [ ] API examples regenerate from `maria-golden-case.json` + `benchmark-manifest.json`, and 70/40 are consistent across panel, metrics, and eval endpoints.
- [ ] 10/10 hard-negative families have manifest ids.
- [ ] Every P0 AT maps to a requirement; every safety MUST NOT has a test.
- [ ] `CONTINUA SPECIFICATION v1.0: FROZEN` stamped in `SPEC-v1.0.md`.

## Risks & failure modes

| Risk | Why it is tempting | Guard |
|---|---|---|
| Dataset engineered to make detectors perfect | makes the benchmark look great | hard negatives are mandatory, 10 families |
| Rules changed after seeing eval failures | fixes the number in one edit | changes are versioned; final set frozen |
| "Clinically plausible" drifting into "clinically validated" | judges respond to confidence | prohibited-term list + audit |
| Demo requirements leaking into truth | the story needs Maria at #1 | no bonus terms; rank is computed |
| LLM gradually acquiring decision authority | one "smart" prompt feels better | schema forbids it; safety contract + tests |
| Scenario assumptions presented as results | "12 min → 8 sec" is a great line | four claim classes, always labeled |
| Batch-fixing everything at the end | feels faster | one sub-phase per commit, register updated each time |

## Handoff to Phase 1

Phase 1 gets a versioned, contradiction-free contract set and builds the repository skeleton against it. The first thing Phase 1 writes is `lib/types.ts`, generated by hand from 0.5 and 0.6 — and it must compile with zero reinterpretation of these documents. If Phase 1 needs to ask a question the spec cannot answer, Phase 0 is not finished.
