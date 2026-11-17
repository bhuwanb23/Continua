# Adversarial cases — continua-synth-v1

## Families (HN-01 … HN-15)

13 families appear in `negative_manifest.json` (all expected `no_gap`). HN-02 and HN-11 are adversarial positives and therefore appear in `ground_truth.json` instead.

Each family is planted at least once and is asserted by `tests/negatives/negatives.test.ts`.

## What each family guards against

- **HN-01 / HN-03 / HN-10 / HN-11** — off-by-one date and window arithmetic.
- **HN-02** — specialty-name confusion.
- **HN-04 / HN-09 / HN-13 / HN-14 / HN-15** — partial or noisy real-world data (telehealth wording, aliases, partial dates, unknown providers, explicit statuses).
- **HN-05 / HN-06 / HN-07** — duplicate detection that must not over-fire on serial orders, wide gaps, or different body regions.
- **HN-08** — monitoring stopped early.
- **HN-12** — document duplication must not become an event duplication.

## Mutation testing

`tests/mutations/mutations.test.ts` flips one property at a time and expects the derived truth to flip logically (e.g. adding a qualifying consult removes a missed follow-up).

## Hard-negative count

≥10 distinct families are present (15 defined; 13 negative + 2 adversarial-positive).
