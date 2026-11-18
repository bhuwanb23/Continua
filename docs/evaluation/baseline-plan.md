# Baseline and Ablation Plan — continua-eval-v1

Phase 3 defines baselines; it does not run them and does not report baseline numbers. Any future baseline result must be produced by `scripts/eval.ts` on a frozen partition and stored under `artifacts/eval/<run-id>/`.

## Baseline 0 — predict nothing

Purpose: establish the floor and prove recall/F1 handling.

Expected shape: recall 0 for every gap type that has truth, F1 0, precision null where no predictions exist, hard-negative pass rate 1.0. This is a valid sanity check, not a good system.

## Baseline 1 — naive keyword rules

Purpose: demonstrate why surface keyword matching is insufficient.

Example behaviour: flag any document containing “referral” with no “consult” in the same document. This should generate substantial false positives on completed referrals, wrong-specialty neighbours, and referrals inside the window. Report precision, recall, hard-negative pass rate, and the dominant failure codes.

## Baseline 2 — LLM-only free-form judgment

Purpose: compare a hybrid extraction + deterministic reasoning system against an unconstrained document-to-gaps approach.

The baseline receives the same documents and frozen clock, emits the same prediction contract, and is scored with the same matcher and grounding checks. It gets no special schema or hidden truth. Report whether it grounds citations and whether it survives hard negatives.

## Ablations for later phases

| Ablation | Question |
|---|---|
| Full system | Reference implementation. |
| Without normalization | How much do test/drug/specialty aliases matter? |
| Without negative safeguards | How much precision is lost to explicit series, stopped meds, and not-yet-due referrals? |
| LLM-only detector | Is deterministic gap reasoning actually better than free-form judgment? |
| Without evidence suppression | What would reach the UI ungrounded? |

## Reporting rules

- Use the same predictions contract and evaluator for every baseline.
- Keep live and cached latency separate.
- Report the partition and eval version with every number.
- Do not tune the benchmark after seeing a baseline.
- Do not compare a baseline on `dev` with a full system on `final` as if the partitions were equivalent.
