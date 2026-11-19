# Q&A bridge

- "Doesn't Epic already do this?" — Epic and HIEs move and organize records.
  Continua targets the synthesis step after records arrive: identifying
  unresolved cross-provider coordination issues, grounding them to source
  evidence, and prioritizing them for coordinator review.
- "Is this just an LLM wrapper?" — No. The LLM performs only structured event
  extraction. Gap detection, evidence verification, and intervention priority are
  deterministic and independently evaluated.
- "How do you know it is right?" — We evaluate against a frozen synthetic
  benchmark with planted ground truth, held-out patients, adversarial negative
  cases, and source-grounding checks.
- "Would you deploy this in a hospital?" — Not as-is. This is a synthetic-data
  prototype. Real deployment would require EHR integration, security and privacy
  controls, clinical validation, governance, and prospective testing.
- "What does the coordinator actually do?" — Continua surfaces the issue and
  supporting evidence. The coordinator verifies it and decides the workflow
  action. Continua doesn't diagnose or determine treatment.
