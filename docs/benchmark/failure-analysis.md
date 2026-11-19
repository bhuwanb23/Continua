# Failure Analysis

Final held-out run: `benchmark-20261119-1400-14edc3e-final`.

- Truth gaps: 41
- Lost truth gaps: 0
- False positives: 0
- False negatives: 0
- Hard-negative pass rate: 100%
- Corruption cases rejected: 6/6

Failure funnel:
- Truth gaps: 41
- Support events extracted: 41
- Correct candidates: 41
- Verified gaps: 41
- Ranked gaps: 41
- Top-K truth patients: 5/5

Attribution:
- End-to-end path retained every truth gap in this fixture-replay run.
- No failures were attributed to extraction, normalization, detection, evidence, or priority.

Interpretation:
- This validates the funnel and matching plumbing on frozen fixture extraction.
- It is not evidence of live extractor reliability because no live provider was configured.
- Medication monitoring in the naive baseline remains 0 because the naive baseline does not implement monitoring; this is a baseline limitation, not a system failure.
