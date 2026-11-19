# Responsible Ranking

## The claim

`priority-v1` orders **verified coordination work**. It is not a clinical
prediction. It has no training data, no learned coefficients, and no outcome
label.

The language contract is part of the implementation:

- Say "Intervention priority", "workflow urgency", or "P1 · Act first."
- Do not say "clinical risk", "patient risk", "danger score", or "AI risk."
- Do not say "only these five patients need care." Say "the queue surfaces the
  five highest-ranked verified coordination items first."
- `NONE` means no verified gap. It does not mean low risk.

## Prohibited inputs

The priority layer cannot read:

- name, age, sex, race, ethnicity, ZIP, insurance, or income
- primary diagnosis or cancer type
- provider or hospital identity
- historical utilization or cost
- free text or raw documents
- ground-truth labels at runtime

Demographic substitution tests produce byte-identical scores, ranks, and top
gaps. Display labels affect only the name shown in the queue.

## No oncology bonus

Maria's oncology follow-up is scored by the same severity, overdue, and
actionability factors as every other gap. Changing her specialty metadata while
holding the workflow fields fixed leaves the gap score unchanged.

## No patient-specific exception

`lib/priority` contains no synthetic patient ID, no Maria branch, and no named
override. Validation Gate J scans for both the fixture key and the patient UUID.
The frozen formula produces Maria's score; her rank is whatever the panel says.

Measured result: Maria scores **69 / P2** and ranks **27 of 80**. The demo must
not claim she is #1.

## Secondary-gap cap

The cap prevents alert volume from manufacturing priority. Twenty weak gaps add
at most `0.30` raw, less than a single high-severity overdue follow-up at
`1.40`.

## Deterministic order

Ties resolve by score, top-gap raw, overdue days, verified-gap count, then
patient ID byte order. No locale, name, insertion order, or randomness is used.

## Limitations

- Synthetic data only.
- Workflow weights are product policy, not clinically validated coefficients.
- The queue has no real-world coordinator adjudication to validate against.
- A verified absence means "not found in available records," not proof that care
  did not happen elsewhere.
- Priority is only as current as the verified-gap set hash. A changed event
  store requires recomputation.
