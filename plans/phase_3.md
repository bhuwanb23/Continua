# Phase 3 — Ground Truth & Benchmark Construction

> Depends on: Phase 2 (dataset + planted manifest) · Unblocks: Phase 5, 6, 9
> Gate: **labels frozen before any pipeline tuning**

## Objective

Turn the planted manifest into an independent, versioned evaluation corpus. This phase exists separately from Phase 2 on purpose: the moment you label by looking at detector output, the benchmark stops measuring anything.

## Sub-phases

### 3.1 Gap-level ground truth

For every planted gap, record:

```json
{
  "gap_id": "gt-0001",
  "patient_id": "P-001-maria",
  "type": "missed_followup",
  "trigger_doc_ids": ["R4"],
  "supporting_doc_ids": ["R4"],
  "expected_window_days": 45,
  "expected_overdue_days": 27,
  "rationale": "Referral 2026-03-25; 45-day window elapsed 2026-05-09; no oncology consult by 2026-06-05."
}
```

Rules:
- `trigger_doc_ids` must exist in `records.json`.
- `rationale` must be readable by someone who has never seen the code.
- 70 entries total, ids sequential for auditability.

### 3.2 Event-level labels (extraction benchmark)

- Hand-label **10–15 patients** (~120–200 events) for extraction scoring.
- Per labeled event: `date`, `event_type`, `provider`, `test_name_normalized` / `drug_normalized` where applicable, `source_doc_id`.
- Choose patients that include hard normalization cases (aliases, dose-in-name), not just easy ones.
- Store as `data/eval-set/events-labeled.json`.

### 3.3 Negative labels (explicit non-gaps)

- List every case that **must not** produce a gap: completed referrals, explicit series, discontinued meds, not-yet-elapsed windows.
- Store as `data/eval-set/negatives.json` with `{patient_id, type, doc_ids, reason}`.
- These drive precision. Without them, precision is a vanity number.

### 3.4 Version the benchmark

- Directory: `data/eval-set/v1/` with `ground_truth.json`, `events-labeled.json`, `negatives.json`, `MANIFEST.md`.
- Version id: **`continua-eval-v1`**.
- `MANIFEST.md` records: generation seed, dataset checksum, labeler, date, and the rule "never edit after seeing outputs — create v2 instead."

### 3.5 Independence audit

Before freezing, verify:

- Labels were authored from `planted-manifest.json` + documents, not from any detector run.
- No label was adjusted to match a detector's output.
- Every label's doc ids resolve.
- Counts match Phase 2 exactly (70 / 28 / 22 / 20).

## Deliverables

| Artifact | Contents |
|---|---|
| `data/eval-set/v1/ground_truth.json` | 70 labeled gaps |
| `data/eval-set/v1/events-labeled.json` | event-level labels for 10–15 patients |
| `data/eval-set/v1/negatives.json` | explicit must-not-flag cases |
| `data/eval-set/v1/MANIFEST.md` | version, seed, checksum, freeze statement |

## Gate — exit criteria

- [ ] 70 gap labels, 28/22/20 split, all doc ids resolve.
- [ ] 10–15 patients have event-level labels covering ≥120 events.
- [ ] Every hard-negative category in Phase 2 has a corresponding negative label.
- [ ] Manifest records checksum + seed.
- [ ] A second person (or a fresh read) can reproduce the count from the manifest alone.
- [ ] No file in `v1/` has been edited after the first detector run.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Label leakage (writing labels while watching outputs) | Author from manifest first, freeze, then run detectors |
| Silent post-hoc edits | v1 is append-only; corrections become v2 with a changelog |
| Missing negatives | Gate requires each hard-negative category to be labeled |
| Labels too coarse to score matching | Every label carries explicit doc ids for the matching rule |

## Handoff to Phase 4

Phase 4 builds the event model that Phase 5's extraction must populate. The event labels here define what "correct extraction" means; keep them in sync if the schema naming shifts (it should not — Phase 0 froze it).
