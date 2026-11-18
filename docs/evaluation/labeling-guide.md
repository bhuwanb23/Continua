# Labeling Guide — continua-eval-v1

## Source of truth

Every label derives from frozen Phase 2 scenario truth:

- `data/eval-set/continua-eval-v1/ground_truth.json` — planted-gap labels.
- `data/eval-set/continua-eval-v1/negative_manifest.json` — declared no-gap scenarios.
- `data/eval-set/continua-eval-v1/extraction_gold.json` — event-level gold.
- `data/generator/truth-events/truth-events.json` — the deterministic event manifest used to explain each label.

Phase 3 adds `benchmark-contracts.json`. It enriches the Phase 2 labels with identity, temporal arithmetic, evidence ids, difficulty, and rationale. It does **not** change a gap type, patient, trigger, document set, negative outcome, or gold event. The Phase 2 label files remain byte-identical and are hash-pinned.

## Absolute rules

1. **Never derive a label from pipeline output.** Run the generator and truth manifest, then label. Do not inspect detector output and write labels to match it.
2. **Never move a label to improve a metric.** If recall is low, fix the pipeline or report the low number.
3. **One occurrence, one truth gap.** Two same-type gaps on one patient must have distinct identities.
4. **Hard negatives are first-class.** A no-gap scenario is labelled with the same care as a planted gap.
5. **Extraction is labelled separately.** A gap can be missed because extraction failed; that is not the same failure as gap reasoning.

## Missed follow-up

- Trigger: the referral event.
- Identity: normalized specialty (and the trigger event).
- Window: the referral’s expected window in days.
- Due date: trigger date + window.
- Gap exists when the evaluation clock is after the due date and no qualifying consult/follow-up with the same specialty occurred in `[trigger date, due date]`.
- Wrong-specialty encounters do **not** satisfy the referral. A cardiology referral with only a PCP visit remains a gap.
- A referral not yet due is a hard negative, never a gap.

## Duplicate test

- Identity: normalized lab test, or imaging modality + body region.
- Window: 14 days.
- Event pair: the trigger event plus the repeated event’s document(s).
- Explicit serial monitoring (`series_status = explicit_series`) is not a duplicate.
- Same-day same-provider same-test ordering is treated as one order and is not a duplicate.
- Same modality with a different body region is not a duplicate.

## Medication monitoring

- Identity: normalized drug + monitoring target + trigger event.
- Examples: metformin → A1c or BMP within 90 days; warfarin → INR within 7 days; tamoxifen/anastrozole → oncology consult within 365 days.
- Stopping the medication before the window closes removes the gap.
- A qualifying result on the due date is inside the window.
- Alias-normalized results count (for example HbA1c for A1c).

## Extraction gold

Gold events are scored on fields downstream reasoning depends on:

- event existence and event type,
- date and date precision,
- normalized test, drug, specialty, or imaging identity,
- provider/status/window fields that determine gap logic,
- source document identity and verbatim evidence span.

Do not score prose quality. Do not add events that are not in the frozen truth manifest.

## Difficulty

Every gap, negative, and gold event carries `EASY`, `MEDIUM`, or `HARD`. Difficulty is copied from the frozen patient/scenario metadata; it is not re-scored by the evaluator. This supports per-difficulty reporting without changing aggregate labels.
