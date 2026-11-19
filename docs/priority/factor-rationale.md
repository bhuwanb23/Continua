# Factor Rationale

Phase 8 freezes three factors, not five.

## Severity

Represents frozen workflow significance. It is a product-policy weight, not a
medical coefficient. `high = 1.00`, `medium = 0.70`, `low = 0.45`.

## Overdue duration

An unresolved item should generally rise with time. Buckets keep the behavior
explainable and avoid false precision. Duplicate tests do not have an overdue
concept; their interval belongs to detector eligibility, so the temporal factor
is neutral `1.00`.

The full bucket table is in `formula.md`.

## Actionability

The coordinator can act directly on missed follow-ups and medication
monitoring. Repeat-test review usually needs a provider conversation, so it gets
a lower but nonzero weight.

| gap type | class | weight |
|---|---|---:|
| missed follow-up | direct coordinator action | 1.00 |
| medication monitoring | direct coordinator action | 0.95 |
| duplicate test | review with provider | 0.85 |

## Excluded: evidence confidence

Phase 7 already made evidence binary at the critical threshold. A ranked gap has
verified documents, ownership, spans, fields, absence, policy, and 100% required
claims. Adding an extraction-confidence multiplier would let poorly calibrated
model output move patient order after the trust gate. `priority-v1` therefore
uses evidence as an eligibility condition, not a score.

Exact and fuzzy accepted spans produce the same priority. This is tested
explicitly.

## Excluded: gap-type weight

Severity and actionability already encode the operational difference between
workflow items. A separate gap-type weight would imply a clinical hierarchy the
project cannot defend. All three types use `gap_type_weight = 1.00`, which is
equivalent to omitting the factor.

## Excluded: patient attributes

Name, age, sex, race, ethnicity, ZIP, insurance, income, provider, hospital,
and primary diagnosis are not inputs. Oncology does not receive a bonus.
