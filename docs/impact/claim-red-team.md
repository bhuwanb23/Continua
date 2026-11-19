# Claim red-team

Each attack is tested against what the product actually shows. Where a surface could
support a hostile reading, the copy was changed or the claim scoped.

## Attack A — "You're claiming this works clinically."

Surface: `/evaluation`, `/insights`, `/demo`, README.
Defense: every measured claim carries `continua-benchmark-v1` scope; limitations panel
states synthetic data and no clinical validation; priority copy says "workflow
priority, not clinical risk". No surface says "clinically validated". Banned-phrase
audit covers this string.

**Result: PASS.**

## Attack B — "You're calling cached retrieval AI latency."

Defense: `/evaluation` shows "Live single-patient pipeline: Not measured" beside
"Cached queue API: 1.6514 ms p50", with copy stating cached reads are coordinator
read-path latency, not AI processing. The impact model has no latency input, and
`tests/impact/imp.test.ts` asserts that.

**Result: PASS.**

## Attack C — "You picked only your successful cases."

Defense: the run is the frozen final held-out partition with 41 truth gaps; benchmark
identity, partition, run id, and dataset are printed on the page; the funnel derives
from the same aggregate artifacts.

**Result: PASS.**

## Attack D — "You hide false positives."

Defense: per-detector table shows TP/FP/FN and n; hard-negative scorecard reports
29/29 across 11 families; naive baseline's weaker precision and 0.62 hard-negative
rate are shown rather than omitted.

**Result: PASS.**

## Attack E — "100% grounding means 100% accuracy?"

Defense: headline card labels the metric "Displayed-gap grounding" with the sample and
explicit "all required evidence checks passed in this run"; a paragraph separates
grounding from clinical accuracy; normalization accuracy 29.5% is shown as a weakness.

**Result: PASS.**

## Attack F — "Your business savings are made up."

Defense: `/insights` shows the formula, four editable assumptions, an assumption
ledger, and the sentence "Not measured". No dollars are produced. The legacy 13.2-hour
figure is disclosed as superseded.

**Result: PASS**, with a residual caveat: the 8 → 6 minute assumption has no external
or internal empirical support. It is labeled as a scenario assumption, not evidence.

## Attack G — "Your dataset makes your rules look good."

Defense: limitations state synthetic templates, artificial prevalence, and that
fixture replay hides live extraction loss; oracle and E2E match is explained as
plumbing validation, not robustness.

**Result: PASS.**

## Attack H — "Why should I trust your metrics?"

Defense: frozen run id, reproducible artifacts, 2 identical repeat executions, 10/10
frozen gates, claim registry validated against the cached evaluation artifact, and a
disclosed funnel defect where the artifact is inconsistent.

**Result: PASS.**

## Attack I — "Does the demo's 13.33 hours come from the benchmark?"

Defense: no. The benchmark measures detection/grounding/priority; the impact page
labels its figure MODELED and links to the evaluation page for measured results.

**Result: PASS.**
